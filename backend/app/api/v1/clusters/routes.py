from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.common import ApiResponse
from app.services import analytics_service as svc

router = APIRouter(prefix="/clusters", tags=["clusters"])


@router.get("", response_model=ApiResponse)
async def list_clusters(_: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    items = await svc.get_clusters(db)
    return ApiResponse(data=[
        {
            "id": str(c.id),
            "cluster_code": c.cluster_code,
            "title": c.title,
            "summary": c.summary,
            "complaint_count": c.complaint_count,
            "severity": c.severity,
            "status": c.status,
        }
        for c in items
    ])
