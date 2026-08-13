"""KLH University Aziz Nagar campus map overview."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import Building, Campus, Complaint, ComplaintStatus, IssueCluster


async def get_map_overview(db: AsyncSession) -> dict:
    campus = await db.scalar(select(Campus).limit(1))
    buildings = list((await db.execute(select(Building))).scalars().all())
    open_statuses = [
        ComplaintStatus.PENDING,
        ComplaintStatus.ACKNOWLEDGED,
        ComplaintStatus.ASSIGNED,
        ComplaintStatus.IN_PROGRESS,
        ComplaintStatus.WAITING_FOR_STUDENT,
        ComplaintStatus.WAITING_FOR_EXTERNAL_TEAM,
        ComplaintStatus.REOPENED,
    ]

    building_stats = []
    total_open = 0
    for building in buildings:
        open_count = await db.scalar(
            select(func.count())
            .select_from(Complaint)
            .where(
                Complaint.building_id == building.id,
                Complaint.deleted_at.is_(None),
                Complaint.status.in_(open_statuses),
            )
        )
        total_count = await db.scalar(
            select(func.count())
            .select_from(Complaint)
            .where(Complaint.building_id == building.id, Complaint.deleted_at.is_(None))
        )
        count = int(open_count or 0)
        total_open += count
        severity = "none"
        if count >= 3:
            severity = "high"
        elif count >= 1:
            severity = "medium"
        building_stats.append({
            "id": str(building.id),
            "name": building.name,
            "code": building.code,
            "latitude": building.latitude,
            "longitude": building.longitude,
            "open_complaints": count,
            "total_complaints": int(total_count or 0),
            "severity": severity,
        })

    clusters = list((await db.execute(select(IssueCluster).order_by(IssueCluster.complaint_count.desc()))).scalars().all())
    recent = await db.execute(
        select(Complaint)
        .where(Complaint.deleted_at.is_(None), Complaint.latitude.is_not(None))
        .order_by(Complaint.created_at.desc())
        .limit(8)
    )

    return {
        "campus": {
            "name": campus.name if campus else "KLH University",
            "code": campus.code if campus else "KLH-AZIZ",
            "latitude": campus.latitude if campus else 17.3932,
            "longitude": campus.longitude if campus else 78.39275,
            "address": "Aziz Nagar, Moinabad Road, Near TS Police Academy, Hyderabad, Telangana 500075",
            "pincode": "500075",
        },
        "stats": {
            "total_buildings": len(buildings),
            "open_complaints": total_open,
            "active_clusters": len(clusters),
            "hotspots": sum(1 for b in building_stats if b["severity"] in {"high", "medium"}),
        },
        "buildings": building_stats,
        "clusters": [
            {
                "id": str(c.id),
                "cluster_code": c.cluster_code,
                "title": c.title,
                "summary": c.summary,
                "complaint_count": c.complaint_count,
                "severity": c.severity,
                "building_id": str(c.building_id) if c.building_id else None,
                "possible_root_cause": c.possible_root_cause,
                "recommended_action": c.recommended_action,
            }
            for c in clusters
        ],
        "recent_pins": [
            {
                "id": str(c.id),
                "title": c.title,
                "ticket_number": c.ticket_number,
                "priority": c.priority.value,
                "status": c.status.value,
                "latitude": c.latitude,
                "longitude": c.longitude,
            }
            for c in recent.scalars().all()
            if c.latitude and c.longitude
        ],
    }
