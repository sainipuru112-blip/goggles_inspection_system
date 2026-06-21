"""
Snapshot utility — captures and stores inspection frames.
"""

import os
import time
from datetime import datetime

import cv2
import numpy as np

from config import SNAPSHOTS_DIR


def save_snapshot(frame: np.ndarray, prefix: str = "snap") -> str:
    """
    Save a frame as a JPEG snapshot.

    Returns the filename (relative to SNAPSHOTS_DIR).
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    filename = f"{prefix}_{timestamp}.jpg"
    filepath = os.path.join(SNAPSHOTS_DIR, filename)

    cv2.imwrite(filepath, frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
    return filename


def get_snapshot_path(filename: str) -> str:
    """Return absolute path for a snapshot filename."""
    return os.path.join(SNAPSHOTS_DIR, filename)
