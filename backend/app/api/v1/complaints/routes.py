from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.domain import Building, Campus, ComplaintCategory, ComplaintSubcategory, Department, Room
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.complaint import (
    CommentCreate,
    ComplaintAssign,
    ComplaintCreate,
    ComplaintRead,
    ComplaintUpdateStatus,
)
from app.services import complaint_service as svc
from app.models.domain import ComplaintStatus

router = APIRouter(prefix="/complaints", tags=["complaints"])


def serialize(c) -> dict:
    return ComplaintRead(
        id=c.id,
        ticket_number=c.ticket_number,
        title=c.title,
        description=c.description,
        status=c.status.value,
        priority=c.priority.value,
        category_id=c.category_id,
        building_id=c.building_id,
        room_id=c.room_id,
        reporter_id=c.reporter_id,
        assigned_to=c.assigned_to,
        upvote_count=c.upvote_count,
        ai_confidence=c.ai_confidence,
        sla_deadline=c.sla_deadline,
        created_at=c.created_at,
        updated_at=c.updated_at,
    ).model_dump()


@router.get("", response_model=ApiResponse)
async def list_complaints(
    status: str | None = None,
    priority: str | None = None,
    category_id: UUID | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    items, total = await svc.list_complaints(
        db, user, status=status, priority=priority, category_id=category_id, search=search, page=page, page_size=page_size
    )
    return ApiResponse(data=[serialize(c) for c in items], meta={"total": total, "page": page, "page_size": page_size})


@router.post("", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    payload: ComplaintCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    complaint = await svc.create_complaint(db, user, payload.model_dump())
    return ApiResponse(data=serialize(complaint))


@router.get("/{complaint_id}", response_model=ApiResponse)
async def get_complaint(complaint_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    complaint = await svc.get_complaint(db, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    data = serialize(complaint)
    data["comments"] = [
        {"id": str(c.id), "body": c.body, "author_id": str(c.author_id), "is_internal": c.is_internal, "created_at": c.created_at.isoformat()}
        for c in complaint.comments if not c.is_internal or user.role.name.value != "student"
    ]
    data["attachments"] = [
        {"id": str(a.id), "file_name": a.file_name, "file_url": a.file_url, "mime_type": a.mime_type}
        for a in complaint.attachments
    ]
    data["status_history"] = [
        {"from_status": h.from_status, "to_status": h.to_status, "note": h.note, "created_at": h.created_at.isoformat()}
        for h in complaint.status_history
    ]
    return ApiResponse(data=data)


@router.patch("/{complaint_id}/status", response_model=ApiResponse)
async def update_status(
    complaint_id: UUID,
    payload: ComplaintUpdateStatus,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    complaint = await svc.get_complaint(db, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    try:
        updated = await svc.update_complaint_status(db, user, complaint, ComplaintStatus(payload.status), payload.note)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ApiResponse(data=serialize(updated))


@router.post("/{complaint_id}/assign", response_model=ApiResponse)
async def assign_complaint(
    complaint_id: UUID,
    payload: ComplaintAssign,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    complaint = await svc.get_complaint(db, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    complaint.assigned_to = payload.assigned_to
    if complaint.status == ComplaintStatus.PENDING:
        complaint.status = ComplaintStatus.ASSIGNED
    await db.commit()
    await db.refresh(complaint)
    return ApiResponse(data=serialize(complaint))


@router.post("/{complaint_id}/comments", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
async def add_comment(
    complaint_id: UUID,
    payload: CommentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment = await svc.add_comment(db, user, complaint_id, payload.body, payload.is_internal)
    return ApiResponse(data={"id": str(comment.id), "body": comment.body, "created_at": comment.created_at.isoformat()})


@router.post("/{complaint_id}/upvote", response_model=ApiResponse)
async def upvote(complaint_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        result = await svc.toggle_upvote(db, user, complaint_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ApiResponse(data=result)


@router.post("/{complaint_id}/follow", response_model=ApiResponse)
async def follow(complaint_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await svc.toggle_follow(db, user, complaint_id)
    return ApiResponse(data=result)


@router.get("/{complaint_id}/similar", response_model=ApiResponse)
async def similar(complaint_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ApiResponse(data=await svc.find_similar(db, complaint_id))
