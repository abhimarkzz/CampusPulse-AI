from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from app.core.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.common import ApiResponse, LoginRequest, TokenResponse, UserCreate, UserRead
from app.services.auth_service import authenticate_user, build_token_response, create_user

router = APIRouter(prefix="/auth", tags=["auth"])


def serialize_user(user: User) -> UserRead:
    return UserRead(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.name.value,
        department_id=user.department_id,
        is_active=user.is_active,
        is_verified=user.is_verified,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
    )


@router.post("/register", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        user = await create_user(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    result = await db.execute(
        select(User).options(selectinload(User.role)).where(User.id == user.id)
    )
    created = result.scalar_one()
    return ApiResponse(data=serialize_user(created))


@router.post("/login", response_model=ApiResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    result = await db.execute(
        select(User).options(selectinload(User.role)).where(User.id == user.id)
    )
    authenticated = result.scalar_one()
    tokens = build_token_response(authenticated)
    response = TokenResponse(**tokens, user=serialize_user(authenticated))
    return ApiResponse(data=response.model_dump())


@router.get("/me", response_model=ApiResponse)
async def me(current_user: User = Depends(get_current_user)):
    return ApiResponse(data=serialize_user(current_user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout():
    return None
