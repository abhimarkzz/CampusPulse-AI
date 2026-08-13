from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.common import ApiResponse
from app.services import notification_service as svc

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=ApiResponse)
async def list_notifications(
    unread_only: bool = False,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    items = await svc.list_notifications(db, user.id, unread_only)
    return ApiResponse(data=[
        {
            "id": str(n.id),
            "title": n.title,
            "message": n.message,
            "event_type": n.event_type,
            "resource_id": str(n.resource_id) if n.resource_id else None,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
        }
        for n in items
    ])


@router.patch("/{notification_id}/read", response_model=ApiResponse)
async def mark_read(
    notification_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await svc.mark_read(db, user.id, notification_id)
    return ApiResponse(data={"read": True})


@router.post("/read-all", response_model=ApiResponse)
async def mark_all_read(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await svc.mark_all_read(db, user.id)
    return ApiResponse(data={"read_all": True})
