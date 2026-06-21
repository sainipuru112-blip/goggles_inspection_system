import React from "react";
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../components/layouts/MainLayout";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import MonitorPage from "../pages/Monitor/MonitorPage";
import HistoryPage from "../pages/History/HistoryPage";
import ModelConfigPage from "../pages/ModelConfiguration/ModelConfigPage";
import SettingsPage from "../pages/Settings/SettingsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "monitor", element: <MonitorPage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "model-config", element: <ModelConfigPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);

export default router;
