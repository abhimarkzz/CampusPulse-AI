from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import Notification


async def list_notifications(db: AsyncSession, user_id: UUID, unread_only: bool = False) -> list[Notification]:
    query = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        query = query.where(Notification.is_read.is_(False))
    result = await db.execute(query.order_by(Notification.created_at.desc()).limit(50))
    return list(result.scalars().all())


async def mark_read(db: AsyncSession, user_id: UUID, notification_id: UUID) -> None:
    await db.execute(
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == user_id)
        .values(is_read=True)
    )
    await db.commit()


async def mark_all_read(db: AsyncSession, user_id: UUID) -> None:
    await db.execute(
        update(Notification).where(Notification.user_id == user_id).values(is_read=True)
    )
    await db.commit()
