from fastapi import APIRouter

from app.api.v1.admin.routes import router as admin_router
from app.api.v1.ai.routes import router as ai_router
from app.api.v1.analytics.routes import router as analytics_router
from app.api.v1.auth.routes import router as auth_router
from app.api.v1.categories.routes import router as taxonomy_router
from app.api.v1.clusters.routes import router as clusters_router
from app.api.v1.complaints.routes import router as complaints_router
from app.api.v1.notifications.routes import router as notifications_router
from app.api.v1.users.routes import router as users_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(complaints_router)
api_router.include_router(taxonomy_router)
api_router.include_router(analytics_router)
api_router.include_router(notifications_router)
api_router.include_router(ai_router)
api_router.include_router(admin_router)
api_router.include_router(users_router)
api_router.include_router(clusters_router)
