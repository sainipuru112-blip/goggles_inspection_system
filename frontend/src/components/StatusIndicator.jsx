import React from "react";
import { Box, Typography } from "@mui/material";

export default function StatusIndicator({ connected, label }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box
        className={`status-dot ${connected ? "connected" : "disconnected"}`}
      />
      <Typography
        sx={{
          fontSize: "0.75rem",
          fontWeight: 600,
          color: connected ? "success.main" : "error.main",
        }}
      >
        {label || (connected ? "Connected" : "Disconnected")}
      </Typography>
    </Box>
  );
}
