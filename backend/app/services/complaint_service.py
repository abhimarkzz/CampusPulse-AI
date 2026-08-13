from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.ai.providers.factory import get_ai_provider
from app.models.domain import (
    AIAnalysis,
    Complaint,
    ComplaintAttachment,
    ComplaintCategory,
    ComplaintComment,
    ComplaintFollower,
    ComplaintPriority,
    ComplaintStatus,
    ComplaintStatusHistory,
    ComplaintSubcategory,
    ComplaintUpvote,
    Notification,
    SLAPolicy,
)
from app.models.user import User, UserRole
from app.utils.helpers import compute_sla_deadline, count_complaints, log_action, next_ticket_number
from app.utils.status import can_transition


async def list_complaints(
    db: AsyncSession,
    user: User,
    *,
    status: str | None = None,
    priority: str | None = None,
    category_id: UUID | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Complaint], int]:
    query = select(Complaint).where(Complaint.deleted_at.is_(None))
    if user.role.name == UserRole.STUDENT:
        query = query.where(Complaint.reporter_id == user.id)
    elif user.role.name == UserRole.STAFF:
        query = query.where(or_(Complaint.assigned_to == user.id, Complaint.assigned_to.is_(None)))
    if status:
        query = query.where(Complaint.status == ComplaintStatus(status))
    if priority:
        query = query.where(Complaint.priority == ComplaintPriority(priority))
    if category_id:
        query = query.where(Complaint.category_id == category_id)
    if search:
        like = f"%{search}%"
        query = query.where(or_(Complaint.title.ilike(like), Complaint.description.ilike(like)))
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    result = await db.execute(
        query.order_by(Complaint.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.scalars().all()), int(total or 0)


async def get_complaint(db: AsyncSession, complaint_id: UUID) -> Complaint | None:
    result = await db.execute(
        select(Complaint)
        .options(
            selectinload(Complaint.comments),
            selectinload(Complaint.attachments),
            selectinload(Complaint.status_history),
        )
        .where(Complaint.id == complaint_id, Complaint.deleted_at.is_(None))
    )
    return result.scalar_one_or_none()


async def create_complaint(db: AsyncSession, user: User, payload: dict) -> Complaint:
    provider = get_ai_provider()
    classification = await provider.classify(payload["description"])
    category = await _resolve_category(db, classification.get("category"))
    subcategory = None
    if category:
        subcategory = await _resolve_subcategory(db, category.id, classification.get("subcategory"))

    priority = ComplaintPriority(payload.get("priority") or classification.get("priority") or "MEDIUM")
    sla = await db.scalar(select(SLAPolicy).where(SLAPolicy.priority == priority))
    now = datetime.now(UTC)
    resolution_minutes = sla.resolution_minutes if sla else 1440
    ticket_count = await count_complaints(db)

    complaint = Complaint(
        ticket_number=next_ticket_number(ticket_count),
        title=payload["title"],
        description=payload["description"],
        category_id=category.id if category else payload.get("category_id"),
        subcategory_id=subcategory.id if subcategory else payload.get("subcategory_id"),
        priority=priority,
        status=ComplaintStatus.PENDING,
        reporter_id=user.id,
        department_id=payload.get("department_id"),
        campus_id=payload.get("campus_id"),
        building_id=payload.get("building_id"),
        room_id=payload.get("room_id"),
        latitude=payload.get("latitude"),
        longitude=payload.get("longitude"),
        sla_deadline=compute_sla_deadline(priority.value, now, resolution_minutes),
        ai_confidence=classification.get("confidence"),
    )
    db.add(complaint)
    await db.flush()
    db.add(
        ComplaintStatusHistory(
            complaint_id=complaint.id,
            from_status=None,
            to_status=ComplaintStatus.PENDING.value,
            changed_by=user.id,
            note="Complaint created",
        )
    )
    db.add(
        AIAnalysis(
            complaint_id=complaint.id,
            analysis_type="classification",
            result=classification,
            confidence=classification.get("confidence"),
        )
    )
    await _notify(db, user.id, "Complaint created", f"Ticket {complaint.ticket_number} submitted.", complaint.id)
    await log_action(db, actor_id=user.id, action="complaint.created", resource_type="complaint", resource_id=str(complaint.id))
    await db.commit()
    await db.refresh(complaint)
    return complaint


async def update_complaint_status(
    db: AsyncSession, user: User, complaint: Complaint, new_status: ComplaintStatus, note: str | None = None
) -> Complaint:
    if not can_transition(complaint.status, new_status):
        raise ValueError(f"Invalid transition from {complaint.status.value} to {new_status.value}")
    old = complaint.status.value
    complaint.status = new_status
    now = datetime.now(UTC)
    if new_status == ComplaintStatus.ACKNOWLEDGED:
        complaint.acknowledged_at = now
    elif new_status == ComplaintStatus.IN_PROGRESS:
        complaint.started_at = now
    elif new_status == ComplaintStatus.RESOLVED:
        complaint.resolved_at = now
    elif new_status == ComplaintStatus.CLOSED:
        complaint.closed_at = now
    elif new_status == ComplaintStatus.REOPENED:
        complaint.reopen_count += 1
    db.add(
        ComplaintStatusHistory(
            complaint_id=complaint.id,
            from_status=old,
            to_status=new_status.value,
            changed_by=user.id,
            note=note,
        )
    )
    await _notify(db, complaint.reporter_id, "Status updated", f"Complaint {complaint.ticket_number} is now {new_status.value}.", complaint.id)
    await log_action(
        db,
        actor_id=user.id,
        action="complaint.status_changed",
        resource_type="complaint",
        resource_id=str(complaint.id),
        before_state={"status": old},
        after_state={"status": new_status.value},
    )
    await db.commit()
    await db.refresh(complaint)
    return complaint


async def add_comment(db: AsyncSession, user: User, complaint_id: UUID, body: str, is_internal: bool = False) -> ComplaintComment:
    comment = ComplaintComment(
        complaint_id=complaint_id,
        author_id=user.id,
        body=body,
        is_internal=is_internal,
    )
    db.add(comment)
    complaint = await get_complaint(db, complaint_id)
    if complaint and not is_internal:
        await _notify(db, complaint.reporter_id, "New comment", body[:120], complaint.id)
    await db.commit()
    await db.refresh(comment)
    return comment


async def toggle_upvote(db: AsyncSession, user: User, complaint_id: UUID) -> dict:
    existing = await db.scalar(
        select(ComplaintUpvote).where(
            and_(ComplaintUpvote.complaint_id == complaint_id, ComplaintUpvote.user_id == user.id)
        )
    )
    complaint = await get_complaint(db, complaint_id)
    if not complaint:
        raise ValueError("Complaint not found")
    if existing:
        await db.delete(existing)
        complaint.upvote_count = max(0, complaint.upvote_count - 1)
        upvoted = False
    else:
        db.add(ComplaintUpvote(complaint_id=complaint_id, user_id=user.id))
        complaint.upvote_count += 1
        upvoted = True
    await db.commit()
    return {"upvoted": upvoted, "upvote_count": complaint.upvote_count}


async def toggle_follow(db: AsyncSession, user: User, complaint_id: UUID) -> dict:
    existing = await db.scalar(
        select(ComplaintFollower).where(
            and_(ComplaintFollower.complaint_id == complaint_id, ComplaintFollower.user_id == user.id)
        )
    )
    if existing:
        await db.delete(existing)
        following = False
    else:
        db.add(ComplaintFollower(complaint_id=complaint_id, user_id=user.id))
        following = True
    await db.commit()
    return {"following": following}


async def find_similar(db: AsyncSession, complaint_id: UUID) -> list[dict]:
    complaint = await get_complaint(db, complaint_id)
    if not complaint:
        return []
    result = await db.execute(
        select(Complaint)
        .where(
            Complaint.id != complaint_id,
            Complaint.deleted_at.is_(None),
            Complaint.category_id == complaint.category_id,
            Complaint.building_id == complaint.building_id,
        )
        .limit(5)
    )
    return [
        {
            "id": str(c.id),
            "ticket_number": c.ticket_number,
            "title": c.title,
            "status": c.status.value,
            "similarity": 0.78,
        }
        for c in result.scalars().all()
    ]


async def _resolve_category(db: AsyncSession, name: str | None) -> ComplaintCategory | None:
    if not name:
        return None
    result = await db.execute(select(ComplaintCategory).where(ComplaintCategory.name.ilike(name)))
    return result.scalar_one_or_none()


async def _resolve_subcategory(db: AsyncSession, category_id: UUID, name: str | None) -> ComplaintSubcategory | None:
    if not name:
        return None
    result = await db.execute(
        select(ComplaintSubcategory).where(
            ComplaintSubcategory.category_id == category_id,
            ComplaintSubcategory.name.ilike(name),
        )
    )
    return result.scalar_one_or_none()


async def _notify(db: AsyncSession, user_id: UUID, title: str, message: str, complaint_id: UUID) -> None:
    db.add(
        Notification(
            user_id=user_id,
            title=title,
            message=message,
            event_type="ComplaintStatusChanged",
            resource_type="complaint",
            resource_id=complaint_id,
        )
    )
