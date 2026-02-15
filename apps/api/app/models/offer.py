import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class OfferStatus(str, enum.Enum):
    draft = "draft"
    sent = "sent"
    negotiation = "negotiation"
    approved = "approved"
    rejected = "rejected"


class Offer(Base):
    __tablename__ = "offers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    lead_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False
    )
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    amount_estimated: Mapped[float | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    status: Mapped[OfferStatus] = mapped_column(
        Enum(OfferStatus, name="offer_status"),
        nullable=False,
        default=OfferStatus.draft,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    lead = relationship("Lead", back_populates="offers")
