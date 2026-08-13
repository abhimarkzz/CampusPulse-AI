import asyncio
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.database.session import SessionLocal
from app.models.domain import (
    AIInsight,
    Building,
    Campus,
    Complaint,
    ComplaintCategory,
    ComplaintPriority,
    ComplaintStatus,
    ComplaintSubcategory,
    Department,
    IssueCluster,
    IssueClusterMember,
    Notification,
    Room,
    SLAPolicy,
)
from app.models.user import Profile, Role, User, UserRole

# KLH University — Aziz Nagar, Hyderabad
KLH_CENTER = (17.3932, 78.39275)
KLH_ADDRESS = "Aziz Nagar, Moinabad Road, Near TS Police Academy, Hyderabad, Telangana 500075"

KLH_BUILDINGS = [
    ("ENG-A", "Academic Block A (Engineering)", 17.3938, 78.3920),
    ("ENG-B", "Academic Block B (Management)", 17.3928, 78.3935),
    ("HOSTEL", "Hostel Block", 17.3945, 78.3918),
    ("LIB", "Central Library", 17.3930, 78.3930),
    ("LAB", "Computer Labs Block", 17.3935, 78.3928),
    ("SPORTS", "Sports Complex", 17.3925, 78.3915),
    ("ADMIN", "Admin & Examination Block", 17.3940, 78.3938),
    ("CAFE", "Cafeteria & Student Center", 17.3932, 78.3922),
]

DEFAULT_ROLES = [
    (UserRole.STUDENT, "Student user with complaint access"),
    (UserRole.STAFF, "Staff member handling assigned complaints"),
    (UserRole.DEPARTMENT_MANAGER, "Department manager with queue oversight"),
    (UserRole.ADMINISTRATOR, "Administrator with full management access"),
    (UserRole.SUPER_ADMINISTRATOR, "Super administrator with system access"),
]

DEMO_USERS = [
    ("admin@campus.local", "System Admin", "Admin123!", UserRole.ADMINISTRATOR),
    ("staff@campus.local", "Campus Staff", "Staff123!", UserRole.STAFF),
    ("student@campus.local", "Campus Student", "Student123!", UserRole.STUDENT),
]

CATEGORIES = [
    ("Wi-Fi", "wifi", "wifi"),
    ("Hostel", "hostel", "home"),
    ("Classroom", "classroom", "projector"),
    ("Laboratory", "laboratory", "flask"),
    ("Cleanliness", "cleanliness", "sparkles"),
    ("Maintenance", "maintenance", "wrench"),
    ("Electrical", "electrical", "zap"),
    ("Plumbing", "plumbing", "droplets"),
    ("Security", "security", "shield"),
]

DEPARTMENTS = [
    ("Network Operations", "network-ops"),
    ("IT Support", "it-support"),
    ("Hostel Administration", "hostel-admin"),
    ("Maintenance", "maintenance"),
    ("Housekeeping", "housekeeping"),
    ("Security", "security"),
]

SLA = [
    (ComplaintPriority.CRITICAL, 15, 120),
    (ComplaintPriority.HIGH, 30, 360),
    (ComplaintPriority.MEDIUM, 240, 1440),
    (ComplaintPriority.LOW, 1440, 4320),
]

KLH_COMPLAINTS = [
    ("Wi-Fi outage in Computer Labs Block", "Internet is completely down in Computer Labs Block, KLH Aziz Nagar since 9 AM.", "wifi", "IN_PROGRESS", "HIGH", "LAB"),
    ("Projector not working — Academic Block A", "Projector in Room 204, Academic Block A shows no signal during B.Tech lectures.", "classroom", "ASSIGNED", "MEDIUM", "ENG-A"),
    ("Water leakage in Hostel Block", "Water leaking from ceiling in Hostel Block room H-312, KLH campus.", "hostel", "ACKNOWLEDGED", "CRITICAL", "HOSTEL"),
    ("AC not cooling in Central Library", "Air conditioning units on 2nd floor of Central Library are not working.", "maintenance", "PENDING", "HIGH", "LIB"),
    ("Broken chairs in Cafeteria", "Multiple broken chairs and tables in Cafeteria & Student Center dining area.", "maintenance", "IN_PROGRESS", "LOW", "CAFE"),
    ("CCTV camera offline at Admin Block", "Security camera near Admin & Examination Block main gate is offline.", "security", "ASSIGNED", "HIGH", "ADMIN"),
    ("Lab computer not booting", "Computer station 12 in Computer Labs Block programming lab won't start.", "laboratory", "RESOLVED", "MEDIUM", "LAB"),
    ("Dirty washroom in Hostel Block", "Ground floor washroom in Hostel Block has not been cleaned for 3 days.", "cleanliness", "IN_PROGRESS", "MEDIUM", "HOSTEL"),
    ("Power fluctuation in Sports Complex", "Frequent power cuts affecting Sports Complex gym equipment.", "electrical", "PENDING", "HIGH", "SPORTS"),
    ("Management classroom mic issue", "Microphone system not working in Academic Block B seminar hall.", "classroom", "ACKNOWLEDGED", "MEDIUM", "ENG-B"),
]


async def seed() -> None:
    async with SessionLocal() as db:
        await _seed_roles(db)
        await _seed_users(db)
        await _seed_sla(db)
        await _seed_departments(db)
        campus, buildings = await _seed_klh_locations(db)
        categories = await _seed_categories(db)
        staff = await _get_user(db, "staff@campus.local")
        student = await _get_user(db, "student@campus.local")
        complaints = await _seed_klh_complaints(db, student, staff, categories, campus, buildings)
        await _seed_klh_clusters(db, complaints, categories, buildings)
        await _seed_klh_insights(db)
        await _seed_notifications(db, student)
        await db.commit()


async def _seed_roles(db: AsyncSession) -> None:
    for role_name, description in DEFAULT_ROLES:
        if not await db.scalar(select(Role).where(Role.name == role_name)):
            db.add(Role(name=role_name, description=description))


async def _seed_users(db: AsyncSession) -> None:
    for email, full_name, password, role_name in DEMO_USERS:
        if await db.scalar(select(User).where(User.email == email)):
            continue
        role = await db.scalar(select(Role).where(Role.name == role_name))
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=hash_password(password),
            role_id=role.id,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        await db.flush()
        db.add(Profile(user_id=user.id))


async def _seed_sla(db: AsyncSession) -> None:
    for priority, ack, res in SLA:
        if not await db.scalar(select(SLAPolicy).where(SLAPolicy.priority == priority)):
            db.add(SLAPolicy(priority=priority, acknowledgement_minutes=ack, resolution_minutes=res))


async def _seed_departments(db: AsyncSession) -> None:
    for name, code in DEPARTMENTS:
        if not await db.scalar(select(Department).where(Department.code == code)):
            db.add(Department(name=name, code=code))


async def _seed_klh_locations(db: AsyncSession) -> tuple[Campus, dict[str, Building]]:
    campus = await db.scalar(select(Campus).where(Campus.code == "KLH-AZIZ"))
    if not campus:
        old = await db.scalar(select(Campus).where(Campus.code == "MAIN"))
        if old:
            old.name = "KLH University — Aziz Nagar"
            old.code = "KLH-AZIZ"
            old.latitude, old.longitude = KLH_CENTER
            campus = old
        else:
            campus = Campus(
                name="KLH University — Aziz Nagar",
                code="KLH-AZIZ",
                latitude=KLH_CENTER[0],
                longitude=KLH_CENTER[1],
            )
            db.add(campus)
            await db.flush()
    else:
        campus.name = "KLH University — Aziz Nagar"
        campus.latitude, campus.longitude = KLH_CENTER

    # Remove old generic buildings if upgrading from demo data
    old_codes = {"A", "B", "C", "D"}
    existing = (await db.execute(select(Building))).scalars().all()
    for b in existing:
        if b.code in old_codes:
            await db.execute(delete(Room).where(Room.building_id == b.id))
            await db.delete(b)
    await db.flush()

    buildings: dict[str, Building] = {}
    for code, name, lat, lng in KLH_BUILDINGS:
        building = await db.scalar(select(Building).where(Building.code == code))
        if not building:
            building = Building(campus_id=campus.id, name=name, code=code, latitude=lat, longitude=lng)
            db.add(building)
            await db.flush()
            for room_name, floor in [("101", "1"), ("204", "2"), ("301", "3")]:
                db.add(Room(building_id=building.id, name=room_name, floor=floor))
        else:
            building.name = name
            building.latitude = lat
            building.longitude = lng
            building.campus_id = campus.id
        buildings[code] = building

    return campus, buildings


async def _seed_categories(db: AsyncSession) -> dict[str, ComplaintCategory]:
    cats: dict[str, ComplaintCategory] = {}
    for name, slug, _icon in CATEGORIES:
        cat = await db.scalar(select(ComplaintCategory).where(ComplaintCategory.slug == slug))
        if not cat:
            cat = ComplaintCategory(name=name, slug=slug, icon=_icon)
            db.add(cat)
            await db.flush()
            db.add(ComplaintSubcategory(category_id=cat.id, name=f"{name} Issue", slug=f"{slug}-issue"))
        cats[slug] = cat
    return cats


async def _get_user(db: AsyncSession, email: str) -> User:
    return await db.scalar(select(User).where(User.email == email))


async def _seed_klh_complaints(
    db: AsyncSession,
    student: User,
    staff: User,
    categories: dict[str, ComplaintCategory],
    campus: Campus,
    buildings: dict[str, Building],
) -> list[Complaint]:
    klh_exists = await db.scalar(select(Complaint).where(Complaint.ticket_number.like("KLH-%")).limit(1))
    if klh_exists:
        return list((await db.execute(select(Complaint))).scalars().all())

    existing = await db.scalar(select(func.count()).select_from(Complaint))
    if existing:
        await db.execute(delete(IssueClusterMember))
        await db.execute(delete(IssueCluster))
        await db.execute(delete(Complaint))
        await db.flush()
    complaints = []
    now = datetime.now(UTC)
    for idx, (title, desc, cat_slug, status, priority, block) in enumerate(KLH_COMPLAINTS, start=1):
        cat = categories.get(cat_slug) or categories["maintenance"]
        building = buildings.get(block, list(buildings.values())[0])
        complaint = Complaint(
            ticket_number=f"KLH-2026-{idx:04d}",
            title=title,
            description=desc,
            category_id=cat.id,
            priority=ComplaintPriority(priority),
            status=ComplaintStatus(status),
            reporter_id=student.id,
            assigned_to=staff.id if status not in {"PENDING"} else None,
            campus_id=campus.id,
            building_id=building.id,
            latitude=building.latitude,
            longitude=building.longitude,
            sla_deadline=now + timedelta(hours=6),
            ai_confidence=0.78 + (idx * 0.01),
            upvote_count=idx * 3,
            created_at=now - timedelta(hours=idx * 2),
        )
        db.add(complaint)
        complaints.append(complaint)
    await db.flush()
    return complaints


async def _seed_klh_clusters(
    db: AsyncSession,
    complaints: list[Complaint],
    categories: dict[str, ComplaintCategory],
    buildings: dict[str, Building],
) -> None:
    await db.execute(delete(IssueClusterMember))
    await db.execute(delete(IssueCluster))
    await db.flush()

    lab_block = buildings["LAB"]
    hostel = buildings["HOSTEL"]

    clusters = [
        IssueCluster(
            cluster_code="KLH-CL-101",
            title="Computer Labs Block — Wi-Fi Outage",
            summary="18 Wi-Fi complaints clustered in Computer Labs Block at KLH Aziz Nagar over 8 hours.",
            category_id=categories["wifi"].id,
            building_id=lab_block.id,
            affected_users=18,
            complaint_count=4,
            severity="HIGH",
            confidence=0.93,
            possible_root_cause="Likely pattern: access point KLH-AP-LAB-02 failure on 2nd floor",
            recommended_action="Dispatch network team to inspect AP-LAB-02 and backup router",
        ),
        IssueCluster(
            cluster_code="KLH-CL-102",
            title="Hostel Block — Maintenance Surge",
            summary="Multiple hostel maintenance and cleanliness complaints detected in Hostel Block.",
            category_id=categories["hostel"].id,
            building_id=hostel.id,
            affected_users=12,
            complaint_count=3,
            severity="MEDIUM",
            confidence=0.87,
            possible_root_cause="Possible root cause: plumbing line issue affecting multiple rooms",
            recommended_action="Schedule hostel maintenance team inspection for Block H",
        ),
    ]
    for cluster in clusters:
        db.add(cluster)
    await db.flush()

    lab_complaints = [c for c in complaints if c.building_id == lab_block.id][:3]
    hostel_complaints = [c for c in complaints if c.building_id == hostel.id][:2]
    for c in lab_complaints:
        db.add(IssueClusterMember(cluster_id=clusters[0].id, complaint_id=c.id, similarity_score=0.88))
    for c in hostel_complaints:
        db.add(IssueClusterMember(cluster_id=clusters[1].id, complaint_id=c.id, similarity_score=0.82))


async def _seed_klh_insights(db: AsyncSession) -> None:
    await db.execute(delete(AIInsight))
    db.add(
        AIInsight(
            title="Wi-Fi complaints surged 280% in Computer Labs Block",
            insight_type="surge_detection",
            metric="wifi_complaints",
            time_range="last_8_hours",
            evidence="4 related complaints at KLH Computer Labs Block, Aziz Nagar campus.",
            confidence=0.91,
            recommended_action="Inspect Computer Labs Block network infrastructure immediately.",
            source_records={"campus": "KLH Aziz Nagar", "building": "Computer Labs Block", "count": 4},
        )
    )
    db.add(
        AIInsight(
            title="Hostel Block emerging hotspot",
            insight_type="hotspot_detection",
            metric="hostel_complaints",
            time_range="last_24_hours",
            evidence="3 hostel complaints (water leak, cleanliness) in same building cluster.",
            confidence=0.85,
            recommended_action="Assign hostel admin team for Hostel Block inspection.",
            source_records={"campus": "KLH Aziz Nagar", "building": "Hostel Block"},
        )
    )


async def _seed_notifications(db: AsyncSession, student: User) -> None:
    if await db.scalar(select(Notification).limit(1)):
        return
    samples = [
        ("Welcome to CampusPulse KLH", "Track campus issues at KLH University Aziz Nagar.", "WelcomeCreated"),
        ("Wi-Fi complaint acknowledged", "Your Computer Labs Block Wi-Fi report has been acknowledged.", "ComplaintAcknowledged"),
        ("Hotspot alert — Hostel Block", "Multiple students reporting issues in Hostel Block.", "ClusterDetected"),
    ]
    for title, message, event in samples:
        db.add(Notification(user_id=student.id, title=title, message=message, event_type=event, is_read=False))


if __name__ == "__main__":
    asyncio.run(seed())
