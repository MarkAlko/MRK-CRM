import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.activity import Activity
from app.models.lead import Lead
from app.models.user import User
from app.schemas.activity import ActivityCreate, ActivityResponse

router = APIRouter()


@router.get("/leads/{lead_id}/activities", response_model=list[ActivityResponse])
async def list_activities(
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

    result = await db.execute(
        select(Activity)
        .where(Activity.lead_id == lead_id)
        .order_by(Activity.created_at.desc())
    )
    return result.scalars().all()


@router.post(
    "/leads/{lead_id}/activities",
    response_model=ActivityResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_activity(
    lead_id: uuid.UUID,
    body: ActivityCreate,
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

    activity = Activity(
        lead_id=lead_id,
        type=body.type,
        description=body.description,
        created_by=current_user.id,
    )
    db.add(activity)
    await db.flush()
    await db.refresh(activity)
    return activity
