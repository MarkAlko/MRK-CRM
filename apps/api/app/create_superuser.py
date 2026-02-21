"""Create default superuser if it does not already exist."""
import asyncio

from sqlalchemy import select

from app.database import async_session_factory
from app.models.user import User, UserRole
from app.services.auth import hash_password

DEFAULT_ADMIN_EMAIL = "admin@mrk.co.il"
DEFAULT_ADMIN_PASSWORD = "123456"


async def create_default_superuser() -> None:
    async with async_session_factory() as db:
        result = await db.execute(
            select(User).where(User.email == DEFAULT_ADMIN_EMAIL)
        )
        existing = result.scalar_one_or_none()

        if existing is not None:
            print(f"Default superuser already exists: {DEFAULT_ADMIN_EMAIL}")
            return

        superuser = User(
            name="Admin",
            email=DEFAULT_ADMIN_EMAIL,
            password_hash=hash_password(DEFAULT_ADMIN_PASSWORD),
            role=UserRole.admin,
            is_active=True,
        )
        db.add(superuser)
        await db.commit()
        print(f"Default superuser created: {DEFAULT_ADMIN_EMAIL}")


if __name__ == "__main__":
    asyncio.run(create_default_superuser())
