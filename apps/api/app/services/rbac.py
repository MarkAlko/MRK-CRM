import uuid
from typing import Optional

from fastapi import HTTPException, status

from app.models.lead import LeadStatus
from app.models.user import User, UserRole

# Statuses that qualifiers can work with
QUALIFIER_VISIBLE_STATUSES = {
    LeadStatus.new_lead,
    LeadStatus.initial_call_done,
    LeadStatus.fit_for_meeting,
    LeadStatus.meeting_scheduled,
    LeadStatus.meeting_done,
    LeadStatus.offer_sent,
    LeadStatus.negotiation,
}

# Statuses that qualifiers cannot transition TO
QUALIFIER_FORBIDDEN_TARGET_STATUSES = {
    LeadStatus.won,
    LeadStatus.lost,
}

# Terminal statuses that only closers/admins can set
CLOSER_ONLY_STATUSES = {
    LeadStatus.won,
    LeadStatus.lost,
    LeadStatus.irrelevant,
}


def check_lead_list_access(
    user: User,
    lead_qualifier_id: Optional[uuid.UUID],
    lead_closer_id: Optional[uuid.UUID],
    lead_status: LeadStatus,
) -> bool:
    """
    Check if a user has access to view a specific lead based on RBAC rules.
    Returns True if accessible, False otherwise.
    """
    if user.role == UserRole.admin:
        return True

    if user.role == UserRole.qualifier:
        # Qualifier can see leads where:
        # 1) qualifier_id is null (unassigned), OR
        # 2) qualifier_id == me, OR
        # 3) status == new_lead
        if lead_status == LeadStatus.new_lead:
            return True
        if lead_qualifier_id is None:
            return True
        if lead_qualifier_id == user.id:
            return True
        return False

    if user.role == UserRole.closer:
        # Closer can see leads where closer_id == me
        if lead_closer_id == user.id:
            return True
        return False

    return False


def check_lead_transition(user: User, from_status: LeadStatus, to_status: LeadStatus) -> None:
    """
    Validate that the user can perform the given status transition.
    Raises HTTPException if not allowed.
    """
    if user.role == UserRole.admin:
        return  # Admin can do anything

    if user.role == UserRole.qualifier:
        if to_status in QUALIFIER_FORBIDDEN_TARGET_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="מסננים אינם רשאים לשנות סטטוס לזכייה או הפסד",
            )
        return

    if user.role == UserRole.closer:
        # Closer can transition including won/lost/irrelevant
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="אין הרשאה לבצע פעולה זו",
    )


def require_admin(user: User) -> None:
    """Raise 403 if user is not admin."""
    if user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="פעולה זו מותרת למנהלים בלבד",
        )


def require_role(user: User, *roles: UserRole) -> None:
    """Raise 403 if user does not have one of the required roles."""
    if user.role not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="אין הרשאה לבצע פעולה זו",
        )
