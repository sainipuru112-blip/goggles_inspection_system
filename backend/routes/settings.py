"""
Settings & Camera API — get/update runtime configuration, switch camera source.
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

import config

router = APIRouter(prefix="/api/settings", tags=["Settings"])


# ── Pydantic Schemas ──────────────────────────────────
class SettingsUpdate(BaseModel):
    source_type: Optional[str] = None
    rtsp_url: Optional[str] = None
    video_path: Optional[str] = None
    confidence_threshold: Optional[float] = None
    frame_width: Optional[int] = None
    frame_height: Optional[int] = None
    roi_y: Optional[int] = None
    snapshot_interval: Optional[float] = None


class CameraSwitch(BaseModel):
    source_type: str  # "webcam" | "rtsp" | "video" | "ip_camera"
    rtsp_url: Optional[str] = None
    video_path: Optional[str] = None
    webcam_index: Optional[int] = 0


# ── Settings Endpoints ────────────────────────────────

@router.get("")
async def get_settings():
    """Return current settings."""
    return JSONResponse(content={
        "source_type": config.SOURCE_TYPE,
        "rtsp_url": config.RTSP_URL,
        "video_path": config.VIDEO_PATH,
        "confidence_threshold": config.CONFIDENCE_THRESHOLD,
        "frame_width": config.FRAME_WIDTH,
        "frame_height": config.FRAME_HEIGHT,
        "roi_y": config.ROI_Y,
        "snapshot_interval": config.SNAPSHOT_INTERVAL,
        "ws_push_interval": config.WS_PUSH_INTERVAL,
        "app_title": config.APP_TITLE,
        "app_version": config.APP_VERSION,
        "app_subtitle": config.APP_SUBTITLE,
    })


@router.put("")
async def update_settings(body: SettingsUpdate):
    """Update runtime settings (non-persistent — resets on restart)."""
    if body.source_type is not None:
        config.SOURCE_TYPE = body.source_type
    if body.rtsp_url is not None:
        config.RTSP_URL = body.rtsp_url
    if body.video_path is not None:
        config.VIDEO_PATH = body.video_path
    if body.confidence_threshold is not None:
        config.CONFIDENCE_THRESHOLD = body.confidence_threshold
    if body.frame_width is not None:
        config.FRAME_WIDTH = body.frame_width
    if body.frame_height is not None:
        config.FRAME_HEIGHT = body.frame_height
    if body.roi_y is not None:
        config.ROI_Y = body.roi_y
    if body.snapshot_interval is not None:
        config.SNAPSHOT_INTERVAL = body.snapshot_interval

    return JSONResponse(content={"detail": "Settings updated"})


# ── Camera Endpoints ──────────────────────────────────

@router.post("/camera/switch")
async def switch_camera(body: CameraSwitch):
    """Switch camera source at runtime — immediately reconnects."""
    from app import camera

    if camera is None:
        return JSONResponse(
            status_code=500,
            content={"detail": "Camera system not initialized"}
        )

    result = camera.switch_source(
        source_type=body.source_type,
        rtsp_url=body.rtsp_url,
        video_path=body.video_path,
        webcam_index=body.webcam_index or 0,
    )

    # Persist camera settings for next restart
    from utils.persistent_settings import save_camera_settings
    save_camera_settings(
        source_type=body.source_type,
        rtsp_url=body.rtsp_url or "",
        video_path=body.video_path or "",
        webcam_index=body.webcam_index or 0,
    )

    return JSONResponse(content={
        "detail": f"Camera switched to {body.source_type}",
        **result,
    })


@router.get("/camera/status")
async def camera_status():
    """Get current camera source info and connection status."""
    from app import camera

    if camera is None:
        return JSONResponse(content={
            "source_type": config.SOURCE_TYPE,
            "connected": False,
            "fps": 0,
            "source_info": "Camera not initialized",
        })

    return JSONResponse(content=camera.get_source_status())


@router.get("/camera/sources")
async def available_sources():
    """Return list of available camera source types."""
    return JSONResponse(content={
        "sources": [
            {
                "type": "webcam",
                "label": "Webcam",
                "description": "Local USB/built-in webcam",
                "icon": "videocam",
                "fields": [
                    {"name": "webcam_index", "label": "Device Index", "type": "number", "default": 0}
                ],
            },
            {
                "type": "rtsp",
                "label": "RTSP Camera",
                "description": "Network camera via RTSP protocol",
                "icon": "linked_camera",
                "fields": [
                    {"name": "rtsp_url", "label": "RTSP URL", "type": "text",
                     "placeholder": "rtsp://user:pass@192.168.1.68:554/stream"}
                ],
            },
            {
                "type": "ip_camera",
                "label": "IP Camera",
                "description": "Network camera via HTTP/MJPEG stream",
                "icon": "camera_outdoor",
                "fields": [
                    {"name": "rtsp_url", "label": "Camera URL", "type": "text",
                     "placeholder": "http://192.168.1.100:8080/video"}
                ],
            },
            {
                "type": "video",
                "label": "Video File",
                "description": "Playback from a recorded video file",
                "icon": "movie",
                "fields": [
                    {"name": "video_path", "label": "File Path", "type": "text",
                     "placeholder": "C:\\path\\to\\video.mp4"}
                ],
            },

        ]
    })
