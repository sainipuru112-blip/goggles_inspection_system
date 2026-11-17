import React, { useRef, useEffect, useState, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import useAppStore from "../../store/useAppStore";
import { settingsApi } from "../../api/client";

const FRAME_URL = "http://localhost:8000/api/detection/frame";

export default function LiveFeed() {
  const imgRef = useRef(null);
  const blobUrlRef = useRef(null);
  const mountedRef = useRef(true);
  const detectionResult = useAppStore((s) => s.detectionResult);
  const cameraConnected = useAppStore((s) => s.cameraConnected);

  const { data: camStatus } = useQuery({
    queryKey: ["camera-status-monitor"],
    queryFn: settingsApi.cameraStatus,
    refetchInterval: 5000,
  });

  const sourceLabel = {
    webcam: "Webcam",
    rtsp: "RTSP",
    ip_camera: "IP Cam",
    video: "Video",
  }[camStatus?.source_type] || "Unknown";

  const overall = detectionResult?.overall_result || "WAITING";
  const confidence = detectionResult?.confidence || 0;
  const fps = detectionResult?.fps || 0;
  const cycleTime = detectionResult?.cycle_time || 0;

  // Sequential frame fetcher — loads next frame only after current one is done
  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    let timeoutId = null;

    const fetchFrame = async () => {
      if (cancelled) return;

      try {
        const response = await fetch(`${FRAME_URL}?t=${Date.now()}`, {
          cache: "no-store",
        });

        if (!response.ok || cancelled) return;

        const blob = await response.blob();
        if (cancelled) return;

        // Revoke previous blob URL to prevent memory leak
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }

        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;

        if (imgRef.current && !cancelled) {
          imgRef.current.src = url;
          imgRef.current.style.display = "block";
        }
      } catch (err) {
        // Silently ignore — will retry on next tick
      }

        // Schedule next frame (~6 FPS target to prevent network congestion)
        if (!cancelled) {
          timeoutId = setTimeout(fetchFrame, 160);
        }
    };

    fetchFrame();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  // Resume fetching when tab becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && imgRef.current) {
        // Force a fresh frame load on tab return
        fetch(`${FRAME_URL}?t=${Date.now()}`, { cache: "no-store" })
          .then((r) => r.blob())
          .then((blob) => {
            if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
            const url = URL.createObjectURL(blob);
            blobUrlRef.current = url;
            if (imgRef.current) {
              imgRef.current.src = url;
              imgRef.current.style.display = "block";
            }
          })
          .catch(() => { });
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const bannerClass =
    overall === "OK" ? "ok" : overall === "NG" ? "ng" : "waiting";
  const bannerText =
    overall === "OK"
      ? "✓ PASS — ALL PARTS DETECTED"
      : overall === "NG"
        ? "✗ FAIL — MISSING PARTS"
        : "⏳ WAITING FOR DETECTION";

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: "16px",
        overflow: "hidden",
        background: "#0a0a0a",
        position: "relative",
      }}
    >
      {/* Detection Result Banner */}
      <Box className={`result-banner ${bannerClass}`}>{bannerText}</Box>

      {/* Video Feed */}
      <Box
        sx={{
          flex: 1,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <img
          ref={imgRef}
          alt="Live Feed"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />

        {/* No Camera Overlay */}
        {!cameraConnected && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(8px)",
            }}
          >
            <VideocamRoundedIcon sx={{ fontSize: 64, color: "rgba(255,255,255,0.3)", mb: 2 }} />
            <Typography sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "1.1rem" }}>
              Camera Feed Unavailable
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", mt: 0.5 }}>
              Waiting for connection...
            </Typography>
          </Box>
        )}

        {/* Overlays */}
        <Box
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            display: "flex",
            gap: 1,
          }}
        >
          {/* Camera Status */}
          <Box
            sx={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              borderRadius: "8px",
              px: 1.5,
              py: 0.5,
              display: "flex",
              alignItems: "center",
              gap: 0.8,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: cameraConnected ? "#4CAF50" : "#E53935",
                boxShadow: cameraConnected
                  ? "0 0 8px rgba(76,175,80,0.6)"
                  : "0 0 8px rgba(229,57,53,0.6)",
              }}
            />
            <Typography sx={{ color: "#fff", fontSize: "0.7rem", fontWeight: 600 }}>
              {cameraConnected ? "LIVE" : "OFFLINE"}
            </Typography>
          </Box>

          {/* FPS */}
          <Box
            sx={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              borderRadius: "8px",
              px: 1.5,
              py: 0.5,
            }}
          >
            <Typography sx={{ color: "#4FC3F7", fontSize: "0.7rem", fontWeight: 700 }}>
              {fps.toFixed(1)} FPS
            </Typography>
          </Box>
        </Box>

        {/* Top-right — Source type badge */}
        <Box
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
          }}
        >
          <Box
            sx={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              borderRadius: "8px",
              px: 1.5,
              py: 0.5,
              display: "flex",
              alignItems: "center",
              gap: 0.6,
            }}
          >
            <VideocamRoundedIcon sx={{ fontSize: 14, color: "#B39DDB" }} />
            <Typography sx={{ color: "#B39DDB", fontSize: "0.7rem", fontWeight: 700 }}>
              {sourceLabel}
            </Typography>
          </Box>
        </Box>

        {/* Bottom-right overlays */}
        <Box
          sx={{
            position: "absolute",
            bottom: 12,
            right: 12,
            display: "flex",
            gap: 1,
          }}
        >
          {/* Cycle Time */}
          <Box
            sx={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              borderRadius: "8px",
              px: 1.5,
              py: 0.5,
            }}
          >
            <Typography sx={{ color: "#FFB74D", fontSize: "0.7rem", fontWeight: 600 }}>
              Cycle: {cycleTime.toFixed(1)}s
            </Typography>
          </Box>

          {/* Confidence */}
          <Box
            sx={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              borderRadius: "8px",
              px: 1.5,
              py: 0.5,
            }}
          >
            <Typography sx={{ color: "#81C784", fontSize: "0.7rem", fontWeight: 700 }}>
              Conf: {(confidence * 100).toFixed(1)}%
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
