"""Create default superuser if no users exist."""
import asyncio

from sqlalchemy import func, select

from app.database import async_session_factory
from app.models.user import User, UserRole
from app.services.auth import hash_password


async def create_default_superuser() -> None:
    async with async_session_factory() as db:
        result = await db.execute(select(func.count()).select_from(User))
        user_count = result.scalar_one()

        if user_count > 0:
            print("Users already exist. Skipping superuser creation.")
            return

        superuser = User(
            name="Admin",
            email="admin@mrk.local",
            password_hash=hash_password("123456"),
            role=UserRole.admin,
            is_active=True,
        )
        db.add(superuser)
        await db.commit()
        print("Default superuser created: admin@mrk.local")


if __name__ == "__main__":
    asyncio.run(create_default_superuser())
