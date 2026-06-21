import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Button,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import useAppStore from "../../store/useAppStore";
import { modelsApi, detectionApi } from "../../api/client";

export default function DetectionPanel() {
  const detectionResult = useAppStore((s) => s.detectionResult);
  const activeModelId = useAppStore((s) => s.activeModelId);
  const activeModelName = useAppStore((s) => s.activeModelName);
  const setActiveModel = useAppStore((s) => s.setActiveModel);
  const [detectionActive, setDetectionActive] = useState(true);
  const [toggling, setToggling] = useState(false);

  const { data: modelsList } = useQuery({
    queryKey: ["model-names"],
    queryFn: modelsApi.getNames,
  });

  // Poll detection status so button auto-updates when detection auto-stops
  useEffect(() => {
    const poll = setInterval(() => {
      detectionApi.getStatus().then((status) => {
        if (status.detection_active !== undefined) {
          setDetectionActive(status.detection_active);
        }
      }).catch(() => {});
    }, 2000);
    // Initial fetch
    detectionApi.getStatus().then((status) => {
      if (status.detection_active !== undefined) {
        setDetectionActive(status.detection_active);
      }
    }).catch(() => {});
    return () => clearInterval(poll);
  }, []);

  // Set default model on first load and notify backend
  useEffect(() => {
    if (!activeModelId && modelsList?.length > 0) {
      const def = modelsList[0];
      setActiveModel(def.id, def.model_name);
      detectionApi.selectModel(def.id).catch((err) => {
        console.error("Failed to select default model:", err);
      });
    }
  }, [modelsList, activeModelId, setActiveModel]);

  const handleModelChange = async (e) => {
    const id = e.target.value;
    const model = modelsList?.find((m) => m.id === id);
    if (model) {
      setActiveModel(model.id, model.model_name);
      try {
        await detectionApi.selectModel(id);
      } catch (err) {
        console.error("Failed to switch model:", err);
      }
    }
  };

  const handleToggleDetection = async () => {
    setToggling(true);
    try {
      const result = await detectionApi.toggleDetection();
      setDetectionActive(result.detection_active);
    } catch (err) {
      console.error("Failed to toggle detection:", err);
    }
    setToggling(false);
  };

  const partStatuses = detectionResult?.part_statuses || {};
  const configuredParts = detectionResult?.configured_parts || [];
  const overall = detectionResult?.overall_result || "WAITING";

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        borderRadius: "16px",
        border: "1px solid rgba(29,78,158,0.06)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          background: "linear-gradient(135deg, rgba(29,78,158,0.04) 0%, rgba(29,78,158,0.02) 100%)",
          borderBottom: "1px solid rgba(29,78,158,0.06)",
        }}
      >
        <Typography
          sx={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "text.secondary",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            mb: 1.5,
          }}
        >
          Model Selection
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={activeModelId || ""}
            onChange={handleModelChange}
            sx={{
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "0.85rem",
              background: "#fff",
            }}
          >
            {(modelsList || []).map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.model_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Start/Stop Detection Button */}
        <Button
          fullWidth
          variant="contained"
          size="small"
          startIcon={
            detectionActive ? (
              <StopRoundedIcon sx={{ fontSize: 18 }} />
            ) : (
              <PlayArrowRoundedIcon sx={{ fontSize: 18 }} />
            )
          }
          onClick={handleToggleDetection}
          disabled={toggling}
          sx={{
            mt: 1.5,
            borderRadius: "10px",
            height: 36,
            fontSize: "0.8rem",
            fontWeight: 700,
            textTransform: "none",
            background: detectionActive
              ? "linear-gradient(135deg, #C62828 0%, #E53935 100%)"
              : "linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)",
            boxShadow: detectionActive
              ? "0 2px 8px rgba(198,40,40,0.25)"
              : "0 2px 8px rgba(46,125,50,0.25)",
            "&:hover": {
              background: detectionActive
                ? "linear-gradient(135deg, #B71C1C 0%, #C62828 100%)"
                : "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)",
            },
          }}
        >
          {toggling
            ? "..."
            : detectionActive
            ? "Stop Detection"
            : "Start Detection"}
        </Button>
      </Box>

      {/* Part Status List */}
      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
        <Typography
          sx={{
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "text.secondary",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            mb: 1.5,
          }}
        >
          Part Detection Status
        </Typography>

        {configuredParts.length === 0 ? (
          <Box
            sx={{
              py: 4,
              textAlign: "center",
              color: "text.secondary",
              fontSize: "0.8rem",
            }}
          >
            No parts configured for this model
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {configuredParts.map((part) => {
              const detected = partStatuses[part] === true;
              return (
                <Box
                  key={part}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1.5,
                    borderRadius: "10px",
                    background: detected
                      ? "rgba(46,125,50,0.06)"
                      : "rgba(229,57,53,0.06)",
                    border: `1px solid ${
                      detected
                        ? "rgba(46,125,50,0.15)"
                        : "rgba(229,57,53,0.15)"
                    }`,
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {detected ? (
                      <CheckCircleRoundedIcon
                        sx={{ fontSize: 18, color: "success.main" }}
                      />
                    ) : (
                      <CancelRoundedIcon
                        sx={{ fontSize: 18, color: "error.main" }}
                      />
                    )}
                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: detected ? "success.dark" : "error.dark",
                      }}
                    >
                      {part}
                    </Typography>
                  </Box>
                  <Chip
                    label={detected ? "✓ Detected" : "✗ Missing"}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.65rem",
                      height: 24,
                      ...(detected
                        ? {
                            background: "rgba(46,125,50,0.12)",
                            color: "#2E7D32",
                          }
                        : {
                            background: "rgba(229,57,53,0.12)",
                            color: "#E53935",
                          }),
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Overall Result */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid rgba(29,78,158,0.06)",
        }}
      >
        <Typography
          sx={{
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "text.secondary",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            mb: 1,
          }}
        >
          Overall Result
        </Typography>
        <Box
          sx={{
            p: 2,
            borderRadius: "12px",
            textAlign: "center",
            fontWeight: 800,
            fontSize: "1.2rem",
            letterSpacing: "0.1em",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            ...(!detectionActive
              ? {
                  background: "linear-gradient(135deg, #757575, #9E9E9E)",
                  color: "#fff",
                }
              : overall === "OK"
              ? {
                  background: "linear-gradient(135deg, #2E7D32, #4CAF50)",
                  color: "#fff",
                  boxShadow: "0 4px 16px rgba(46,125,50,0.3)",
                }
              : overall === "NG"
              ? {
                  background: "linear-gradient(135deg, #C62828, #E53935)",
                  color: "#fff",
                  boxShadow: "0 4px 16px rgba(229,57,53,0.3)",
                }
              : {
                  background: "linear-gradient(135deg, #4A5568, #6B7A90)",
                  color: "#fff",
                }),
          }}
        >
          {!detectionActive
            ? "⏸ PAUSED"
            : overall === "OK"
            ? "✓ OK"
            : overall === "NG"
            ? "✗ NG"
            : "⏳ WAITING"}
        </Box>
      </Box>
    </Box>
  );
}
