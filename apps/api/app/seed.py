"""Seed data script for MRK CRM."""
import asyncio
import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory
from app.models.activity import Activity, ActivityType
from app.models.campaign_mapping import CampaignMapping
from app.models.lead import Lead, LeadSource, LeadStatus, LeadTemperature
from app.models.lead_status_history import LeadStatusHistory
from app.models.project_type import ProjectType
from app.models.user import User, UserRole
from app.services.auth import hash_password
from app.services.phone import normalize_phone

CITIES = ["תל אביב", "ירושלים", "חיפה", "ראשון לציון", "פתח תקווה", "אשדוד", "נתניה", "באר שבע", "הרצליה", "רעננה"]
STREETS = ["הרצל", "רוטשילד", "בן גוריון", "ויצמן", "ז'בוטינסקי", "סוקולוב", "אלנבי", "דיזנגוף"]
NAMES = [
    "דוד כהן", "שרה לוי", "יוסף מזרחי", "רחל אברהם", "משה ישראלי",
    "מירב דהן", "עמית גולן", "נועה פרידמן", "אלון ברק", "הדר שלום",
    "יעל רוזנברג", "אורי טל", "ליאת מלכה", "איתן שמש", "מאיה קדוש",
    "גיא ברוך", "שירה עוז", "רון חיים", "תמר שושני", "ניר דביר",
    "אביגיל נחום", "עידו זהר", "לירון קפלן", "דנה סגל", "אסף ביטון",
    "יהודית גרין", "בועז ירון", "קרן חן", "עומר לביא", "מיכל ריף",
]

STATUSES = list(LeadStatus)
ACTIVE_STATUSES = [s for s in STATUSES if s not in (LeadStatus.won, LeadStatus.lost, LeadStatus.irrelevant)]


def random_phone():
    return f"05{random.randint(0, 9)}{random.randint(1000000, 9999999)}"


async def seed():
    async with async_session_factory() as db:
        # Check if already seeded
        result = await db.execute(select(User).limit(1))
        if result.scalar_one_or_none():
            print("Database already seeded. Skipping.")
            return

        # Project types
        project_types = [
            ProjectType(id=1, key="mamad", display_name_he="ממ״ד", is_active=True),
            ProjectType(id=2, key="private_home", display_name_he="בנייה פרטית", is_active=True),
            ProjectType(id=3, key="renovation", display_name_he="עבודות גמר", is_active=True),
            ProjectType(id=4, key="architecture", display_name_he="אדריכלות / רישוי / עיצוב פנים", is_active=True),
        ]
        for pt in project_types:
            db.add(pt)
        await db.flush()

        # Users
        admin = User(
            name="מנהל ראשי",
            email="admin@mrk.co.il",
            password_hash=hash_password("Admin123!"),
            role=UserRole.admin,
        )
        qualifier = User(
            name="מוקדן ראשי",
            email="qualifier@mrk.co.il",
            password_hash=hash_password("Qual123!"),
            role=UserRole.qualifier,
        )
        closer = User(
            name="סוגר ראשי",
            email="closer@mrk.co.il",
            password_hash=hash_password("Close123!"),
            role=UserRole.closer,
        )
        db.add_all([admin, qualifier, closer])
        await db.flush()

        # Campaign mappings
        mappings = [
            CampaignMapping(contains_text='ממ"דים', project_type_key="mamad", priority=10),
            CampaignMapping(contains_text="בניה פרטית", project_type_key="private_home", priority=20),
            CampaignMapping(contains_text="עבודות גמר", project_type_key="renovation", priority=30),
            CampaignMapping(contains_text="אדריכלות", project_type_key="architecture", priority=40),
        ]
        db.add_all(mappings)
        await db.flush()

        # Leads
        temperatures = [LeadTemperature.hot, LeadTemperature.warm, LeadTemperature.cold, None]
        sources = [LeadSource.meta_form, LeadSource.landing_page, LeadSource.manual]

        for i in range(30):
            phone = random_phone()
            pt_id = (i % 4) + 1
            status_idx = i % len(ACTIVE_STATUSES)
            lead_status = ACTIVE_STATUSES[status_idx]

            # Some won/lost for variety
            if i >= 25:
                lead_status = random.choice([LeadStatus.won, LeadStatus.lost, LeadStatus.irrelevant])

            lead = Lead(
                project_type_id=pt_id,
                full_name=NAMES[i % len(NAMES)],
                phone=phone,
                normalized_phone=normalize_phone(phone),
                email=f"lead{i+1}@example.com" if i % 3 == 0 else None,
                source=sources[i % len(sources)],
                city=random.choice(CITIES),
                street=random.choice(STREETS) if i % 2 == 0 else None,
                temperature=random.choice(temperatures),
                status=lead_status,
                qualifier_id=qualifier.id if i % 3 != 2 else None,
                closer_id=closer.id if status_idx > 2 else None,
                bot_completed=i % 5 == 0,
                created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30)),
            )
            db.add(lead)
            await db.flush()
            await db.refresh(lead)

            # Status history
            history = LeadStatusHistory(
                lead_id=lead.id,
                from_status=None,
                to_status=LeadStatus.new_lead.value,
                changed_by=admin.id,
            )
            db.add(history)

            if lead_status != LeadStatus.new_lead:
                history2 = LeadStatusHistory(
                    lead_id=lead.id,
                    from_status=LeadStatus.new_lead.value,
                    to_status=lead_status.value,
                    changed_by=qualifier.id if lead_status not in (LeadStatus.won, LeadStatus.lost) else closer.id,
                )
                db.add(history2)

            # Some activities
            if i % 2 == 0:
                activity = Activity(
                    lead_id=lead.id,
                    type=random.choice(list(ActivityType)),
                    description=f"פעילות דוגמה מס׳ {i+1}",
                    created_by=qualifier.id,
                )
                db.add(activity)

        await db.commit()
        print("Seed data created successfully!")
        print("Users:")
        print("  admin@mrk.co.il / Admin123!")
        print("  qualifier@mrk.co.il / Qual123!")
        print("  closer@mrk.co.il / Close123!")


if __name__ == "__main__":
    asyncio.run(seed())
