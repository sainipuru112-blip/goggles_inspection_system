import React from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function MainLayout() {
  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header />
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: "auto",
            p: 3,
            background: "#F4F6FA",
            minWidth: 0,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
