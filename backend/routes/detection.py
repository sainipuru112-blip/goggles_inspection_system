"""
Detection API — live frame, detection results, and model selection.
"""

import io
import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse

router = APIRouter(prefix="/api/detection", tags=["Detection"])


def _get_globals():
    """Import the shared detection state from app module."""
    from app import (
        get_latest_frame,
        get_latest_result,
        get_camera_status,
        get_detection_stats,
        select_model,
        get_detection_active,
        set_detection_active,
    )
    return {
        "get_latest_frame": get_latest_frame,
        "get_latest_result": get_latest_result,
        "get_camera_status": get_camera_status,
        "get_detection_stats": get_detection_stats,
        "select_model": select_model,
        "get_detection_active": get_detection_active,
        "set_detection_active": set_detection_active,
    }


@router.get("/frame")
async def get_frame():
    """Return latest annotated frame as JPEG."""
    g = _get_globals()
    frame = g["get_latest_frame"]()

    if frame is None:
        blank = np.zeros((720, 1280, 3), dtype=np.uint8)
        _, jpeg = cv2.imencode(".jpg", blank)
        return StreamingResponse(
            io.BytesIO(jpeg.tobytes()),
            media_type="image/jpeg",
        )

    _, jpeg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
    return StreamingResponse(
        io.BytesIO(jpeg.tobytes()),
        media_type="image/jpeg",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Connection": "keep-alive",
        },
    )


@router.get("/result")
async def get_result():
    """Return latest detection result JSON."""
    g = _get_globals()
    result = g["get_latest_result"]()
    return JSONResponse(content=result)


@router.get("/status")
async def get_status():
    """Return camera and detector status."""
    g = _get_globals()
    status = g["get_camera_status"]()
    stats = g["get_detection_stats"]()
    return JSONResponse(content={**status, **stats})


@router.post("/model/{model_id}/select")
async def switch_model(model_id: int):
    """Switch the active detection model."""
    g = _get_globals()
    try:
        result = await g["select_model"](model_id)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/start")
async def start_detection():
    """Start detection processing."""
    g = _get_globals()
    active = g["set_detection_active"](True)
    return JSONResponse(content={"detection_active": active})


@router.post("/stop")
async def stop_detection():
    """Stop detection processing."""
    g = _get_globals()
    active = g["set_detection_active"](False)
    return JSONResponse(content={"detection_active": active})


@router.post("/toggle")
async def toggle_detection():
    """Toggle detection processing on/off."""
    g = _get_globals()
    current = g["get_detection_active"]()
    active = g["set_detection_active"](not current)
    return JSONResponse(content={"detection_active": active})
