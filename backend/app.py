"""
Hypervise AI Vision Platform — FastAPI Application Entry Point.

Orchestrates camera, detector, WebSocket, database, and API routes.
"""

import asyncio
import json
import os
import threading
import time
from contextlib import asynccontextmanager

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from config import (
    CORS_ORIGINS,
    APP_TITLE,
    APP_VERSION,
    APP_SUBTITLE,
    WS_PUSH_INTERVAL,
    SNAPSHOTS_DIR,
    WEIGHTS_DIR,
)
from database import init_db, AsyncSessionLocal
from camera.stream import CameraStream
from detector.yolo_detector import YOLODetector
from websocket.handler import ws_manager
from utils.snapshot import save_snapshot
from services.detection_service import record_inspection

# ── Routes ──────────────────────────────────────────────
from routes.parts import router as parts_router
from routes.models import router as models_router
from routes.history import router as history_router
from routes.detection import router as detection_router
from routes.settings import router as settings_router

# ── Globals ─────────────────────────────────────────────
camera: CameraStream | None = None
detector: YOLODetector | None = None

_result_lock = threading.Lock()
_latest_result: dict = {
    "class_name": None,
    "confidence": 0.0,
    "detected_parts": [],
    "configured_parts": [],
    "part_statuses": {},
    "overall_result": "WAITING",
    "cycle_time": 0.0,
    "fps": 0.0,
}
_latest_frame: np.ndarray | None = None
_detection_thread: threading.Thread | None = None
_running = False
_detection_active = False  # Detection starts stopped; user clicks "Start" to begin
_active_model_name = "person"


# ── Public accessors (used by routes/detection.py) ──────

def get_latest_frame() -> np.ndarray | None:
    with _result_lock:
        return _latest_frame.copy() if _latest_frame is not None else None


def get_latest_result() -> dict:
    with _result_lock:
        return _latest_result.copy()


def get_camera_status() -> dict:
    return {
        "camera_connected": camera.is_connected if camera else False,
        "camera_fps": camera.fps if camera else 0.0,
    }


def get_detection_stats() -> dict:
    with _result_lock:
        return {
            "active_model": _active_model_name,
            "fps": _latest_result.get("fps", 0.0),
            "cycle_time": _latest_result.get("cycle_time", 0.0),
            "detection_active": _detection_active,
        }


def get_detection_active() -> bool:
    return _detection_active


def set_detection_active(active: bool):
    """Start or stop the detection processing."""
    global _detection_active
    _detection_active = active
    if active and detector:
        detector.reset_cycle()
    print(f"[Detection] {'Started' if active else 'Stopped'}")
    return _detection_active


async def select_model(model_id: int) -> dict:
    """Switch the active detection model."""
    global _active_model_name

    async with AsyncSessionLocal() as session:
        from models.model import Model
        from sqlalchemy.orm import selectinload
        result = await session.execute(
            select(Model).options(selectinload(Model.parts)).where(Model.id == model_id)
        )
        model = result.scalar_one_or_none()
        if not model:
            raise ValueError(f"Model {model_id} not found")

        _active_model_name = model.model_name
        # Only include active parts for detection
        part_names = [p.part_name for p in model.parts if p.status == "active"]
        # Clean model_path (strip embedded quotes if any)
        model_path = (model.model_path or "").strip().strip('"').strip("'")
        print(f"[SelectModel] Model: {model.model_name}, Parts: {part_names}, Path: {model_path}")

        # Load YOLO weights if path exists
        if model_path and os.path.exists(model_path):
            detector.load_model(model_path, part_names)
        else:
            # Try in weights dir
            weight_path = os.path.join(WEIGHTS_DIR, model_path or "")
            if model_path and os.path.exists(weight_path):
                detector.load_model(weight_path, part_names)
            else:
                detector.set_configured_parts(part_names)

        detector.reset_cycle()

        # Immediately update _latest_result so WS pushes new parts
        # even when camera is disconnected / detection loop idle
        part_statuses = {p: False for p in part_names}
        with _result_lock:
            _latest_result.update({
                "configured_parts": part_names,
                "part_statuses": part_statuses,
                "detected_parts": [],
                "overall_result": "NG" if part_names else "WAITING",
                "model_name": model.model_name,
            })

        return {
            "model_name": model.model_name,
            "parts": part_names,
            "status": "active",
        }


# ── Detection Loop ──────────────────────────────────────

def _detection_loop():
    """Background thread: read frame → detect → store result → record history."""
    global _latest_result, _latest_frame, _running, _detection_active

    import asyncio
    _prev_overall = "WAITING"
    _last_record_time = 0
    _min_record_interval = 3.0  # Don't record more than once per 3 seconds
    _cycle_folder = None         # Current cycle's snapshot folder
    _cycle_snapshots = []        # List of snapshot paths for current cycle
    _snap_counter = 0            # Frame counter within cycle
    _last_snap_time = 0          # Last snapshot timestamp

    while _running:
        if camera is None or detector is None:
            time.sleep(0.5)
            continue

        frame = camera.get_frame()
        if frame is None:
            time.sleep(0.1)
            continue

        # If detection is paused, still show the live frame but skip inference
        if not _detection_active:
            with _result_lock:
                _latest_frame = frame.copy()
            # If a cycle was active but got stopped, record the final NG result
            if _cycle_folder is not None:
                try:
                    with _result_lock:
                        latest_res = _latest_result.copy()
                        latest_frame = _latest_frame.copy() if _latest_frame is not None else frame.copy()

                    overall = "NG"
                    configured_parts = latest_res.get("configured_parts", [])
                    part_statuses = latest_res.get("part_statuses", {})
                    ok_parts = [p for p, detected in part_statuses.items() if detected]
                    ng_parts = [p for p, detected in part_statuses.items() if not detected]

                    # Save final snapshot
                    snapshot_filename = save_snapshot(latest_frame, prefix="ng")
                    all_snapshots = list(_cycle_snapshots) + [snapshot_filename]

                    if configured_parts:
                        import asyncio
                        loop = asyncio.new_event_loop()
                        loop.run_until_complete(
                            record_inspection(
                                model_name=_active_model_name,
                                result=overall,
                                cycle_time=latest_res.get("cycle_time", 0.0),
                                ok_parts=ok_parts,
                                ng_parts=ng_parts,
                                snapshot_path=json.dumps(all_snapshots),
                            )
                        )
                        loop.close()
                        print(f"[History] Recorded manual stop NG — OK: {ok_parts}, NG: {ng_parts}, Snapshots: {len(all_snapshots)}")
                except Exception as e:
                    print(f"[History] Failed to record manual stop NG: {e}")

                _cycle_snapshots = []
                _cycle_folder = None
            time.sleep(0.033)
            continue

        # Create cycle folder on first active frame
        if _cycle_folder is None:
            from datetime import datetime as dt
            _cycle_folder = f"cycle_{dt.now().strftime('%Y%m%d_%H%M%S')}"
            cycle_dir = os.path.join(SNAPSHOTS_DIR, _cycle_folder)
            os.makedirs(cycle_dir, exist_ok=True)
            _cycle_snapshots = []
            _snap_counter = 0
            print(f"[Snapshots] New cycle folder: {_cycle_folder}")

        result = detector.detect(frame)
        overall = result["overall_result"]

        with _result_lock:
            _latest_result = {
                "class_name": result["class_name"],
                "confidence": result["confidence"],
                "detected_parts": result["detected_parts"],
                "configured_parts": result["configured_parts"],
                "part_statuses": result["part_statuses"],
                "overall_result": overall,
                "cycle_time": result["cycle_time"],
                "fps": result["fps"],
                "model_name": _active_model_name,
            }
            _latest_frame = result["frame"]

        # Save continuous snapshots every ~1 second
        now = time.time()
        if now - _last_snap_time >= 1.0 and _cycle_folder:
            _snap_counter += 1
            snap_name = f"frame_{_snap_counter:04d}.jpg"
            snap_path = os.path.join(SNAPSHOTS_DIR, _cycle_folder, snap_name)
            cv2.imwrite(snap_path, result["frame"], [cv2.IMWRITE_JPEG_QUALITY, 85])
            _cycle_snapshots.append(f"{_cycle_folder}/{snap_name}")
            _last_snap_time = now

        # Record history when result becomes OK (cycle completes successfully)
        if overall == "OK" and result["configured_parts"]:
            try:
                # Save final snapshot
                snapshot_filename = save_snapshot(result["frame"], prefix="ok")

                # Determine OK/NG parts
                ok_parts = [p for p, detected in result["part_statuses"].items() if detected]
                ng_parts = [p for p, detected in result["part_statuses"].items() if not detected]

                # Build snapshot list (cycle snapshots + final)
                all_snapshots = list(_cycle_snapshots) + [snapshot_filename]

                # Record to history (run async in new event loop)
                loop = asyncio.new_event_loop()
                loop.run_until_complete(
                    record_inspection(
                        model_name=_active_model_name,
                        result="OK",
                        cycle_time=result["cycle_time"],
                        ok_parts=ok_parts,
                        ng_parts=ng_parts,
                        snapshot_path=json.dumps(all_snapshots),
                    )
                )
                loop.close()

                _last_record_time = now
                print(f"[History] Recorded OK — OK: {ok_parts}, NG: {ng_parts}, Snapshots: {len(all_snapshots)}")

                # Auto-stop detection when cycle completes (all parts detected = OK)
                _detection_active = False
                detector.reset_cycle()
                _cycle_folder = None
                _cycle_snapshots = []
                with _result_lock:
                    _latest_result["overall_result"] = "WAITING"
                print("[Detection] Cycle complete (OK) — auto-stopped. Press Start for next cycle.")

            except Exception as e:
                print(f"[History] Failed to record: {e}")

        _prev_overall = overall
        time.sleep(0.033)  # ~30 FPS cap


# ── Database Seeding ────────────────────────────────────

async def seed_data():
    """Seed default parts and models on first run."""
    async with AsyncSessionLocal() as session:
        from models.part import Part
        from models.model import Model
        from models.model_part import ModelPart

        # Check if already seeded
        existing = await session.execute(select(Part))
        if existing.scalars().first():
            return

        # Seed parts
        parts_data = [
            ("Sunroof", "Sunroof panel on roof"),
            ("Without Sunroof", "Roof without sunroof panel"),
            ("Roof Rail", "Longitudinal roof rail"),
            ("Antenna", "Roof-mounted antenna"),
            ("Roof Moulding", "Roof edge moulding"),
            ("Mirror", "Side view mirror"),
            ("Tail Lamp", "Rear tail lamp assembly"),
            ("Door Handle", "External door handle"),
            ("Door Garnish", "Door garnish trim"),
            ("Bumper", "Front/rear bumper"),
            ("Quarter Glass", "Quarter panel glass"),
            ("Reflector", "Tail lamp reflector"),
            ("Garnish", "Decorative garnish trim"),
            ("Beltline", "Door beltline moulding"),
        ]

        part_objects = {}
        for name, desc in parts_data:
            part = Part(part_name=name, description=desc)
            session.add(part)
            await session.flush()
            part_objects[name] = part

        # Seed models with part assignments
        models_data = [
            ("Roof Model", "roof_body.pt", ["Sunroof", "Roof Rail", "Antenna", "Roof Moulding"]),
            ("Door Model", "door_model.pt", ["Door Handle", "Quarter Glass", "Mirror", "Beltline"]),
            ("Mirror Model", "mirror_model.pt", ["Mirror"]),
            ("Bumper Model", "bumper_model.pt", ["Bumper"]),
            ("Tail Lamp Model", "tail_lamp_model.pt", ["Tail Lamp", "Reflector", "Garnish"]),
        ]

        for model_name, model_path, part_names in models_data:
            model = Model(model_name=model_name, model_path=model_path)
            session.add(model)
            await session.flush()

            for pname in part_names:
                if pname in part_objects:
                    session.add(ModelPart(model_id=model.id, part_id=part_objects[pname].id))

        await session.commit()
        print("[Seed] Default parts and models created ✅")


# ── Lifespan ────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app):
    """Modern lifespan handler — startup and shutdown."""
    global camera, detector, _detection_thread, _running

    # ── Startup ──────────────────────────────────────
    await init_db()
    await seed_data()

    # Seed demo history
    from services.history_service import seed_demo_history
    await seed_demo_history()

    camera = CameraStream()

    # Load persisted camera settings from previous session
    from utils.persistent_settings import load_camera_settings
    saved_cam = load_camera_settings()
    import config as _cfg
    _cfg.SOURCE_TYPE = saved_cam["source_type"]
    if saved_cam["rtsp_url"]:
        _cfg.RTSP_URL = saved_cam["rtsp_url"]
    if saved_cam["video_path"]:
        _cfg.VIDEO_PATH = saved_cam["video_path"]
    camera._webcam_index = saved_cam.get("webcam_index", 0)
    print(f"[Startup] Loaded camera settings: {saved_cam['source_type']}")


    camera.start()

    detector = YOLODetector()
    # Load default model parts (use first active model)
    async with AsyncSessionLocal() as session:
        from models.model import Model
        from sqlalchemy.orm import selectinload
        result = await session.execute(
            select(Model).options(selectinload(Model.parts)).where(Model.status == "active").limit(1)
        )
        model = result.scalar_one_or_none()
        if model:
            _active_model_name = model.model_name
            # Only include active parts for detection
            part_names = [p.part_name for p in model.parts if p.status == "active"]
            # Clean model_path (strip embedded quotes if any)
            model_path = (model.model_path or "").strip().strip('"').strip("'")
            if model_path and os.path.exists(model_path):
                detector.load_model(model_path, part_names)
            else:
                weight_path = os.path.join(WEIGHTS_DIR, model_path)
                if model_path and os.path.exists(weight_path):
                    detector.load_model(weight_path, part_names)
                else:
                    detector.set_configured_parts(part_names)
            # Immediately populate _latest_result so WS pushes parts
            with _result_lock:
                _latest_result.update({
                    "configured_parts": part_names,
                    "part_statuses": {p: False for p in part_names},
                    "detected_parts": [],
                    "overall_result": "NG" if part_names else "WAITING",
                    "model_name": model.model_name,
                })
            print(f"[Startup] Default model: {model.model_name}, Parts: {part_names}")
        else:
            print("[Startup] No active models found")

    _running = True
    _detection_thread = threading.Thread(target=_detection_loop, daemon=True)
    _detection_thread.start()

    print(f"[App] {APP_TITLE} v{APP_VERSION} started ✅")

    yield  # App runs here

    # ── Shutdown ─────────────────────────────────────
    _running = False
    if camera:
        camera.stop()
    print(f"[App] {APP_TITLE} stopped 🛑")


# ── FastAPI App ─────────────────────────────────────────

app = FastAPI(title=APP_TITLE, version=APP_VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(parts_router)
app.include_router(models_router)
app.include_router(history_router)
app.include_router(detection_router)
app.include_router(settings_router)

# Serve snapshots as static files
if os.path.exists(SNAPSHOTS_DIR):
    app.mount("/snapshots", StaticFiles(directory=SNAPSHOTS_DIR), name="snapshots")


# ── WebSocket ───────────────────────────────────────────

@app.websocket("/ws/detection")
async def ws_detection(websocket: WebSocket):
    """Push real-time detection results to connected clients."""
    await ws_manager.connect(websocket)
    try:
        while True:
            with _result_lock:
                data = _latest_result.copy()
            await websocket.send_json(data)
            await asyncio.sleep(WS_PUSH_INTERVAL)
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        print(f"[WS] Error: {e}")
        ws_manager.disconnect(websocket)


# ── Entry Point ─────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
