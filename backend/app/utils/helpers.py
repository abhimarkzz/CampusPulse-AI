import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import AuditLog


async def log_action(
    db: AsyncSession,
    *,
    actor_id: uuid.UUID | None,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    before_state: dict | None = None,
    after_state: dict | None = None,
    ip_address: str | None = None,
) -> None:
    db.add(
        AuditLog(
            actor_id=actor_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            before_state=before_state,
            after_state=after_state,
            ip_address=ip_address,
        )
    )


def next_ticket_number(count: int) -> str:
    year = datetime.now(UTC).year
    return f"CP-{year}-{count + 1:04d}"


def compute_sla_deadline(priority: str, created_at: datetime, resolution_minutes: int) -> datetime:
    return created_at + timedelta(minutes=resolution_minutes)


async def count_complaints(db: AsyncSession) -> int:
    from app.models.domain import Complaint

    result = await db.scalar(select(func.count()).select_from(Complaint))
    return int(result or 0)
