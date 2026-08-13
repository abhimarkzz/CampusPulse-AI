from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "CampusPulse AI"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "change-me"
    database_url: str = "postgresql+asyncpg://campuspulse:campuspulse@localhost:5432/campuspulse"
    database_url_sync: str = "postgresql://campuspulse:campuspulse@localhost:5432/campuspulse"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret_key: str = "change-me-jwt"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    ai_provider: str = "mock"
    openai_api_key: str = ""
    gemini_api_key: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
