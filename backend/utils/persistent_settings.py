"""
Persistent settings — saves/loads runtime settings to a JSON file
so they survive application restarts.
"""

import json
import os

from config import BASE_DIR

SETTINGS_FILE = os.path.join(BASE_DIR, "database", "camera_settings.json")

DEFAULT_SETTINGS = {
    "source_type": "webcam",
    "rtsp_url": "",
    "video_path": "",
    "webcam_index": 0,
}


def load_camera_settings() -> dict:
    """Load camera settings from disk. Returns defaults if file doesn't exist."""
    try:
        if os.path.exists(SETTINGS_FILE):
            with open(SETTINGS_FILE, "r") as f:
                data = json.load(f)
            # Merge with defaults to handle missing keys
            return {**DEFAULT_SETTINGS, **data}
    except (json.JSONDecodeError, IOError) as e:
        print(f"[Settings] Failed to load camera settings: {e}")
    return DEFAULT_SETTINGS.copy()


def save_camera_settings(source_type: str, rtsp_url: str = "", video_path: str = "", webcam_index: int = 0):
    """Save camera settings to disk."""
    data = {
        "source_type": source_type,
        "rtsp_url": rtsp_url,
        "video_path": video_path,
        "webcam_index": webcam_index,
    }
    try:
        os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
        with open(SETTINGS_FILE, "w") as f:
            json.dump(data, f, indent=2)
        print(f"[Settings] Camera settings saved: {source_type}")
    except IOError as e:
        print(f"[Settings] Failed to save camera settings: {e}")
    return data
