import React, { useState } from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import PartTab from "./PartTab";
import ModelTab from "./ModelTab";

export default function ModelConfigPage() {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" sx={{ fontWeight: 800 }}>
          Model Configuration
        </Typography>
        <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
          Manage detection models and their component parts
        </Typography>
      </Box>

      <Box
        sx={{
          borderBottom: "1px solid rgba(29,78,158,0.08)",
          mb: 3,
        }}
      >
        <Tabs
          value={tabIndex}
          onChange={(_, v) => setTabIndex(v)}
          sx={{
            "& .MuiTab-root": {
              minWidth: 160,
            },
          }}
        >
          <Tab label="Part Configuration" />
          <Tab label="Model Configuration" />
        </Tabs>
      </Box>

      {tabIndex === 0 && <PartTab />}
      {tabIndex === 1 && <ModelTab />}
    </Box>
  );
}
