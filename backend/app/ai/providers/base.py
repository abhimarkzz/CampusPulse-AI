from abc import ABC, abstractmethod
from typing import Any


class AIProvider(ABC):
    @abstractmethod
    async def classify(self, text: str) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    async def summarize(self, text: str) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    async def embed(self, text: str) -> list[float]:
        raise NotImplementedError

    @abstractmethod
    async def analyze_image(self, image_url: str) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    async def assistant_reply(self, message: str, context: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    async def moderate(self, text: str) -> dict[str, Any]:
        raise NotImplementedError
