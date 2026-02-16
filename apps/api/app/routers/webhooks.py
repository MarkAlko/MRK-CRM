from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.campaign_mapping import CampaignMapping
from app.models.lead import Lead, LeadSource, LeadStatus
from app.models.lead_status_history import LeadStatusHistory
from app.models.project_type import ProjectType
from app.services.lead_mapping import map_bot_payload, resolve_track
from app.services.phone import normalize_phone

router = APIRouter()


async def _get_project_type_by_key(db: AsyncSession, key: str) -> int:
    result = await db.execute(select(ProjectType).where(ProjectType.key == key))
    pt = result.scalar_one_or_none()
    if pt:
        return pt.id
    # Default to renovation
    result = await db.execute(select(ProjectType).where(ProjectType.key == "renovation"))
    pt = result.scalar_one_or_none()
    return pt.id if pt else 3


async def _resolve_campaign_to_project_type(
    db: AsyncSession, campaign_name: str | None
) -> str:
    if not campaign_name:
        return "renovation"

    result = await db.execute(
        select(CampaignMapping)
        .where(CampaignMapping.is_active == True)
        .order_by(CampaignMapping.priority.asc())
    )
    mappings = result.scalars().all()

    campaign_lower = campaign_name.lower()
    for mapping in mappings:
        if mapping.contains_text.lower() in campaign_lower:
            return mapping.project_type_key

    return "renovation"


@router.post("/meta")
async def meta_webhook(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db),
):
    phone = payload.get("phone")
    if not phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="מספר טלפון חסר",
        )

    full_name = payload.get("full_name") or payload.get("name") or "ליד מטא"
    email = payload.get("email")
    campaign_name = payload.get("campaign_name") or payload.get("campaign")
    adset_name = payload.get("adset_name") or payload.get("adset")
    ad_name = payload.get("ad_name") or payload.get("ad")

    normalized = normalize_phone(str(phone))
    project_type_key = await _resolve_campaign_to_project_type(db, campaign_name)
    project_type_id = await _get_project_type_by_key(db, project_type_key)

    # Dedup: check for existing lead with same phone + project type within 30 days
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    result = await db.execute(
        select(Lead).where(
            and_(
                Lead.normalized_phone == normalized,
                Lead.project_type_id == project_type_id,
                Lead.created_at >= thirty_days_ago,
            )
        ).order_by(Lead.created_at.desc())
    )
    existing_lead = result.scalars().first()

    if existing_lead:
        # Update existing lead
        if campaign_name:
            existing_lead.campaign_name = campaign_name
        if adset_name:
            existing_lead.adset_name = adset_name
        if ad_name:
            existing_lead.ad_name = ad_name
        if email:
            existing_lead.email = email
        await db.flush()
        return {"status": "updated", "lead_id": str(existing_lead.id)}

    # Create new lead
    lead = Lead(
        project_type_id=project_type_id,
        full_name=full_name,
        phone=str(phone),
        normalized_phone=normalized,
        email=email,
        source=LeadSource.meta_form,
        campaign_name=campaign_name,
        adset_name=adset_name,
        ad_name=ad_name,
        status=LeadStatus.new_lead,
    )
    db.add(lead)
    await db.flush()
    await db.refresh(lead)

    history = LeadStatusHistory(
        lead_id=lead.id,
        from_status=None,
        to_status=LeadStatus.new_lead.value,
        changed_by=lead.id,  # system
    )
    db.add(history)
    await db.flush()

    return {"status": "created", "lead_id": str(lead.id)}


@router.post("/whatsapp")
async def whatsapp_webhook(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db),
):
    phone = payload.get("phone")
    if not phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="מספר טלפון חסר",
        )

    normalized = normalize_phone(str(phone))

    # Find most recent lead within 30 days
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    result = await db.execute(
        select(Lead).where(
            and_(
                Lead.normalized_phone == normalized,
                Lead.created_at >= thirty_days_ago,
            )
        ).order_by(Lead.created_at.desc())
    )
    lead = result.scalars().first()

    # Resolve track
    track_raw = payload.get("track")
    track = resolve_track(track_raw) if track_raw else None

    if not lead:
        # Create new lead
        project_type_key = track or "renovation"
        project_type_id = await _get_project_type_by_key(db, project_type_key)

        lead = Lead(
            project_type_id=project_type_id,
            full_name=payload.get("full_name", payload.get("name", "ליד בוט")),
            phone=str(phone),
            normalized_phone=normalized,
            source=LeadSource.manual,
            status=LeadStatus.new_lead,
        )
        db.add(lead)
        await db.flush()
        await db.refresh(lead)

        history = LeadStatusHistory(
            lead_id=lead.id,
            from_status=None,
            to_status=LeadStatus.new_lead.value,
            changed_by=lead.id,  # system
        )
        db.add(history)

    # Store raw payload
    lead.bot_payload = payload

    # Map structured fields
    answers = payload.get("answers", payload)
    if track:
        mapped = map_bot_payload(track, answers)
        for field, value in mapped.items():
            if hasattr(lead, field) and value is not None:
                setattr(lead, field, value)

    # Set bot_completed
    if payload.get("completed", False) or payload.get("bot_completed", False):
        lead.bot_completed = True
    elif track and answers:
        # Assume completed if we have track + substantial answers
        lead.bot_completed = True

    await db.flush()
    await db.refresh(lead)
    return {"status": "updated", "lead_id": str(lead.id)}
