from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user, require_roles
from app.database.session import get_db
from app.models.domain import AuditLog, Complaint, IssueCluster
from app.models.user import User
from app.schemas.common import ApiResponse
from app.services import analytics_service as analytics_svc

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/overview", response_model=ApiResponse)
async def overview(
    _: User = Depends(require_roles("administrator", "super_administrator")),
    db: AsyncSession = Depends(get_db),
):
    stats = await analytics_svc.get_dashboard_stats(db)
    users = await db.scalar(select(func.count()).select_from(User))
    clusters = await db.scalar(select(func.count()).select_from(IssueCluster))
    return ApiResponse(data={**stats, "total_users": int(users or 0), "active_clusters": int(clusters or 0)})


@router.get("/complaints/live", response_model=ApiResponse)
async def live_complaints(
    _: User = Depends(require_roles("administrator", "super_administrator", "staff", "department_manager")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Complaint).where(Complaint.deleted_at.is_(None)).order_by(Complaint.created_at.desc()).limit(25))
    return ApiResponse(data=[
        {"id": str(c.id), "ticket_number": c.ticket_number, "title": c.title, "status": c.status.value, "priority": c.priority.value}
        for c in result.scalars().all()
    ])


@router.get("/audit-logs", response_model=ApiResponse)
async def audit_logs(
    _: User = Depends(require_roles("administrator", "super_administrator")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(50))
    return ApiResponse(data=[
        {
            "id": str(a.id),
            "action": a.action,
            "resource_type": a.resource_type,
            "resource_id": a.resource_id,
            "created_at": a.created_at.isoformat(),
        }
        for a in result.scalars().all()
    ])
