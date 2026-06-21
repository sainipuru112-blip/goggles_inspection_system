import React from "react";
import { Card, CardContent, Box, Typography } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

export default function StatCard({ title, value, icon, color = "#1D4E9E", trend, trendLabel, delay = 0 }) {
  const isPositive = trend === undefined || trend >= 0;

  return (
    <Card
      sx={{
        position: "relative",
        overflow: "hidden",
        animation: `fadeInUp 0.5s ease ${delay}s both`,
        cursor: "default",
        "&:hover": {
          transform: "translateY(-4px)",
        },
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Top color accent */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
        }}
      />

      {/* Background decoration */}
      <Box
        sx={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: `${color}08`,
        }}
      />

      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="overline"
              sx={{
                color: "text.secondary",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                display: "block",
                mb: 0.8,
              }}
            >
              {title}
            </Typography>
            <Typography
              sx={{
                fontSize: "1.8rem",
                fontWeight: 800,
                color: color,
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              {value}
            </Typography>
            {trendLabel && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                {isPositive ? (
                  <TrendingUpIcon sx={{ fontSize: 14, color: "success.main" }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 14, color: "error.main" }} />
                )}
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: isPositive ? "success.main" : "error.main",
                  }}
                >
                  {trendLabel}
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "14px",
              background: `${color}10`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: color,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
