import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.campaign_mapping import CampaignMapping
from app.models.user import User
from app.schemas.campaign_mapping import (
    CampaignMappingCreate,
    CampaignMappingResponse,
    CampaignMappingUpdate,
)
from app.services.rbac import require_admin

router = APIRouter()


@router.get("", response_model=list[CampaignMappingResponse])
async def list_campaign_mappings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_admin(current_user)
    result = await db.execute(
        select(CampaignMapping)
        .where(CampaignMapping.is_active == True)
        .order_by(CampaignMapping.priority.asc())
    )
    return result.scalars().all()


@router.post(
    "",
    response_model=CampaignMappingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_campaign_mapping(
    body: CampaignMappingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_admin(current_user)

    mapping = CampaignMapping(
        contains_text=body.contains_text,
        project_type_key=body.project_type_key,
        priority=body.priority,
    )
    db.add(mapping)
    await db.flush()
    await db.refresh(mapping)
    return mapping


@router.patch("/{mapping_id}", response_model=CampaignMappingResponse)
async def update_campaign_mapping(
    mapping_id: uuid.UUID,
    body: CampaignMappingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_admin(current_user)

    result = await db.execute(
        select(CampaignMapping).where(CampaignMapping.id == mapping_id)
    )
    mapping = result.scalar_one_or_none()
    if not mapping:
        raise HTTPException(status_code=404, detail="מיפוי קמפיין לא נמצא")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(mapping, key, value)

    await db.flush()
    await db.refresh(mapping)
    return mapping


@router.delete("/{mapping_id}")
async def delete_campaign_mapping(
    mapping_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_admin(current_user)

    result = await db.execute(
        select(CampaignMapping).where(CampaignMapping.id == mapping_id)
    )
    mapping = result.scalar_one_or_none()
    if not mapping:
        raise HTTPException(status_code=404, detail="מיפוי קמפיין לא נמצא")

    mapping.is_active = False
    await db.flush()
    return {"message": "מיפוי הקמפיין הושבת בהצלחה"}
