import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Collapse,
  Chip,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import LinkedCameraRoundedIcon from "@mui/icons-material/LinkedCameraRounded";
import CameraOutdoorRoundedIcon from "@mui/icons-material/CameraOutdoorRounded";
import MovieRoundedIcon from "@mui/icons-material/MovieRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import { settingsApi } from "../../api/client";

const SOURCES = [
  { type: "webcam", label: "Webcam", icon: <VideocamRoundedIcon sx={{ fontSize: 18 }} /> },
  { type: "rtsp", label: "RTSP", icon: <LinkedCameraRoundedIcon sx={{ fontSize: 18 }} /> },
  { type: "ip_camera", label: "IP Cam", icon: <CameraOutdoorRoundedIcon sx={{ fontSize: 18 }} /> },
  { type: "video", label: "Video", icon: <MovieRoundedIcon sx={{ fontSize: 18 }} /> },
];

export default function CameraSourcePicker() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [selectedSource, setSelectedSource] = useState("webcam");
  const [fields, setFields] = useState({
    rtsp_url: "",
    video_path: "",
    webcam_index: 0,
  });

  const { data: camStatus } = useQuery({
    queryKey: ["camera-status-monitor"],
    queryFn: settingsApi.cameraStatus,
    refetchInterval: 3000,
  });

  // Sync selected source from current status
  useEffect(() => {
    if (camStatus?.source_type) {
      setSelectedSource(camStatus.source_type);
      setFields((prev) => ({
        ...prev,
        rtsp_url: camStatus.rtsp_url || prev.rtsp_url,
        video_path: camStatus.video_path || prev.video_path,
      }));
    }
  }, [camStatus?.source_type]);

  const switchMutation = useMutation({
    mutationFn: settingsApi.switchCamera,
    onSuccess: () => {
      queryClient.invalidateQueries(["camera-status-monitor"]);
    },
  });

  const handleSwitch = () => {
    const payload = {
      source_type: selectedSource,
      webcam_index: fields.webcam_index,
    };
    if (selectedSource === "rtsp" || selectedSource === "ip_camera") {
      payload.rtsp_url = fields.rtsp_url;
    }
    if (selectedSource === "video") {
      payload.video_path = fields.video_path;
    }
    switchMutation.mutate(payload);
  };

  const isConnected = camStatus?.connected;
  const activeType = camStatus?.source_type;

  return (
    <Box
      sx={{
        background: "#fff",
        borderRadius: "16px",
        border: "1px solid rgba(29,78,158,0.06)",
        overflow: "hidden",
      }}
    >
      {/* Compact Header — always visible */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          p: 1.5,
          px: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          background: "linear-gradient(135deg, rgba(29,78,158,0.04) 0%, rgba(29,78,158,0.02) 100%)",
          borderBottom: expanded ? "1px solid rgba(29,78,158,0.06)" : "none",
          transition: "all 0.2s ease",
          "&:hover": {
            background: "linear-gradient(135deg, rgba(29,78,158,0.06) 0%, rgba(29,78,158,0.03) 100%)",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <VideocamRoundedIcon sx={{ fontSize: 18, color: "#1D4E9E" }} />
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "text.secondary",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Camera Source
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Connection indicator */}
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: isConnected ? "#4CAF50" : "#E53935",
              boxShadow: isConnected
                ? "0 0 8px rgba(76,175,80,0.5)"
                : "0 0 8px rgba(229,57,53,0.5)",
              animation: isConnected ? "none" : "pulse 2s infinite",
              "@keyframes pulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.4 },
              },
            }}
          />
          <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "text.secondary" }}>
            {isConnected ? "Connected" : "Disconnected"}
          </Typography>
          {expanded ? (
            <ExpandLessRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          ) : (
            <ExpandMoreRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          )}
        </Box>
      </Box>

      {/* Expandable Content */}
      <Collapse in={expanded}>
        <Box sx={{ p: 2 }}>
          {/* Source Type Buttons */}
          <Box sx={{ display: "flex", gap: 0.8, mb: 2 }}>
            {SOURCES.map((src) => {
              const isSelected = selectedSource === src.type;
              const isActive = activeType === src.type && isConnected;
              return (
                <Tooltip key={src.type} title={src.label} arrow>
                  <Box
                    onClick={() => setSelectedSource(src.type)}
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 0.5,
                      py: 1,
                      px: 0.5,
                      borderRadius: "10px",
                      cursor: "pointer",
                      position: "relative",
                      border: isSelected
                        ? "2px solid #1D4E9E"
                        : "1px solid rgba(29,78,158,0.1)",
                      background: isSelected
                        ? "rgba(29,78,158,0.06)"
                        : "transparent",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#1D4E9E",
                        background: "rgba(29,78,158,0.04)",
                      },
                    }}
                  >
                    {/* Active dot */}
                    {isActive && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#4CAF50",
                          boxShadow: "0 0 6px rgba(76,175,80,0.5)",
                        }}
                      />
                    )}
                    <Box sx={{ color: isSelected ? "#1D4E9E" : "#6B7A90" }}>
                      {src.icon}
                    </Box>
                    <Typography
                      sx={{
                        fontSize: "0.6rem",
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? "#1D4E9E" : "#6B7A90",
                        textAlign: "center",
                        lineHeight: 1.2,
                      }}
                    >
                      {src.label}
                    </Typography>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>

          {/* Source-specific Fields */}
          <Box sx={{ mb: 2 }}>
            {selectedSource === "webcam" && (
              <TextField
                fullWidth
                size="small"
                label="Device Index"
                type="number"
                value={fields.webcam_index}
                onChange={(e) =>
                  setFields({ ...fields, webcam_index: parseInt(e.target.value) || 0 })
                }
                inputProps={{ min: 0, max: 10 }}
                helperText="0 = Default camera"
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "0.85rem" },
                  "& .MuiFormHelperText-root": { fontSize: "0.65rem" },
                }}
              />
            )}

            {(selectedSource === "rtsp" || selectedSource === "ip_camera") && (
              <TextField
                fullWidth
                size="small"
                label={selectedSource === "rtsp" ? "RTSP URL" : "Camera URL"}
                value={fields.rtsp_url}
                onChange={(e) => setFields({ ...fields, rtsp_url: e.target.value })}
                placeholder={
                  selectedSource === "rtsp"
                    ? "rtsp://user:pass@192.168.1.68:554/stream"
                    : "http://192.168.1.100:8080/video"
                }
                helperText={
                  selectedSource === "rtsp"
                    ? "rtsp://user:pass@ip:port/path"
                    : "HTTP, MJPEG, or RTSP URL"
                }
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "0.8rem" },
                  "& .MuiFormHelperText-root": { fontSize: "0.65rem" },
                }}
              />
            )}

            {selectedSource === "video" && (
              <TextField
                fullWidth
                size="small"
                label="Video File Path"
                value={fields.video_path}
                onChange={(e) => setFields({ ...fields, video_path: e.target.value })}
                placeholder="C:\path\to\video.mp4"
                helperText="Absolute path to .mp4, .avi, .mov file"
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "0.8rem" },
                  "& .MuiFormHelperText-root": { fontSize: "0.65rem" },
                }}
              />
            )}


          </Box>

          {/* Connect Button */}
          <Button
            fullWidth
            variant="contained"
            size="small"
            startIcon={
              switchMutation.isLoading ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <SwapHorizRoundedIcon sx={{ fontSize: 18 }} />
              )
            }
            onClick={handleSwitch}
            disabled={switchMutation.isLoading}
            sx={{
              borderRadius: "10px",
              height: 36,
              fontSize: "0.8rem",
              fontWeight: 700,
              textTransform: "none",
              background: "linear-gradient(135deg, #1D4E9E 0%, #2563EB 100%)",
              boxShadow: "0 2px 8px rgba(29,78,158,0.25)",
              "&:hover": {
                background: "linear-gradient(135deg, #163D7A 0%, #1D4E9E 100%)",
                boxShadow: "0 4px 16px rgba(29,78,158,0.35)",
              },
            }}
          >
            {switchMutation.isLoading
              ? "Connecting..."
              : `Connect ${SOURCES.find((s) => s.type === selectedSource)?.label}`}
          </Button>

          {/* Status feedback */}
          {switchMutation.isSuccess && (
            <Box
              sx={{
                mt: 1.5,
                p: 1,
                borderRadius: "8px",
                background: isConnected
                  ? "rgba(46,125,50,0.08)"
                  : "rgba(255,152,0,0.08)",
                display: "flex",
                alignItems: "center",
                gap: 0.8,
              }}
            >
              {isConnected ? (
                <CheckCircleRoundedIcon sx={{ fontSize: 14, color: "#2E7D32" }} />
              ) : (
                <ErrorRoundedIcon sx={{ fontSize: 14, color: "#F57C00" }} />
              )}
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: isConnected ? "#2E7D32" : "#F57C00",
                }}
              >
                {isConnected
                  ? `Connected to ${camStatus?.source_info || selectedSource}`
                  : "Trying to connect..."}
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
