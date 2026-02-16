import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    SmallInteger,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class LeadSource(str, enum.Enum):
    meta_form = "meta_form"
    landing_page = "landing_page"
    manual = "manual"


class LeadTemperature(str, enum.Enum):
    hot = "hot"
    warm = "warm"
    cold = "cold"


class LeadStatus(str, enum.Enum):
    new_lead = "new_lead"
    initial_call_done = "initial_call_done"
    fit_for_meeting = "fit_for_meeting"
    meeting_scheduled = "meeting_scheduled"
    meeting_done = "meeting_done"
    offer_sent = "offer_sent"
    negotiation = "negotiation"
    won = "won"
    lost = "lost"
    irrelevant = "irrelevant"


class Lead(Base):
    __tablename__ = "leads"
    __table_args__ = (
        Index("ix_leads_normalized_phone", "normalized_phone"),
        Index("ix_leads_project_type_status", "project_type_id", "status"),
        Index("ix_leads_closer_status", "closer_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_type_id: Mapped[int] = mapped_column(
        SmallInteger, ForeignKey("project_types.id"), nullable=False
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    normalized_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source: Mapped[LeadSource] = mapped_column(
        Enum(LeadSource, name="lead_source"), nullable=False, default=LeadSource.manual
    )
    campaign_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    adset_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ad_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    city: Mapped[str | None] = mapped_column(String(255), nullable=True)
    street: Mapped[str | None] = mapped_column(String(255), nullable=True)
    temperature: Mapped[LeadTemperature | None] = mapped_column(
        Enum(LeadTemperature, name="lead_temperature"), nullable=True
    )
    status: Mapped[LeadStatus] = mapped_column(
        Enum(LeadStatus, name="lead_status"),
        nullable=False,
        default=LeadStatus.new_lead,
    )
    qualifier_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    closer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    # Bot fields
    bot_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    bot_track: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bot_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Common qualification fields
    start_timeline: Mapped[str | None] = mapped_column(String(100), nullable=True)
    plans_status: Mapped[str | None] = mapped_column(String(100), nullable=True)
    permit_status: Mapped[str | None] = mapped_column(String(100), nullable=True)
    building_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    site_access: Mapped[str | None] = mapped_column(String(100), nullable=True)
    estimated_size_bucket: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    is_occupied: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Mamad-specific
    mamad_variant: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Private home-specific
    private_stage: Mapped[str | None] = mapped_column(String(100), nullable=True)
    private_special_struct: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Architecture-specific
    arch_service: Mapped[str | None] = mapped_column(String(100), nullable=True)
    arch_property_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    arch_planning_stage: Mapped[str | None] = mapped_column(String(100), nullable=True)
    arch_existing_docs: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Renovation-specific
    reno_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    reno_has_plan: Mapped[str | None] = mapped_column(String(50), nullable=True)

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
    project_type = relationship("ProjectType", back_populates="leads", lazy="selectin")
    qualifier = relationship(
        "User", foreign_keys=[qualifier_id], lazy="selectin"
    )
    closer = relationship(
        "User", foreign_keys=[closer_id], lazy="selectin"
    )
    activities = relationship(
        "Activity", back_populates="lead", lazy="selectin", order_by="Activity.created_at.desc()"
    )
    offers = relationship(
        "Offer", back_populates="lead", lazy="selectin", order_by="Offer.created_at.desc()"
    )
    status_history = relationship(
        "LeadStatusHistory",
        back_populates="lead",
        lazy="selectin",
        order_by="LeadStatusHistory.changed_at.desc()",
    )
