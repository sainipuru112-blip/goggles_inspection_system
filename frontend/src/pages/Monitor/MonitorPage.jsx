import React from "react";
import { Box } from "@mui/material";
import LiveFeed from "./LiveFeed";
import DetectionPanel from "./DetectionPanel";
import CameraSourcePicker from "./CameraSourcePicker";

export default function MonitorPage() {
  return (
    <Box
      sx={{
        height: "calc(100vh - 64px - 48px)",
        display: "flex",
        gap: 2,
      }}
    >
      {/* Left — Live Feed (80%) */}
      <Box sx={{ flex: "1 1 80%", minWidth: 0 }}>
        <LiveFeed />
      </Box>

      {/* Right — Detection Panel + Camera Picker */}
      <Box
        sx={{
          flex: "0 0 300px",
          minWidth: 280,
          maxWidth: 340,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          overflow: "auto",
        }}
      >
        {/* Camera Source Picker */}
        <CameraSourcePicker />

        {/* Detection Panel */}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <DetectionPanel />
        </Box>
      </Box>
    </Box>
  );
}
