from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user, require_roles
from app.database.session import get_db
from app.models.user import User
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=ApiResponse)
async def list_users(
    _: User = Depends(require_roles("administrator", "super_administrator")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).options(selectinload(User.role)).where(User.deleted_at.is_(None)))
    return ApiResponse(data=[
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role.name.value,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat(),
        }
        for u in result.scalars().all()
    ])
