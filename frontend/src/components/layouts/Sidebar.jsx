import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import MonitorRoundedIcon from "@mui/icons-material/MonitorRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";

const menuItems = [
  { label: "Dashboard", icon: <DashboardRoundedIcon />, path: "/" },
  { label: "Monitor", icon: <MonitorRoundedIcon />, path: "/monitor" },
  { label: "History", icon: <HistoryRoundedIcon />, path: "/history" },
  { label: "Model Configuration", icon: <TuneRoundedIcon />, path: "/model-config" },
  { label: "Settings", icon: <SettingsRoundedIcon />, path: "/settings" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box
      component="nav"
      sx={{
        width: 260,
        minWidth: 260,
        height: "100%",
        background: "#ffffff",
        borderRight: "1px solid rgba(29, 78, 158, 0.08)",
        display: "flex",
        flexDirection: "column",
        boxShadow: "2px 0 16px rgba(29, 78, 158, 0.04)",
        overflow: "hidden",
      }}
    >
      {/* Navigation Label */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
        <Typography
          variant="overline"
          sx={{ color: "text.secondary", fontSize: "0.65rem", letterSpacing: "0.15em" }}
        >
          Navigation
        </Typography>
      </Box>

      {/* Menu Items */}
      <List sx={{ px: 1.5, flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: "12px",
                  px: 2,
                  py: 1.3,
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative",
                  overflow: "hidden",
                  ...(isActive
                    ? {
                        background: "linear-gradient(135deg, rgba(29, 78, 158, 0.08) 0%, rgba(29, 78, 158, 0.04) 100%)",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          top: "20%",
                          bottom: "20%",
                          width: "3px",
                          borderRadius: "0 3px 3px 0",
                          background: "linear-gradient(180deg, #1D4E9E, #3A6FBF)",
                        },
                      }
                    : {
                        "&:hover": {
                          background: "rgba(29, 78, 158, 0.04)",
                          transform: "translateX(4px)",
                        },
                      }),
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? "primary.main" : "grey.500",
                    transition: "color 0.25s ease",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "primary.main" : "text.primary",
                    transition: "all 0.25s ease",
                  }}
                />
                {isActive && (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #1D4E9E, #3A6FBF)",
                      boxShadow: "0 0 8px rgba(29, 78, 158, 0.4)",
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Bottom Status */}
      <Box
        sx={{
          p: 2,
          mx: 1.5,
          mb: 1.5,
          borderRadius: "12px",
          background: "linear-gradient(135deg, rgba(29, 78, 158, 0.06) 0%, rgba(29, 78, 158, 0.02) 100%)",
          border: "1px solid rgba(29, 78, 158, 0.06)",
        }}
      >
        <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "text.secondary", letterSpacing: "0.05em" }}>
          System Status
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.8 }}>
          <Box className="status-dot connected" />
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 500, color: "success.main" }}>
            Operational
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
