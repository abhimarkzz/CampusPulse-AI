from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.providers.factory import get_ai_provider
from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.domain import Complaint
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.complaint import AIChatRequest
from app.services import analytics_service as analytics_svc
from app.services import complaint_service as complaint_svc

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/assistant", response_model=ApiResponse)
async def assistant(
    payload: AIChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    complaints, _ = await complaint_svc.list_complaints(db, user, page_size=20)
    context = {
        "complaints": [
            {"title": c.title, "status": c.status.value, "ticket_number": c.ticket_number}
            for c in complaints
        ]
    }
    provider = get_ai_provider()
    result = await provider.assistant_reply(payload.message, context)
    return ApiResponse(data=result)


@router.post("/classify", response_model=ApiResponse)
async def classify(payload: AIChatRequest, _: User = Depends(get_current_user)):
    provider = get_ai_provider()
    return ApiResponse(data=await provider.classify(payload.message))


@router.get("/clusters", response_model=ApiResponse)
async def clusters(_: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    items = await analytics_svc.get_clusters(db)
    return ApiResponse(data=[
        {
            "id": str(c.id),
            "cluster_code": c.cluster_code,
            "title": c.title,
            "summary": c.summary,
            "complaint_count": c.complaint_count,
            "affected_users": c.affected_users,
            "severity": c.severity,
            "confidence": c.confidence,
            "possible_root_cause": c.possible_root_cause,
            "recommended_action": c.recommended_action,
        }
        for c in items
    ])


@router.get("/insights", response_model=ApiResponse)
async def insights(_: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    items = await analytics_svc.get_ai_insights(db)
    return ApiResponse(data=[{"id": str(i.id), "title": i.title, "evidence": i.evidence, "confidence": i.confidence} for i in items])
