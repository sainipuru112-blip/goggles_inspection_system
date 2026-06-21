import React from "react";
import { Box, Typography } from "@mui/material";
import FactoryIcon from "@mui/icons-material/Factory";
import VisibilityIcon from "@mui/icons-material/Visibility";

export default function Header() {
  return (
    <Box
      component="header"
      sx={{
        height: 64,
        minHeight: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 3,
        background: "linear-gradient(135deg, #1D4E9E 0%, #143A75 50%, #0D2B54 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        zIndex: 1200,
        position: "relative",
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
        },
      }}
    >
      {/* Left — MSIL Logo */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: "0 0 200px" }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "10px",
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <FactoryIcon sx={{ color: "#fff", fontSize: 22 }} />
        </Box>
        <Box>
          <Typography
            sx={{
              color: "#fff",
              fontSize: "0.85rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              lineHeight: 1.1,
            }}
          >
            MSIL
          </Typography>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.6rem",
              fontWeight: 500,
              letterSpacing: "0.08em",
            }}
          >
            MARUTI SUZUKI
          </Typography>
        </Box>
      </Box>

      {/* Center — Title */}
      <Box sx={{ textAlign: "center", flex: 1 }}>
        <Typography
          sx={{
            color: "#fff",
            fontSize: "1.15rem",
            fontWeight: 800,
            letterSpacing: "0.02em",
            lineHeight: 1.2,
            textShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          Hypervise AI Vision Platform
        </Typography>
        <Typography
          sx={{
            color: "rgba(255,255,255,0.7)",
            fontSize: "0.7rem",
            fontWeight: 500,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            mt: 0.2,
          }}
        >
          WSMB Roof Body POC
        </Typography>
      </Box>

      {/* Right — Hypervise Logo */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: "0 0 200px", justifyContent: "flex-end" }}>
        <Box>
          <Typography
            sx={{
              color: "#fff",
              fontSize: "0.85rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              lineHeight: 1.1,
              textAlign: "right",
            }}
          >
            HYPERVISE
          </Typography>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.6rem",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textAlign: "right",
            }}
          >
            AI SOLUTIONS
          </Typography>
        </Box>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "10px",
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <VisibilityIcon sx={{ color: "#fff", fontSize: 22 }} />
        </Box>
      </Box>
    </Box>
  );
}
