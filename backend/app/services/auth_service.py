from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.user import Profile, Role, User, UserRole
from app.schemas.common import UserCreate


async def get_role_by_name(db: AsyncSession, role_name: UserRole) -> Role:
    result = await db.execute(select(Role).where(Role.name == role_name))
    role = result.scalar_one_or_none()
    if not role:
        raise ValueError(f"Role {role_name.value} not found")
    return role


async def create_user(db: AsyncSession, payload: UserCreate, role_name: UserRole = UserRole.STUDENT) -> User:
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise ValueError("Email already registered")

    role = await get_role_by_name(db, role_name)
    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role_id=role.id,
        is_verified=False,
    )
    db.add(user)
    await db.flush()
    db.add(Profile(user_id=user.id))
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    result = await db.execute(
        select(User).where(User.email == email.lower(), User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def build_token_response(user: User) -> dict:
    role_name = user.role.name.value if user.role else UserRole.STUDENT.value
    return {
        "access_token": create_access_token(str(user.id), role_name),
        "refresh_token": create_refresh_token(str(user.id)),
        "token_type": "bearer",
    }


from app.services.analytics_service import get_dashboard_stats
