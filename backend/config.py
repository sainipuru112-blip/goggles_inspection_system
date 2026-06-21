"""
Hypervise AI Vision Platform — Central Configuration.

All tuneable parameters live here. Override via environment variables where noted.
"""

import os

# ── Paths ──────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_DIR = os.path.join(BASE_DIR, "database")
SNAPSHOTS_DIR = os.path.join(BASE_DIR, "snapshots")
WEIGHTS_DIR = os.path.join(BASE_DIR, "weights")

os.makedirs(DATABASE_DIR, exist_ok=True)
os.makedirs(SNAPSHOTS_DIR, exist_ok=True)
os.makedirs(WEIGHTS_DIR, exist_ok=True)

DATABASE_URL = f"sqlite+aiosqlite:///{os.path.join(DATABASE_DIR, 'hypervise.db')}"

# ── Video Source ───────────────────────────────────────
# SOURCE_TYPE: "rtsp" | "video" | "webcam"
SOURCE_TYPE = os.environ.get("SOURCE_TYPE", "video")
RTSP_URL = os.environ.get("RTSP_URL", "rtsp://admin:admin@192.168.1.68:554/Streaming/Channels/101")
VIDEO_PATH = os.environ.get("VIDEO_PATH", r"C:\Users\Eternal\Downloads\sample_video.mp4")

# ── Inference Settings ─────────────────────────────────
CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", "0.80"))
FRAME_WIDTH = int(os.environ.get("FRAME_WIDTH", "1280"))
FRAME_HEIGHT = int(os.environ.get("FRAME_HEIGHT", "720"))

# ── ROI Settings ───────────────────────────────────────
ROI_Y = int(os.environ.get("ROI_Y", "430"))

# ── Server Settings ────────────────────────────────────
WS_PUSH_INTERVAL = float(os.environ.get("WS_PUSH_INTERVAL", "0.5"))
FRAME_READ_INTERVAL = float(os.environ.get("FRAME_READ_INTERVAL", "0.033"))
SNAPSHOT_INTERVAL = float(os.environ.get("SNAPSHOT_INTERVAL", "1.0"))

# ── CORS ───────────────────────────────────────────────
CORS_ORIGINS = ["*"]

# ── Application Info ───────────────────────────────────
APP_TITLE = "Hypervise AI Vision Platform"
APP_VERSION = "1.0.0"
APP_SUBTITLE = "WSMB Roof Body POC"
