"""
Camera Stream — thread-safe video capture with reconnection.

Supports RTSP, video file, webcam, and IP camera sources.
Allows runtime source switching.
"""

import threading
import time

import cv2
import numpy as np

import config


class CameraStream:
    """Thread-safe video capture wrapper with auto-reconnection and live source switching."""

    def __init__(self):
        self._lock = threading.Lock()
        self._frame: np.ndarray | None = None
        self._connected = False
        self._running = False
        self._cap: cv2.VideoCapture | None = None
        self._thread: threading.Thread | None = None
        self._fps = 0.0
        self._frame_count = 0
        self._fps_timer = time.time()
        self._switch_event = threading.Event()
        self._source_info = ""  # Human-readable current source description

    # ── Public API ─────────────────────────────────────

    @property
    def is_connected(self) -> bool:
        return self._connected

    @property
    def fps(self) -> float:
        return round(self._fps, 1)

    @property
    def source_info(self) -> str:
        return self._source_info

    def start(self):
        """Open video source and start capture thread."""
        self._open_source()
        self._running = True
        self._thread = threading.Thread(target=self._capture_loop, daemon=True)
        self._thread.start()

    def stop(self):
        """Release resources."""
        self._running = False
        self._switch_event.set()  # unblock any sleep
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=3)
        self._release()

    def get_frame(self) -> np.ndarray | None:
        """Return the most recent frame (BGR numpy array) or None."""
        with self._lock:
            return self._frame.copy() if self._frame is not None else None

    def switch_source(self, source_type: str, rtsp_url: str = None,
                      video_path: str = None, webcam_index: int = 0):
        """
        Switch the camera source at runtime.

        Args:
            source_type: "webcam" | "rtsp" | "video" | "ip_camera"
            rtsp_url: RTSP URL (for rtsp/ip_camera types)
            video_path: Path to video file (for video type)
            webcam_index: Webcam device index (for webcam type)
        """
        # Update config
        config.SOURCE_TYPE = source_type
        if rtsp_url is not None:
            config.RTSP_URL = rtsp_url
        if video_path is not None:
            config.VIDEO_PATH = video_path

        # Store webcam index
        self._webcam_index = webcam_index

        # Signal the capture loop to reconnect
        print(f"[CameraStream] Switching source to: {source_type}")
        self._release()
        self._open_source()

        return {
            "source_type": source_type,
            "connected": self._connected,
            "source_info": self._source_info,
        }

    def get_source_status(self) -> dict:
        """Return current source configuration and status."""
        return {
            "source_type": config.SOURCE_TYPE,
            "connected": self._connected,
            "fps": self.fps,
            "source_info": self._source_info,
            "rtsp_url": config.RTSP_URL if config.SOURCE_TYPE == "rtsp" else "",
            "video_path": config.VIDEO_PATH if config.SOURCE_TYPE == "video" else "",
        }

    # ── Internals ──────────────────────────────────────

    def _open_source(self):
        """Initialize cv2.VideoCapture from config."""
        self._release()

        source_type = config.SOURCE_TYPE
        webcam_index = getattr(self, "_webcam_index", 0)

        if source_type == "rtsp":
            self._cap = cv2.VideoCapture(config.RTSP_URL, cv2.CAP_FFMPEG)
            self._source_info = f"RTSP: {config.RTSP_URL}"
        elif source_type == "ip_camera":
            # IP camera via HTTP/RTSP URL
            self._cap = cv2.VideoCapture(config.RTSP_URL)
            self._source_info = f"IP Camera: {config.RTSP_URL}"
        elif source_type == "webcam":
            self._cap = cv2.VideoCapture(webcam_index, cv2.CAP_DSHOW)
            self._source_info = f"Webcam (Device {webcam_index})"
        else:
            self._cap = cv2.VideoCapture(config.VIDEO_PATH)
            self._source_info = f"Video: {config.VIDEO_PATH}"

        if self._cap and self._cap.isOpened():
            self._connected = True
            print(f"[CameraStream] Opened source: {self._source_info}")
        else:
            self._connected = False
            print(f"[CameraStream] FAILED to open source: {self._source_info}")

    def _release(self):
        if self._cap is not None:
            self._cap.release()
            self._cap = None
            self._connected = False

    def _capture_loop(self):
        """Continuously read frames in the background."""
        reconnect_wait = 5

        while self._running:
            if self._cap is None or not self._cap.isOpened():
                self._connected = False
                print("[CameraStream] Source lost — attempting reconnect …")
                time.sleep(reconnect_wait)
                self._open_source()
                continue

            ret, frame = self._cap.read()

            if not ret:
                if config.SOURCE_TYPE == "video":
                    self._cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    time.sleep(0.1)
                    continue
                else:
                    self._connected = False
                    time.sleep(reconnect_wait)
                    self._open_source()
                    continue

            frame = cv2.resize(frame, (config.FRAME_WIDTH, config.FRAME_HEIGHT))

            with self._lock:
                self._frame = frame
                self._connected = True

            # FPS calculation
            self._frame_count += 1
            elapsed = time.time() - self._fps_timer
            if elapsed >= 1.0:
                self._fps = self._frame_count / elapsed
                self._frame_count = 0
                self._fps_timer = time.time()

            time.sleep(config.FRAME_READ_INTERVAL)
