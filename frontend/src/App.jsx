import React from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import theme from "./theme/theme";
import { queryClient } from "./api/client";
import MainLayout from "./components/layouts/MainLayout";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import MonitorPage from "./pages/Monitor/MonitorPage";
import HistoryPage from "./pages/History/HistoryPage";
import ModelConfigPage from "./pages/ModelConfiguration/ModelConfigPage";
import SettingsPage from "./pages/Settings/SettingsPage";
import useWebSocket from "./hooks/useWebSocket";

function AppShell({ children }) {
  useWebSocket();
  return children;
}

function LayoutWithWS() {
  return (
    <AppShell>
      <MainLayout />
    </AppShell>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <LayoutWithWS />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "monitor", element: <MonitorPage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "model-config", element: <ModelConfigPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
