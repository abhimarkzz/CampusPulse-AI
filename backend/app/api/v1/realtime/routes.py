import json
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["realtime"])

connections: set[WebSocket] = set()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connections.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(json.dumps({"type": "echo", "payload": data}))
    except WebSocketDisconnect:
        connections.discard(websocket)


async def broadcast_event(event_type: str, payload: dict[str, Any]) -> None:
    message = json.dumps({"type": event_type, "payload": payload})
    stale: list[WebSocket] = []
    for ws in connections:
        try:
            await ws.send_text(message)
        except Exception:
            stale.append(ws)
    for ws in stale:
        connections.discard(ws)
