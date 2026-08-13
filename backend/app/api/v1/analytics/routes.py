from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_roles
from app.database.session import get_db
from app.models.user import User
from app.schemas.common import ApiResponse
from app.services import analytics_service as svc

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard", response_model=ApiResponse)
async def dashboard(_: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ApiResponse(data=await svc.get_dashboard_stats(db))


@router.get("/trends", response_model=ApiResponse)
async def trends(_: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ApiResponse(data=await svc.get_category_trends(db))


@router.get("/insights", response_model=ApiResponse)
async def insights(_: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    items = await svc.get_ai_insights(db)
    return ApiResponse(data=[
        {
            "id": str(i.id),
            "title": i.title,
            "insight_type": i.insight_type,
            "metric": i.metric,
            "time_range": i.time_range,
            "evidence": i.evidence,
            "confidence": i.confidence,
            "recommended_action": i.recommended_action,
        }
        for i in items
    ])


@router.get("/sla", response_model=ApiResponse)
async def sla_overview(
    _: User = Depends(require_roles("staff", "department_manager", "administrator", "super_administrator")),
    db: AsyncSession = Depends(get_db),
):
    return ApiResponse(data=await svc.get_sla_overview(db))
