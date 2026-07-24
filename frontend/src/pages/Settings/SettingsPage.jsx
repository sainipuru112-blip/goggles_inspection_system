import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, Slider,
  FormControl, InputLabel, Select, MenuItem, Divider, Alert, Snackbar,
  Chip, RadioGroup, Radio, FormControlLabel, CircularProgress,
} from "@mui/material";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import LinkedCameraRoundedIcon from "@mui/icons-material/LinkedCameraRounded";
import CameraOutdoorRoundedIcon from "@mui/icons-material/CameraOutdoorRounded";
import MovieRoundedIcon from "@mui/icons-material/MovieRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import DeveloperBoardRoundedIcon from "@mui/icons-material/DeveloperBoardRounded";
import { settingsApi } from "../../api/client";

const SOURCE_ICONS = {
  webcam: <VideocamRoundedIcon />,
  rpi_webrtc: <DeveloperBoardRoundedIcon />,
  rtsp: <LinkedCameraRoundedIcon />,
  ip_camera: <CameraOutdoorRoundedIcon />,
  video: <MovieRoundedIcon />,
};

const SOURCE_LABELS = {
  webcam: "Webcam",
  rpi_webrtc: "RPi WebRTC",
  rtsp: "RTSP Camera",
  ip_camera: "IP Camera",
  video: "Video File",
};

const SOURCE_DESCRIPTIONS = {
  webcam: "Local USB or built-in webcam",
  rpi_webrtc: "Raspberry Pi WebRTC low-latency stream",
  rtsp: "Network camera via RTSP protocol",
  ip_camera: "Network camera via HTTP/MJPEG stream",
  video: "Playback from a recorded video file",
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState("success");

  // Camera switch state
  const [selectedSource, setSelectedSource] = useState("webcam");
  const [cameraFields, setCameraFields] = useState({
    rtsp_url: "",
    webrtc_url: "http://sainipuru.local:8889/cam/",
    video_path: "",
    webcam_index: 0,
  });

  const { isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.get,
    onSuccess: (data) => {
      setSettings(data);
      setSelectedSource(data.source_type || "webcam");
      setCameraFields({
        rtsp_url: data.rtsp_url || "",
        webrtc_url: data.webrtc_url || "http://sainipuru.local:8889/cam/",
        video_path: data.video_path || "",
        webcam_index: 0,
      });
    },
  });

  const { data: cameraStatus } = useQuery({
    queryKey: ["camera-status"],
    queryFn: settingsApi.cameraStatus,
    refetchInterval: 5000,
  });

  const switchMutation = useMutation({
    mutationFn: settingsApi.switchCamera,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["camera-status"]);
      setSnackMsg(`Camera switched to ${SOURCE_LABELS[selectedSource]}${data.connected ? " — Connected ✓" : " — Connecting..."}`);
      setSnackSeverity(data.connected ? "success" : "warning");
      setSaved(true);
    },
    onError: (err) => {
      setSnackMsg("Failed to switch camera: " + (err.response?.data?.detail || err.message));
      setSnackSeverity("error");
      setSaved(true);
    },
  });

  const saveMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      setSnackMsg("Settings saved successfully");
      setSnackSeverity("success");
      setSaved(true);
    },
  });

  const handleSwitchCamera = () => {
    const payload = {
      source_type: selectedSource,
      webcam_index: cameraFields.webcam_index,
    };
    if (selectedSource === "rpi_webrtc") {
      payload.webrtc_url = cameraFields.webrtc_url;
    }
    if (selectedSource === "rtsp" || selectedSource === "ip_camera") {
      payload.rtsp_url = cameraFields.rtsp_url;
    }
    if (selectedSource === "video") {
      payload.video_path = cameraFields.video_path;
    }
    switchMutation.mutate(payload);
  };

  const handleSaveSettings = () => {
    if (settings) {
      saveMutation.mutate({
        confidence_threshold: settings.confidence_threshold,
        frame_width: settings.frame_width,
        frame_height: settings.frame_height,
        snapshot_interval: settings.snapshot_interval,
      });
    }
  };

  if (isLoading || !settings) {
    return (
      <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
        Loading settings...
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>Settings</Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
            Configure camera sources, detection parameters, and system preferences
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveRoundedIcon />}
          onClick={handleSaveSettings}
          disabled={saveMutation.isLoading}
          sx={{ height: 42 }}
        >
          Save Settings
        </Button>
      </Box>

      <Grid container spacing={2.5}>
        {/* ── Camera Source Selector ── */}
        <Grid size={{ xs: 12 }}>
          <Card
            sx={{
              border: "1px solid rgba(29,78,158,0.12)",
              position: "relative",
              overflow: "visible",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #1D4E9E, #3A6FBF)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <VideocamRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Camera Source
                  </Typography>
                  <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                    Select and configure your video input source
                  </Typography>
                </Box>

                {/* Current status badge */}
                {cameraStatus && (
                  <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
                    {cameraStatus.connected ? (
                      <Chip
                        icon={<CheckCircleRoundedIcon sx={{ fontSize: 16 }} />}
                        label={`Connected — ${cameraStatus.source_info || cameraStatus.source_type}`}
                        size="small"
                        sx={{
                          background: "rgba(46,125,50,0.1)",
                          color: "#2E7D32",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          "& .MuiChip-icon": { color: "#2E7D32" },
                        }}
                      />
                    ) : (
                      <Chip
                        icon={<ErrorRoundedIcon sx={{ fontSize: 16 }} />}
                        label="Disconnected"
                        size="small"
                        sx={{
                          background: "rgba(229,57,53,0.1)",
                          color: "#E53935",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          "& .MuiChip-icon": { color: "#E53935" },
                        }}
                      />
                    )}
                    {cameraStatus.fps > 0 && (
                      <Chip
                        label={`${cameraStatus.fps} FPS`}
                        size="small"
                        sx={{
                          background: "rgba(29,78,158,0.08)",
                          color: "#1D4E9E",
                          fontWeight: 700,
                          fontSize: "0.7rem",
                        }}
                      />
                    )}
                  </Box>
                )}
              </Box>

              {/* Source Type Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {["webcam", "rpi_webrtc", "rtsp", "ip_camera", "video"].map((type) => {
                  const isSelected = selectedSource === type;
                  const isActive = cameraStatus?.source_type === type && cameraStatus?.connected;
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={type}>
                      <Box
                        onClick={() => setSelectedSource(type)}
                        sx={{
                          p: 2.5,
                          borderRadius: "14px",
                          border: isSelected
                            ? "2px solid #1D4E9E"
                            : "1px solid rgba(29,78,158,0.1)",
                          background: isSelected
                            ? "linear-gradient(135deg, rgba(29,78,158,0.06) 0%, rgba(29,78,158,0.02) 100%)"
                            : "#fff",
                          cursor: "pointer",
                          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                          position: "relative",
                          "&:hover": {
                            borderColor: "#1D4E9E",
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 16px rgba(29,78,158,0.1)",
                          },
                        }}
                      >
                        {isActive && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: "#4CAF50",
                              boxShadow: "0 0 8px rgba(76,175,80,0.5)",
                            }}
                          />
                        )}
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: "12px",
                            background: isSelected
                              ? "linear-gradient(135deg, #1D4E9E, #3A6FBF)"
                              : "rgba(29,78,158,0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mb: 1.5,
                            color: isSelected ? "#fff" : "#1D4E9E",
                            transition: "all 0.25s ease",
                          }}
                        >
                          {SOURCE_ICONS[type]}
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 0.3 }}>
                          {SOURCE_LABELS[type]}
                        </Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", lineHeight: 1.4 }}>
                          {SOURCE_DESCRIPTIONS[type]}
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Source-specific fields */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: "14px",
                  background: "rgba(29,78,158,0.03)",
                  border: "1px solid rgba(29,78,158,0.06)",
                  mb: 2.5,
                }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: "text.secondary", mb: 2, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  {SOURCE_LABELS[selectedSource]} Configuration
                </Typography>

                {selectedSource === "webcam" && (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <TextField
                        fullWidth
                        label="Device Index"
                        type="number"
                        value={cameraFields.webcam_index}
                        onChange={(e) => setCameraFields({ ...cameraFields, webcam_index: parseInt(e.target.value) || 0 })}
                        helperText="0 = Default camera, 1 = Second camera, etc."
                        inputProps={{ min: 0, max: 10 }}
                      />
                    </Grid>
                  </Grid>
                )}

                {selectedSource === "rpi_webrtc" && (
                  <TextField
                    fullWidth
                    label="WebRTC Stream URL"
                    value={cameraFields.webrtc_url}
                    onChange={(e) => setCameraFields({ ...cameraFields, webrtc_url: e.target.value })}
                    placeholder="http://sainipuru.local:8889/cam/"
                    helperText="URL of the Raspberry Pi WebRTC / HTTP video stream"
                  />
                )}

                {(selectedSource === "rtsp" || selectedSource === "ip_camera") && (
                  <TextField
                    fullWidth
                    label={selectedSource === "rtsp" ? "RTSP URL" : "Camera URL"}
                    value={cameraFields.rtsp_url}
                    onChange={(e) => setCameraFields({ ...cameraFields, rtsp_url: e.target.value })}
                    placeholder={
                      selectedSource === "rtsp"
                        ? "rtsp://username:password@192.168.1.68:554/Streaming/Channels/101"
                        : "http://192.168.1.100:8080/video"
                    }
                    helperText={
                      selectedSource === "rtsp"
                        ? "Format: rtsp://user:pass@ip:port/path"
                        : "HTTP, MJPEG, or RTSP URL of the IP camera"
                    }
                  />
                )}

                {selectedSource === "video" && (
                  <TextField
                    fullWidth
                    label="Video File Path"
                    value={cameraFields.video_path}
                    onChange={(e) => setCameraFields({ ...cameraFields, video_path: e.target.value })}
                    placeholder="C:\path\to\video.mp4"
                    helperText="Absolute path to a video file (.mp4, .avi, .mov)"
                  />
                )}


              </Box>

              {/* Switch Button */}
              <Button
                variant="contained"
                size="large"
                startIcon={switchMutation.isLoading ? <CircularProgress size={18} color="inherit" /> : <SwapHorizRoundedIcon />}
                onClick={handleSwitchCamera}
                disabled={switchMutation.isLoading}
                sx={{
                  height: 48,
                  px: 4,
                  fontSize: "0.95rem",
                  background: "linear-gradient(135deg, #1D4E9E 0%, #2563EB 100%)",
                }}
              >
                {switchMutation.isLoading ? "Switching..." : `Switch to ${SOURCE_LABELS[selectedSource]}`}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Detection Settings ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
                <TuneRoundedIcon sx={{ color: "primary.main" }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Detection Settings
                </Typography>
              </Box>

              <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, mb: 1 }}>
                Confidence Threshold: {(settings.confidence_threshold * 100).toFixed(0)}%
              </Typography>
              <Slider
                value={settings.confidence_threshold}
                onChange={(_, v) => setSettings({ ...settings, confidence_threshold: v })}
                min={0.1}
                max={1.0}
                step={0.05}
                sx={{ mb: 3 }}
                marks={[
                  { value: 0.5, label: "50%" },
                  { value: 0.8, label: "80%" },
                  { value: 1.0, label: "100%" },
                ]}
              />

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    label="Frame Width"
                    type="number"
                    value={settings.frame_width}
                    onChange={(e) => setSettings({ ...settings, frame_width: parseInt(e.target.value) })}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    label="Frame Height"
                    type="number"
                    value={settings.frame_height}
                    onChange={(e) => setSettings({ ...settings, frame_height: parseInt(e.target.value) })}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Snapshot & System ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ mb: 2.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Snapshot Settings
              </Typography>
              <TextField
                fullWidth
                label="Snapshot Interval (seconds)"
                type="number"
                value={settings.snapshot_interval}
                onChange={(e) => setSettings({ ...settings, snapshot_interval: parseFloat(e.target.value) })}
                inputProps={{ min: 0.5, max: 10, step: 0.5 }}
                helperText="Capture one frame every N seconds during inspection"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <InfoRoundedIcon sx={{ color: "primary.main" }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  System Information
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="overline" sx={{ color: "text.secondary" }}>
                    Application
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: "0.85rem" }}>{settings.app_title}</Typography>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Typography variant="overline" sx={{ color: "text.secondary" }}>
                    Version
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: "0.85rem" }}>{settings.app_version}</Typography>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Typography variant="overline" sx={{ color: "text.secondary" }}>
                    Module
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: "0.85rem" }}>{settings.app_subtitle}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={saved}
        autoHideDuration={4000}
        onClose={() => setSaved(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackSeverity} variant="filled" onClose={() => setSaved(false)}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
