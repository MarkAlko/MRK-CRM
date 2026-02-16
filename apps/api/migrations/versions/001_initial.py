"""Initial migration

Revision ID: 001
Revises:
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum types
    user_role = sa.Enum("admin", "qualifier", "closer", name="user_role")
    user_role.create(op.get_bind(), checkfirst=True)

    lead_source = sa.Enum("meta_form", "landing_page", "manual", name="lead_source")
    lead_source.create(op.get_bind(), checkfirst=True)

    lead_temperature = sa.Enum("hot", "warm", "cold", name="lead_temperature")
    lead_temperature.create(op.get_bind(), checkfirst=True)

    lead_status = sa.Enum(
        "new_lead", "initial_call_done", "fit_for_meeting", "meeting_scheduled",
        "meeting_done", "offer_sent", "negotiation", "won", "lost", "irrelevant",
        name="lead_status"
    )
    lead_status.create(op.get_bind(), checkfirst=True)

    activity_type = sa.Enum("call", "meeting", "note", "offer_sent", name="activity_type")
    activity_type.create(op.get_bind(), checkfirst=True)

    offer_status = sa.Enum("draft", "sent", "negotiation", "approved", "rejected", name="offer_status")
    offer_status.create(op.get_bind(), checkfirst=True)

    # Users table
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("admin", "qualifier", "closer", name="user_role", create_type=False), nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Project types table
    op.create_table(
        "project_types",
        sa.Column("id", sa.SmallInteger(), primary_key=True, autoincrement=True),
        sa.Column("key", sa.String(50), unique=True, nullable=False),
        sa.Column("display_name_he", sa.String(100), nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True, nullable=False),
    )

    # Leads table
    op.create_table(
        "leads",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("project_type_id", sa.SmallInteger(), sa.ForeignKey("project_types.id"), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(30), nullable=False),
        sa.Column("normalized_phone", sa.String(20), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("source", sa.Enum("meta_form", "landing_page", "manual", name="lead_source", create_type=False), nullable=False),
        sa.Column("campaign_name", sa.String(500), nullable=True),
        sa.Column("adset_name", sa.String(500), nullable=True),
        sa.Column("ad_name", sa.String(500), nullable=True),
        sa.Column("city", sa.String(255), nullable=True),
        sa.Column("street", sa.String(255), nullable=True),
        sa.Column("temperature", sa.Enum("hot", "warm", "cold", name="lead_temperature", create_type=False), nullable=True),
        sa.Column("status", sa.Enum(
            "new_lead", "initial_call_done", "fit_for_meeting", "meeting_scheduled",
            "meeting_done", "offer_sent", "negotiation", "won", "lost", "irrelevant",
            name="lead_status", create_type=False
        ), nullable=False),
        sa.Column("qualifier_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("closer_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        # Bot fields
        sa.Column("bot_payload", JSONB, nullable=True),
        sa.Column("bot_track", sa.String(50), nullable=True),
        sa.Column("bot_completed", sa.Boolean(), default=False, nullable=False),
        # Common qualification fields
        sa.Column("start_timeline", sa.String(100), nullable=True),
        sa.Column("plans_status", sa.String(100), nullable=True),
        sa.Column("permit_status", sa.String(100), nullable=True),
        sa.Column("building_type", sa.String(100), nullable=True),
        sa.Column("site_access", sa.String(100), nullable=True),
        sa.Column("estimated_size_bucket", sa.String(100), nullable=True),
        sa.Column("is_occupied", sa.String(50), nullable=True),
        # Mamad
        sa.Column("mamad_variant", sa.String(100), nullable=True),
        # Private home
        sa.Column("private_stage", sa.String(100), nullable=True),
        sa.Column("private_special_struct", JSONB, nullable=True),
        # Architecture
        sa.Column("arch_service", sa.String(100), nullable=True),
        sa.Column("arch_property_type", sa.String(100), nullable=True),
        sa.Column("arch_planning_stage", sa.String(100), nullable=True),
        sa.Column("arch_existing_docs", JSONB, nullable=True),
        # Renovation
        sa.Column("reno_type", sa.String(100), nullable=True),
        sa.Column("reno_has_plan", sa.String(50), nullable=True),
        # Timestamps
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # Indexes on leads
    op.create_index("ix_leads_normalized_phone", "leads", ["normalized_phone"])
    op.create_index("ix_leads_project_type_status", "leads", ["project_type_id", "status"])
    op.create_index("ix_leads_closer_status", "leads", ["closer_id", "status"])

    # Lead status history table
    op.create_table(
        "lead_status_history",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("lead_id", UUID(as_uuid=True), sa.ForeignKey("leads.id", ondelete="CASCADE"), nullable=False),
        sa.Column("from_status", sa.String(50), nullable=True),
        sa.Column("to_status", sa.String(50), nullable=False),
        sa.Column("changed_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("changed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Activities table
    op.create_table(
        "activities",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("lead_id", UUID(as_uuid=True), sa.ForeignKey("leads.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.Enum("call", "meeting", "note", "offer_sent", name="activity_type", create_type=False), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Offers table
    op.create_table(
        "offers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("lead_id", UUID(as_uuid=True), sa.ForeignKey("leads.id", ondelete="CASCADE"), nullable=False),
        sa.Column("file_path", sa.String(500), nullable=False),
        sa.Column("amount_estimated", sa.Numeric(12, 2), nullable=True),
        sa.Column("status", sa.Enum("draft", "sent", "negotiation", "approved", "rejected", name="offer_status", create_type=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # Campaign mappings table
    op.create_table(
        "campaign_mappings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("contains_text", sa.String(500), nullable=False),
        sa.Column("project_type_key", sa.String(50), nullable=False),
        sa.Column("priority", sa.Integer(), default=100, nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("campaign_mappings")
    op.drop_table("offers")
    op.drop_table("activities")
    op.drop_table("lead_status_history")
    op.drop_index("ix_leads_closer_status", table_name="leads")
    op.drop_index("ix_leads_project_type_status", table_name="leads")
    op.drop_index("ix_leads_normalized_phone", table_name="leads")
    op.drop_table("leads")
    op.drop_table("project_types")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS offer_status")
    op.execute("DROP TYPE IF EXISTS activity_type")
    op.execute("DROP TYPE IF EXISTS lead_status")
    op.execute("DROP TYPE IF EXISTS lead_temperature")
    op.execute("DROP TYPE IF EXISTS lead_source")
    op.execute("DROP TYPE IF EXISTS user_role")
