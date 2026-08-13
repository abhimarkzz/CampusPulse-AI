from app.ai.providers.base import AIProvider
from app.ai.providers.mock_provider import MockAIProvider
from app.core.config import settings


def get_ai_provider() -> AIProvider:
    provider = (settings.ai_provider or "mock").lower()
    if provider in {"openai", "gemini"}:
        # External providers can be added without changing call sites.
        return MockAIProvider()
    return MockAIProvider()
