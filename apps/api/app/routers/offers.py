import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.lead import Lead
from app.models.offer import Offer, OfferStatus
from app.models.user import User
from app.schemas.offer import OfferResponse, OfferUpdate

router = APIRouter()


@router.get("/leads/{lead_id}/offers", response_model=list[OfferResponse])
async def list_offers(
    lead_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="ליד לא נמצא")

    result = await db.execute(
        select(Offer)
        .where(Offer.lead_id == lead_id)
        .order_by(Offer.created_at.desc())
    )
    return result.scalars().all()


@router.post(
    "/leads/{lead_id}/offers",
    response_model=OfferResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_offer(
    lead_id: uuid.UUID,
    file: UploadFile = File(...),
    offer_status: str = Form("draft"),
    amount_estimated: float | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="ליד לא נמצא")

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="יש להעלות קובץ PDF בלבד",
        )

    try:
        offer_st = OfferStatus(offer_status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="סטטוס הצעה לא תקין",
        )

    offers_dir = os.path.join(settings.STORAGE_PATH, "offers")
    os.makedirs(offers_dir, exist_ok=True)

    file_id = str(uuid.uuid4())
    file_path = os.path.join(offers_dir, f"{file_id}.pdf")

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    offer = Offer(
        lead_id=lead_id,
        file_path=file_path,
        status=offer_st,
        amount_estimated=amount_estimated,
    )
    db.add(offer)
    await db.flush()
    await db.refresh(offer)
    return offer


@router.get("/offers/{offer_id}/download")
async def download_offer(
    offer_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Offer).where(Offer.id == offer_id))
    offer = result.scalar_one_or_none()
    if not offer:
        raise HTTPException(status_code=404, detail="הצעה לא נמצאה")

    if not os.path.exists(offer.file_path):
        raise HTTPException(status_code=404, detail="קובץ לא נמצא")

    return FileResponse(
        offer.file_path,
        media_type="application/pdf",
        filename=f"offer_{offer_id}.pdf",
    )


@router.patch("/offers/{offer_id}", response_model=OfferResponse)
async def update_offer(
    offer_id: uuid.UUID,
    body: OfferUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Offer).where(Offer.id == offer_id))
    offer = result.scalar_one_or_none()
    if not offer:
        raise HTTPException(status_code=404, detail="הצעה לא נמצאה")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(offer, key, value)

    await db.flush()
    await db.refresh(offer)
    return offer
