import hashlib
import re
from typing import Any

from app.ai.providers.base import AIProvider

CATEGORY_KEYWORDS = {
    "wifi": ("Wi-Fi", "network-ops", "HIGH"),
    "internet": ("Wi-Fi", "network-ops", "HIGH"),
    "projector": ("Classroom", "it-support", "MEDIUM"),
    "hostel": ("Hostel", "hostel-admin", "MEDIUM"),
    "water": ("Plumbing", "maintenance", "HIGH"),
    "leak": ("Plumbing", "maintenance", "CRITICAL"),
    "clean": ("Cleanliness", "housekeeping", "LOW"),
    "security": ("Security", "security", "HIGH"),
    "electric": ("Electrical", "maintenance", "HIGH"),
    "lab": ("Laboratory", "it-support", "MEDIUM"),
}


class MockAIProvider(AIProvider):
    """Deterministic fallback provider when no external LLM is configured."""

    async def classify(self, text: str) -> dict[str, Any]:
        lowered = text.lower()
        category, department, priority = "Maintenance", "maintenance", "MEDIUM"
        for keyword, (cat, dept, pri) in CATEGORY_KEYWORDS.items():
            if keyword in lowered:
                category, department, priority = cat, dept, pri
                break
        room_match = re.search(r"room\s*(\d+)", lowered)
        block_match = re.search(r"([a-z])\s*block", lowered)
        return {
            "category": category,
            "subcategory": category,
            "location": f"{block_match.group(1).upper()} Block" if block_match else None,
            "room": room_match.group(1) if room_match else None,
            "priority": priority,
            "department": department,
            "summary": text[:180],
            "keywords": [w for w in re.findall(r"[a-zA-Z]{4,}", text)[:5]],
            "urgency": priority,
            "confidence": 0.72,
        }

    async def summarize(self, text: str) -> dict[str, Any]:
        return {
            "issue_summary": text[:200],
            "current_state": "Awaiting staff action",
            "actions_taken": [],
            "outstanding_actions": ["Review and assign complaint"],
            "recommended_next_step": "Assign to appropriate department",
            "confidence": 0.7,
        }

    async def embed(self, text: str) -> list[float]:
        digest = hashlib.sha256(text.encode()).digest()
        return [((b / 255.0) * 2 - 1) for b in digest[:32]]

    async def analyze_image(self, image_url: str) -> dict[str, Any]:
        return {
            "detected_issue_type": "Possible infrastructure damage",
            "visible_equipment": "Unknown",
            "ocr_text": "",
            "damage_indicators": ["visual anomaly detected"],
            "confidence": 0.55,
            "image_url": image_url,
        }

    async def assistant_reply(self, message: str, context: dict[str, Any]) -> dict[str, Any]:
        lowered = message.lower()
        complaints = context.get("complaints", [])
        if "how many" in lowered:
            return {
                "reply": f"You currently have {len(complaints)} complaint(s) on record.",
                "confidence": 0.95,
            }
        if "wifi" in lowered or "wi-fi" in lowered:
            matches = [c for c in complaints if "wifi" in c.get("title", "").lower()]
            if matches:
                return {
                    "reply": f"Your Wi-Fi complaint '{matches[0]['title']}' is {matches[0]['status']}.",
                    "confidence": 0.88,
                }
        if "create" in lowered:
            return {
                "reply": "I can help you create a complaint. Use the New Complaint page or describe the issue here.",
                "confidence": 0.8,
                "action": "navigate",
                "target": "/complaints/new",
            }
        return {
            "reply": "I can help track complaints, find similar issues, and explain status updates. What would you like to know?",
            "confidence": 0.75,
        }

    async def moderate(self, text: str) -> dict[str, Any]:
        blocked = any(word in text.lower() for word in ["hack", "exploit", "ignore previous"])
        return {"allowed": not blocked, "confidence": 0.9}
