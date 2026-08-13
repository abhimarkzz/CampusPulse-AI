from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.domain import Building, Campus, ComplaintCategory, ComplaintSubcategory, Department, Room
from app.models.user import User
from app.schemas.common import ApiResponse
from app.services.map_service import get_map_overview

router = APIRouter(tags=["taxonomy"])


@router.get("/categories", response_model=ApiResponse)
async def categories(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(ComplaintCategory))
    cats = result.scalars().all()
    data = []
    for cat in cats:
        subs = await db.execute(select(ComplaintSubcategory).where(ComplaintSubcategory.category_id == cat.id))
        data.append({
            "id": str(cat.id),
            "name": cat.name,
            "slug": cat.slug,
            "icon": cat.icon,
            "subcategories": [{"id": str(s.id), "name": s.name, "slug": s.slug} for s in subs.scalars().all()],
        })
    return ApiResponse(data=data)


@router.get("/departments", response_model=ApiResponse)
async def departments(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Department))
    return ApiResponse(data=[{"id": str(d.id), "name": d.name, "code": d.code} for d in result.scalars().all()])


@router.get("/locations/campuses", response_model=ApiResponse)
async def campuses(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Campus))
    return ApiResponse(data=[{"id": str(c.id), "name": c.name, "code": c.code, "latitude": c.latitude, "longitude": c.longitude} for c in result.scalars().all()])


@router.get("/locations/buildings", response_model=ApiResponse)
async def buildings(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Building))
    return ApiResponse(data=[{"id": str(b.id), "campus_id": str(b.campus_id), "name": b.name, "code": b.code, "latitude": b.latitude, "longitude": b.longitude} for b in result.scalars().all()])


@router.get("/locations/rooms", response_model=ApiResponse)
async def rooms(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Room))
    return ApiResponse(data=[{"id": str(r.id), "building_id": str(r.building_id), "name": r.name, "floor": r.floor} for r in result.scalars().all()])


@router.get("/locations/map-overview", response_model=ApiResponse)
async def map_overview(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    return ApiResponse(data=await get_map_overview(db))
