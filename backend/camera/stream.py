"""
Camera Stream — thread-safe video capture with frame skipping, buffer flushing,
and frame integrity protection.

Supports RTSP, video file, webcam, and IP camera sources.
Allows runtime source switching cleanly on the capture thread.
Includes frame rate throttling (e.g., 6 FPS target) with active RTSP buffer flushing
to ensure zero latency and zero H.264 decoder overload.
"""

import threading
import time
from urllib.parse import urlparse

import cv2
import numpy as np

import config

# Maximum target FPS for RPi WebRTC/RTSP stream to prevent decoding overload
TARGET_FPS = 6.0
FRAME_INTERVAL = 1.0 / TARGET_FPS  # ~0.166 seconds


class CameraStream:
    """Thread-safe video capture wrapper with frame-skipping, buffer-flushing,
    visual noise filtering, and thread-safe source switching."""

    _VARIANCE_FLOOR = 15.0  # Minimum frame variance to be considered valid
    _MAX_CORRUPT_RUN = 5    # Consecutive bad frames before forcing reconnect
    _RECONNECT_COOLDOWN = 3.0

    def __init__(self):
        self._lock = threading.Lock()
        self._frame: np.ndarray | None = None           # Current active frame
        self._last_good_frame: np.ndarray | None = None  # Clean fallback frame
        self._connected = False
        self._running = False
        self._cap: cv2.VideoCapture | None = None
        self._thread: threading.Thread | None = None
        self._fps = 0.0
        self._frame_count = 0
        self._fps_timer = time.time()
        self._source_info = ""

        # Thread-safe source switching flag
        self._pending_switch = False

        # Corruption & Reconnect tracking
        self._corrupt_run = 0
        self._total_corrupt = 0
        self._last_reconnect_time = 0.0

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
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=3)
        self._release()

    def get_frame(self) -> np.ndarray | None:
        """Return the most recent clean frame (BGR numpy array) or None."""
        with self._lock:
            return self._frame.copy() if self._frame is not None else None

    def switch_source(self, source_type: str, rtsp_url: str = None,
                      video_path: str = None, webcam_index: int = 0,
                      webrtc_url: str = None):
        """Switch the camera source at runtime safely via the capture thread."""
        with self._lock:
            config.SOURCE_TYPE = source_type
            if rtsp_url is not None:
                config.RTSP_URL = rtsp_url
            if webrtc_url is not None:
                config.WEBRTC_URL = webrtc_url
            if video_path is not None:
                config.VIDEO_PATH = video_path

            self._webcam_index = webcam_index
            self._corrupt_run = 0
            self._last_good_frame = None

            print(f"[CameraStream] Source switch requested → {source_type}")
            # Request capture loop to safely reopen source on its own thread
            self._pending_switch = True

        return {
            "source_type": source_type,
            "connected": self._connected,
            "source_info": f"Switching to {source_type}...",
        }

    def get_source_status(self) -> dict:
        """Return current source configuration and status."""
        return {
            "source_type": config.SOURCE_TYPE,
            "connected": self._connected,
            "fps": self.fps,
            "source_info": self._source_info,
            "rtsp_url": config.RTSP_URL if config.SOURCE_TYPE in ("rtsp", "ip_camera") else "",
            "webrtc_url": config.WEBRTC_URL if config.SOURCE_TYPE == "rpi_webrtc" else "",
            "video_path": config.VIDEO_PATH if config.SOURCE_TYPE == "video" else "",
        }

    # ── Corruption Detection ───────────────────────────

    @staticmethod
    def _is_frame_corrupt(frame: np.ndarray) -> bool:
        """Detect H264 macroblock artifacts and corruption in image space."""
        if frame is None or frame.size == 0:
            return True

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        var = gray.var()
        if var < CameraStream._VARIANCE_FLOOR:
            return True

        mean_bgr = frame.mean(axis=(0, 1))
        b, g, r = mean_bgr

        # FFmpeg default green macroblock artifact: High G, low B and R
        if g > 180 and b < 60 and r < 60:
            return True

        # FFmpeg gray macroblock artifact (128, 128, 128 neutral YUV)
        if 120 < g < 136 and 120 < b < 136 and 120 < r < 136 and var < 30:
            return True

        return False

    # ── Internals ──────────────────────────────────────

    @staticmethod
    def _webrtc_to_rtsp(webrtc_url: str) -> str:
        """Convert a MediaMTX WebRTC URL to its RTSP equivalent."""
        parsed = urlparse(webrtc_url)
        host = parsed.hostname or "localhost"
        path = parsed.path.rstrip("/") or "/cam"
        return f"rtsp://{host}:8554{path}"

    def _open_source(self):
        """Initialize cv2.VideoCapture (MUST be called on capture thread)."""
        self._release()

        source_type = config.SOURCE_TYPE
        webcam_index = getattr(self, "_webcam_index", 0)

        if source_type == "rtsp":
            self._cap = cv2.VideoCapture(config.RTSP_URL, cv2.CAP_FFMPEG)
            self._source_info = f"RTSP: {config.RTSP_URL}"
        elif source_type in ("rpi_webrtc", "webrtc"):
            rtsp_url = self._webrtc_to_rtsp(config.WEBRTC_URL)
            print(f"[CameraStream] RPi WebRTC → using RTSP: {rtsp_url}")
            self._cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
            if self._cap.isOpened():
                self._cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            self._source_info = f"RPi WebRTC: {config.WEBRTC_URL} (RTSP/TCP: {rtsp_url})"
        elif source_type == "ip_camera":
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
            try:
                self._cap.release()
            except Exception:
                pass
            self._cap = None
            self._connected = False

    def _capture_loop(self):
        """Single-threaded background capture loop. All VideoCapture operations
        (read, grab, release, open) occur on this thread to avoid FFmpeg crashes."""
        reconnect_wait = 5
        last_retrieve_time = 0.0

        while self._running:
            # Handle pending source switch request safely on capture thread
            if self._pending_switch:
                self._pending_switch = False
                print("[CameraStream] Executing pending source switch …")
                self._open_source()
                continue

            if self._cap is None or not self._cap.isOpened():
                self._connected = False
                print("[CameraStream] Source lost — attempting reconnect …")
                time.sleep(reconnect_wait)
                self._open_source()
                continue

            now = time.time()
            elapsed_since_retrieve = now - last_retrieve_time

            # Is it time to retrieve a frame (6 FPS target)?
            is_rtsp = config.SOURCE_TYPE in ("rpi_webrtc", "webrtc", "rtsp", "ip_camera")
            target_interval = FRAME_INTERVAL if is_rtsp else config.FRAME_READ_INTERVAL

            if elapsed_since_retrieve < target_interval:
                # Fast grab to flush RTSP internal buffer without full decoding
                if is_rtsp:
                    try:
                        self._cap.grab()
                    except Exception:
                        pass
                time.sleep(0.010)
                continue

            # Retrieve & decode frame
            try:
                ret, frame = self._cap.read()
            except Exception as e:
                print(f"[CameraStream] Error reading frame: {e}")
                ret = False

            last_retrieve_time = time.time()

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

            # Resize to configured dimensions
            frame = cv2.resize(frame, (config.FRAME_WIDTH, config.FRAME_HEIGHT))

            # Check for visual noise / corruption
            if self._is_frame_corrupt(frame):
                self._corrupt_run += 1
                self._total_corrupt += 1
                if self._corrupt_run == 1:
                    print(f"[CameraStream] Corrupt frame discarded (total: {self._total_corrupt})")

                if self._corrupt_run >= self._MAX_CORRUPT_RUN:
                    print(f"[CameraStream] Reconnecting — {self._corrupt_run} consecutive corrupt frames")
                    self._open_source()

                # Serve last good frame instead of noise
                with self._lock:
                    if self._last_good_frame is not None:
                        self._frame = self._last_good_frame.copy()
                    self._connected = True
                continue

            # Clean frame received
            if self._corrupt_run > 0:
                print(f"[CameraStream] Clean stream resumed after {self._corrupt_run} bad frames")
            self._corrupt_run = 0

            with self._lock:
                self._frame = frame
                self._last_good_frame = frame.copy()
                self._connected = True

            # FPS tracking
            self._frame_count += 1
            elapsed_fps = time.time() - self._fps_timer
            if elapsed_fps >= 1.0:
                self._fps = self._frame_count / elapsed_fps
                self._frame_count = 0
                self._fps_timer = time.time()
