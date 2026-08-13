from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.realtime.routes import router as realtime_router
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.middleware import RequestIdMiddleware, http_exception_handler


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(RequestIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(HTTPException, http_exception_handler)
app.include_router(api_router)
app.include_router(realtime_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.app_name}


@app.get("/ready")
async def ready():
    return {"status": "ready"}
