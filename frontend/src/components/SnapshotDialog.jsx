import React, { useState } from "react";
import { Dialog, DialogContent, IconButton, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";

export default function SnapshotDialog({ open, onClose, imageUrl, title }) {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 4));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));

  const handleClose = () => {
    setZoom(1);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
          borderBottom: "1px solid rgba(29, 78, 158, 0.08)",
        }}
      >
        <Box sx={{ fontWeight: 700, fontSize: "0.95rem" }}>{title || "Snapshot Preview"}</Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <IconButton size="small" onClick={handleZoomOut}>
            <ZoomOutIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleZoomIn}>
            <ZoomInIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <DialogContent
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "auto",
          p: 3,
          minHeight: 400,
          backgroundColor: "#111",
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Snapshot"
            style={{
              transform: `scale(${zoom})`,
              transition: "transform 0.3s ease",
              maxWidth: "100%",
              transformOrigin: "center center",
              borderRadius: 8,
            }}
          />
        ) : (
          <Box sx={{ color: "#888", fontSize: "0.9rem" }}>No image available</Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
