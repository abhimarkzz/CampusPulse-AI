from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import (
    AIInsight,
    Complaint,
    ComplaintCategory,
    ComplaintStatus,
    IssueCluster,
    SLAPolicy,
)


async def get_dashboard_stats(db: AsyncSession) -> dict:
    now = datetime.now(UTC)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    open_statuses = [
        ComplaintStatus.PENDING,
        ComplaintStatus.ACKNOWLEDGED,
        ComplaintStatus.ASSIGNED,
        ComplaintStatus.IN_PROGRESS,
        ComplaintStatus.WAITING_FOR_STUDENT,
        ComplaintStatus.WAITING_FOR_EXTERNAL_TEAM,
        ComplaintStatus.REOPENED,
    ]
    total = await db.scalar(select(func.count()).select_from(Complaint).where(Complaint.deleted_at.is_(None)))
    open_count = await db.scalar(
        select(func.count()).select_from(Complaint).where(
            Complaint.deleted_at.is_(None), Complaint.status.in_(open_statuses)
        )
    )
    resolved_today = await db.scalar(
        select(func.count()).select_from(Complaint).where(
            Complaint.resolved_at.is_not(None), Complaint.resolved_at >= today_start
        )
    )
    sla_at_risk = await db.scalar(
        select(func.count()).select_from(Complaint).where(
            Complaint.deleted_at.is_(None),
            Complaint.sla_deadline.is_not(None),
            Complaint.sla_deadline <= now + timedelta(hours=2),
            Complaint.status.notin_([ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED, ComplaintStatus.REJECTED]),
        )
    )
    health = max(40, 100 - int((open_count or 0) * 2) - int((sla_at_risk or 0) * 5))
    return {
        "total_complaints": int(total or 0),
        "open_complaints": int(open_count or 0),
        "resolved_today": int(resolved_today or 0),
        "sla_at_risk": int(sla_at_risk or 0),
        "campus_health_score": health,
    }


async def get_category_trends(db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(ComplaintCategory.name, func.count(Complaint.id))
        .join(Complaint, Complaint.category_id == ComplaintCategory.id, isouter=True)
        .group_by(ComplaintCategory.name)
    )
    return [{"category": name, "count": count} for name, count in result.all()]


async def get_ai_insights(db: AsyncSession, limit: int = 10) -> list[AIInsight]:
    result = await db.execute(select(AIInsight).order_by(AIInsight.created_at.desc()).limit(limit))
    return list(result.scalars().all())


async def get_clusters(db: AsyncSession) -> list[IssueCluster]:
    result = await db.execute(select(IssueCluster).order_by(IssueCluster.complaint_count.desc()))
    return list(result.scalars().all())


async def get_sla_overview(db: AsyncSession) -> list[dict]:
    policies = await db.execute(select(SLAPolicy))
    return [
        {
            "priority": p.priority.value,
            "acknowledgement_minutes": p.acknowledgement_minutes,
            "resolution_minutes": p.resolution_minutes,
        }
        for p in policies.scalars().all()
    ]
