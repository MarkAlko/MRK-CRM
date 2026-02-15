import math
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.lead import Lead, LeadStatus
from app.models.lead_status_history import LeadStatusHistory
from app.models.project_type import ProjectType
from app.models.user import User, UserRole
from app.schemas.lead import (
    LeadAssignCloser,
    LeadCreate,
    LeadListResponse,
    LeadResponse,
    LeadTransition,
    LeadUpdate,
)
from app.services.phone import normalize_phone
from app.services.rbac import check_lead_list_access, check_lead_transition

router = APIRouter()


@router.get("", response_model=LeadListResponse)
async def list_leads(
    project_type_key: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    assignee: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    bot_completed: Optional[bool] = Query(None),
    temperature: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Lead)

    if project_type_key:
        pt_result = await db.execute(
            select(ProjectType).where(ProjectType.key == project_type_key)
        )
        pt = pt_result.scalar_one_or_none()
        if pt:
            query = query.where(Lead.project_type_id == pt.id)

    if status_filter:
        try:
            ls = LeadStatus(status_filter)
            query = query.where(Lead.status == ls)
        except ValueError:
            pass

    if temperature:
        query = query.where(Lead.temperature == temperature)

    if source:
        query = query.where(Lead.source == source)

    if bot_completed is not None:
        query = query.where(Lead.bot_completed == bot_completed)

    if assignee:
        try:
            assignee_id = uuid.UUID(assignee)
            query = query.where(
                or_(Lead.qualifier_id == assignee_id, Lead.closer_id == assignee_id)
            )
        except ValueError:
            pass

    if search:
        search_term = f"%{search}%"
        normalized_search = normalize_phone(search) if search.replace("+", "").replace("-", "").replace(" ", "").isdigit() else None
        conditions = [
            Lead.full_name.ilike(search_term),
        ]
        if normalized_search:
            conditions.append(Lead.normalized_phone.like(f"%{normalized_search}%"))
        else:
            conditions.append(Lead.email.ilike(search_term))
        query = query.where(or_(*conditions))

    # RBAC filtering
    if current_user.role == UserRole.closer:
        query = query.where(Lead.closer_id == current_user.id)
    elif current_user.role == UserRole.qualifier:
        query = query.where(
            or_(
                Lead.qualifier_id == None,
                Lead.qualifier_id == current_user.id,
                Lead.status == LeadStatus.new_lead,
            )
        )

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    query = query.order_by(Lead.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    leads = result.scalars().all()

    return LeadListResponse(
        items=[LeadResponse.model_validate(lead) for lead in leads],
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def create_lead(
    body: LeadCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    normalized = normalize_phone(body.phone)

    lead = Lead(
        project_type_id=body.project_type_id,
        full_name=body.full_name,
        phone=body.phone,
        normalized_phone=normalized,
        email=body.email,
        source=body.source,
        campaign_name=body.campaign_name,
        adset_name=body.adset_name,
        ad_name=body.ad_name,
        city=body.city,
        street=body.street,
        temperature=body.temperature,
        status=LeadStatus.new_lead,
    )
    db.add(lead)
    await db.flush()
    await db.refresh(lead)

    history = LeadStatusHistory(
        lead_id=lead.id,
        from_status=None,
        to_status=LeadStatus.new_lead.value,
        changed_by=current_user.id,
    )
    db.add(history)
    await db.flush()

    return lead


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ליד לא נמצא",
        )
    return lead


@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: uuid.UUID,
    body: LeadUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ליד לא נמצא",
        )

    update_data = body.model_dump(exclude_unset=True)

    if "phone" in update_data:
        update_data["normalized_phone"] = normalize_phone(update_data["phone"])

    for key, value in update_data.items():
        setattr(lead, key, value)

    await db.flush()
    await db.refresh(lead)
    return lead


@router.post("/{lead_id}/transition", response_model=LeadResponse)
async def transition_lead(
    lead_id: uuid.UUID,
    body: LeadTransition,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ליד לא נמצא",
        )

    check_lead_transition(current_user, lead.status, body.to_status)

    old_status = lead.status
    lead.status = body.to_status

    history = LeadStatusHistory(
        lead_id=lead.id,
        from_status=old_status.value,
        to_status=body.to_status.value,
        changed_by=current_user.id,
    )
    db.add(history)
    await db.flush()
    await db.refresh(lead)
    return lead


@router.post("/{lead_id}/assign-closer", response_model=LeadResponse)
async def assign_closer(
    lead_id: uuid.UUID,
    body: LeadAssignCloser,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in (UserRole.admin, UserRole.qualifier):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="אין הרשאה לשייך סוגר",
        )

    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ליד לא נמצא",
        )

    closer_result = await db.execute(
        select(User).where(User.id == body.closer_id, User.role == UserRole.closer)
    )
    closer = closer_result.scalar_one_or_none()
    if not closer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="סוגר לא נמצא",
        )

    lead.closer_id = body.closer_id
    if not lead.qualifier_id:
        lead.qualifier_id = current_user.id

    await db.flush()
    await db.refresh(lead)
    return lead
