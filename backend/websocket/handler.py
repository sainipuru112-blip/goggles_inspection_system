"""
WebSocket Connection Manager — broadcasts detection results to all clients.
"""

import asyncio
import json
from typing import List

from fastapi import WebSocket, WebSocketDisconnect


class ConnectionManager:
    """Manages WebSocket connections and broadcasts messages."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WS] Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Remove a disconnected WebSocket."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"[WS] Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, data: dict):
        """Send JSON data to all connected clients."""
        disconnected = []
        for ws in self.active_connections:
            try:
                await ws.send_json(data)
            except Exception:
                disconnected.append(ws)

        for ws in disconnected:
            self.disconnect(ws)

    async def send_personal(self, websocket: WebSocket, data: dict):
        """Send JSON data to a specific client."""
        try:
            await websocket.send_json(data)
        except Exception:
            self.disconnect(websocket)


# Singleton instance
ws_manager = ConnectionManager()
