"""
YOLO Detector — multi-model support with per-part detection tracking.

Loads YOLO models dynamically, runs inference, and tracks which parts
from the configured model have been detected.
"""

import time
import cv2
import numpy as np

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("[YOLODetector] WARNING: ultralytics not installed. Running in demo mode.")

from config import CONFIDENCE_THRESHOLD


class YOLODetector:
    """Multi-model YOLO detector with per-part tracking."""

    def __init__(self):
        self._model = None
        self._model_path = None
        self._class_names = {}
        self._cycle_start = time.time()
        self._cycle_time = 0.0
        self._fps = 0.0
        self._frame_count = 0
        self._fps_timer = time.time()
        self._detected_parts = set()
        self._configured_parts = []  # list of part names from the selected model config

    @property
    def cycle_time(self) -> float:
        return round(self._cycle_time, 3)

    @property
    def fps(self) -> float:
        return round(self._fps, 1)

    @property
    def detected_parts(self) -> set:
        return self._detected_parts.copy()

    def load_model(self, model_path: str, part_names: list[str] = None):
        """Load a YOLO model from the given path."""
        if not YOLO_AVAILABLE:
            print(f"[YOLODetector] Demo mode — would load {model_path}")
            self._model_path = model_path
            self._configured_parts = part_names or []
            self._detected_parts = set()
            return

        try:
            print(f"[YOLODetector] Loading model from {model_path} …")
            self._model = YOLO(model_path)
            self._class_names = self._model.names
            self._model_path = model_path
            self._configured_parts = part_names or []
            self._detected_parts = set()
            print(f"[YOLODetector] Model loaded. Classes: {self._class_names}")
        except Exception as e:
            print(f"[YOLODetector] Failed to load model: {e}")
            self._model = None

    def set_configured_parts(self, part_names: list[str]):
        """Set the list of parts that should be detected for the current model."""
        self._configured_parts = part_names
        self._detected_parts = set()

    def reset_cycle(self):
        """Reset detection state for a new cycle."""
        self._detected_parts = set()
        self._cycle_start = time.time()

    def _get_target_class_ids(self) -> list[int]:
        """Map configured part names to YOLO class IDs for filtered inference."""
        if not self._configured_parts or not self._class_names:
            return []

        target_ids = []
        for part in self._configured_parts:
            part_normalized = part.lower().replace(" ", "_")
            for cls_id, cls_name in self._class_names.items():
                if cls_name.lower().replace(" ", "_") == part_normalized:
                    target_ids.append(cls_id)
                    break
        return target_ids

    def detect(self, frame: np.ndarray) -> dict:
        """
        Run inference on a single BGR frame.

        Returns dict with: class_name, confidence, frame,
        detected_parts, configured_parts, part_statuses, overall_result
        """
        self._cycle_time = time.time() - self._cycle_start

        # FPS tracking
        self._frame_count += 1
        elapsed = time.time() - self._fps_timer
        if elapsed >= 1.0:
            self._fps = self._frame_count / elapsed
            self._frame_count = 0
            self._fps_timer = time.time()

        # If no model loaded, return demo/blank result
        if not YOLO_AVAILABLE or self._model is None:
            return self._demo_result(frame)

        # Filter YOLO to only detect configured part classes
        target_class_ids = self._get_target_class_ids()
        if target_class_ids:
            results = self._model(frame, verbose=False, conf=CONFIDENCE_THRESHOLD, classes=target_class_ids)
        else:
            results = self._model(frame, verbose=False, conf=CONFIDENCE_THRESHOLD)

        best_class = None
        best_conf = 0.0
        annotated = frame.copy()

        for result in results:
            boxes = result.boxes
            if boxes is None or len(boxes) == 0:
                continue

            for box in boxes:
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                cls_name = self._class_names.get(cls_id, "unknown")

                # Track detected parts
                for part in self._configured_parts:
                    if part.lower().replace(" ", "_") == cls_name.lower().replace(" ", "_"):
                        self._detected_parts.add(part)

                if conf > best_conf:
                    best_conf = conf
                    best_class = cls_name

                # Draw bounding box
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                color = (0, 200, 0) if cls_name != "without_sunroof" else (0, 0, 230)

                cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 3)

                label = f"{cls_name} {conf:.1%}"
                font = cv2.FONT_HERSHEY_SIMPLEX
                (tw, th), _ = cv2.getTextSize(label, font, 0.7, 2)
                cv2.rectangle(annotated, (x1, y1 - th - 12), (x1 + tw + 8, y1), color, -1)
                cv2.putText(annotated, label, (x1 + 4, y1 - 6), font, 0.7, (255, 255, 255), 2, cv2.LINE_AA)

        # Part statuses
        part_statuses = {}
        for part in self._configured_parts:
            part_statuses[part] = part in self._detected_parts

        # Overall result
        if not self._configured_parts:
            overall = "WAITING"
        elif all(part_statuses.values()):
            overall = "OK"
        else:
            overall = "NG"

        return {
            "class_name": best_class,
            "confidence": round(best_conf, 4),
            "frame": annotated,
            "detected_parts": list(self._detected_parts),
            "configured_parts": self._configured_parts,
            "part_statuses": part_statuses,
            "overall_result": overall,
            "cycle_time": self._cycle_time,
            "fps": self._fps,
        }

    def _demo_result(self, frame: np.ndarray) -> dict:
        """Generate a demo result when YOLO is not available."""
        import random

        annotated = frame.copy()

        # Simulate random detections for demo
        demo_detected = set()
        for part in self._configured_parts:
            if random.random() > 0.3:
                demo_detected.add(part)
        self._detected_parts = demo_detected

        part_statuses = {}
        for part in self._configured_parts:
            part_statuses[part] = part in self._detected_parts

        if not self._configured_parts:
            overall = "WAITING"
        elif all(part_statuses.values()):
            overall = "OK"
        else:
            overall = "NG"

        return {
            "class_name": None,
            "confidence": 0.0,
            "frame": annotated,
            "detected_parts": list(self._detected_parts),
            "configured_parts": self._configured_parts,
            "part_statuses": part_statuses,
            "overall_result": overall,
            "cycle_time": self._cycle_time,
            "fps": self._fps,
        }
