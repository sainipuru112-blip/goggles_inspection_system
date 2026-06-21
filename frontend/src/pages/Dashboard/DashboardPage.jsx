import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Grid, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Skeleton, TextField, IconButton, Tooltip } from "@mui/material";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend } from "recharts";
import ModelTrainingRoundedIcon from "@mui/icons-material/ModelTrainingRounded";
import LoopRoundedIcon from "@mui/icons-material/LoopRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import PercentRoundedIcon from "@mui/icons-material/PercentRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import PowerRoundedIcon from "@mui/icons-material/PowerRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import StatCard from "../../components/StatCard";
import { historyApi, modelsApi } from "../../api/client";
import useAppStore from "../../store/useAppStore";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(29,78,158,0.1)",
        borderRadius: "12px",
        p: 1.5,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      }}
    >
      <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", mb: 0.5 }}>{label}</Typography>
      {payload.map((entry, i) => (
        <Typography key={i} sx={{ fontSize: "0.75rem", color: entry.color, fontWeight: 600 }}>
          {entry.name}: {entry.value}
        </Typography>
      ))}
    </Box>
  );
};

// Get today's date range as YYYY-MM-DDT00:00 and YYYY-MM-DDT23:59
const getTodayRange = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return {
    start: `${yyyy}-${mm}-${dd}T00:00`,
    end: `${yyyy}-${mm}-${dd}T23:59`,
  };
};

export default function DashboardPage() {
  const cameraConnected = useAppStore((s) => s.cameraConnected);
  const backendConnected = useAppStore((s) => s.backendConnected);

  const todayRange = getTodayRange();
  const [startTime, setStartTime] = useState(todayRange.start);
  const [endTime, setEndTime] = useState(todayRange.end);

  const isToday = startTime === todayRange.start && endTime === todayRange.end;

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats", startTime, endTime],
    queryFn: () => historyApi.stats({ start_time: startTime, end_time: endTime }),
    refetchInterval: isToday ? 10000 : false, // Only auto-refresh for today
  });

  const { data: modelsData } = useQuery({
    queryKey: ["models-count"],
    queryFn: () => modelsApi.list({ page: 1, page_size: 1 }),
  });

  const totalModels = modelsData?.total || 0;

  const handlePrevDay = () => {
    const d = new Date(startTime);
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setStartTime(`${yyyy}-${mm}-${dd}T00:00`);
    setEndTime(`${yyyy}-${mm}-${dd}T23:59`);
  };

  const handleNextDay = () => {
    const d = new Date(startTime);
    d.setDate(d.getDate() + 1);
    const today = new Date();
    if (d <= today || d.toDateString() === today.toDateString()) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      setStartTime(`${yyyy}-${mm}-${dd}T00:00`);
      setEndTime(`${yyyy}-${mm}-${dd}T23:59`);
    }
  };

  const handleToday = () => {
    const range = getTodayRange();
    setStartTime(range.start);
    setEndTime(range.end);
  };

  const formatDateTimeDisplay = (dtStr) => {
    const d = new Date(dtStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isWholeDay = (start, end) => {
    return start.endsWith("T00:00") && end.endsWith("T23:59");
  };

  const getDisplayLabel = () => {
    const startD = new Date(startTime);
    const endD = new Date(endTime);
    if (isWholeDay(startTime, endTime) && startD.toDateString() === endD.toDateString()) {
      return startD.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return `${formatDateTimeDisplay(startTime)} - ${formatDateTimeDisplay(endTime)}`;
  };

  const displayDate = getDisplayLabel();

  const chartSubtitle = isToday
    ? "Today's OK/NG counts by hour"
    : isWholeDay(startTime, endTime)
    ? `${new Date(startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}'s OK/NG counts by hour`
    : "OK/NG counts for the selected period";

  return (
    <Box>
      {/* Page Header with Date Picker */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, color: "text.primary" }}>
            Dashboard
          </Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
            {isToday ? "Real-time overview of inspection performance" : `Analysis for ${displayDate}`}
          </Typography>
        </Box>

        {/* Date Selector */}
        <Box sx={{
          display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap",
          background: "#fff", borderRadius: "14px", px: 2, py: 1.2,
          border: "1px solid rgba(29,78,158,0.1)",
          boxShadow: "0 2px 8px rgba(29,78,158,0.06)",
        }}>
          <Tooltip title="Previous day">
            <IconButton size="small" onClick={handlePrevDay} sx={{ color: "primary.main" }}>
              <ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          <TextField
            type="datetime-local"
            size="small"
            label="Start Time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: 600,
              },
              minWidth: 200,
            }}
          />

          <Typography sx={{ color: "text.secondary", fontWeight: 600, px: 0.5 }}>to</Typography>

          <TextField
            type="datetime-local"
            size="small"
            label="End Time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: 600,
              },
              minWidth: 200,
            }}
          />

          <Tooltip title="Next day">
            <span>
              <IconButton size="small" onClick={handleNextDay} disabled={isToday} sx={{ color: "primary.main" }}>
                <ArrowForwardIosRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </span>
          </Tooltip>

          {!isToday && (
            <Tooltip title="Go to today">
              <IconButton size="small" onClick={handleToday} sx={{
                color: "#fff",
                background: "linear-gradient(135deg, #1D4E9E, #3A6FBF)",
                "&:hover": { background: "linear-gradient(135deg, #163d7a, #2d5a9e)" },
                width: 30, height: 30,
              }}>
                <TodayRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Date Badge */}
      {!isToday && (
        <Box sx={{
          mb: 2.5, px: 2, py: 1, borderRadius: "10px",
          background: "linear-gradient(135deg, rgba(29,78,158,0.06), rgba(29,78,158,0.02))",
          border: "1px solid rgba(29,78,158,0.1)",
          display: "flex", alignItems: "center", gap: 1,
        }}>
          <TodayRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "primary.main" }}>
            Viewing data for: {displayDate}
          </Typography>
        </Box>
      )}

      {/* Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 12/7 }}>
          <StatCard
            title="Total Models"
            value={totalModels}
            icon={<ModelTrainingRoundedIcon />}
            color="#1D4E9E"
            delay={0}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 12/7 }}>
          <StatCard
            title={isToday ? "Today's Cycles" : "Day's Cycles"}
            value={statsLoading ? "—" : stats?.todays_cycles || 0}
            icon={<LoopRoundedIcon />}
            color="#7C3AED"
            delay={0.05}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 12/7 }}>
          <StatCard
            title="OK Count"
            value={statsLoading ? "—" : stats?.ok_today || 0}
            icon={<CheckCircleRoundedIcon />}
            color="#2E7D32"
            delay={0.1}
            trendLabel={isToday ? "Today" : startTime.split("T")[0]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 12/7 }}>
          <StatCard
            title="NG Count"
            value={statsLoading ? "—" : stats?.ng_today || 0}
            icon={<CancelRoundedIcon />}
            color="#E53935"
            delay={0.15}
            trendLabel={isToday ? "Today" : startTime.split("T")[0]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 12/7 }}>
          <StatCard
            title="Detection Accuracy"
            value={statsLoading ? "—" : `${stats?.accuracy || 0}%`}
            icon={<PercentRoundedIcon />}
            color="#0891B2"
            delay={0.2}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 12/7 }}>
          <StatCard
            title="Camera Status"
            value={cameraConnected ? "Online" : "Offline"}
            icon={<VideocamRoundedIcon />}
            color={cameraConnected ? "#2E7D32" : "#E53935"}
            delay={0.25}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 12/7 }}>
          <StatCard
            title="Line Status"
            value={backendConnected ? "Running" : "Stopped"}
            icon={<PowerRoundedIcon />}
            color={backendConnected ? "#2E7D32" : "#F57C00"}
            delay={0.3}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Detection Trend */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Detection Trend
              </Typography>
              <Typography variant="subtitle2" sx={{ mb: 2, mt: -1 }}>
                OK/NG trend over the last 7 days
              </Typography>
              {statsLoading ? (
                <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={stats?.trend_data || []}>
                    <defs>
                      <linearGradient id="okGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ngGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E53935" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#E53935" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(29,78,158,0.06)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#5A6478" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#5A6478" }} />
                    <RTooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "0.8rem", fontWeight: 600 }} />
                    <Area type="monotone" dataKey="ok" name="OK" stroke="#2E7D32" fill="url(#okGrad)" strokeWidth={2.5} dot={{ fill: "#2E7D32", r: 4 }} />
                    <Area type="monotone" dataKey="ng" name="NG" stroke="#E53935" fill="url(#ngGrad)" strokeWidth={2.5} dot={{ fill: "#E53935", r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Hourly Chart */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Hourly Breakdown
              </Typography>
              <Typography variant="subtitle2" sx={{ mb: 2, mt: -1 }}>
                {chartSubtitle}
              </Typography>
              {statsLoading ? (
                <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={(stats?.hourly_data || []).filter((d) => d.ok > 0 || d.ng > 0).length > 0 ? stats.hourly_data : stats?.hourly_data?.slice(6, 23) || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(29,78,158,0.06)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#5A6478" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#5A6478" }} />
                    <RTooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "0.8rem", fontWeight: 600 }} />
                    <Bar dataKey="ok" name="OK" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ng" name="NG" fill="#EF5350" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Detections Table */}
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            {isToday ? "Recent Detections" : `Detections on ${displayDate}`}
          </Typography>
          <TableContainer sx={{ borderRadius: "12px", border: "1px solid rgba(29,78,158,0.06)" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Cycle ID</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell align="center">OK</TableCell>
                  <TableCell align="center">NG</TableCell>
                  <TableCell>Cycle Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton variant="text" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (stats?.recent || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      {isToday ? "No inspection records yet" : "No records for this date"}
                    </TableCell>
                  </TableRow>
                ) : (
                  (stats?.recent || []).map((row) => (
                    <TableRow key={row.id} hover sx={{ transition: "background 0.2s ease" }}>
                      <TableCell sx={{ fontWeight: 600, fontFamily: "monospace" }}>
                        #{String(row.id).padStart(5, "0")}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>
                        {new Date(row.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.model_name}
                          size="small"
                          sx={{
                            background: "rgba(29,78,158,0.08)",
                            color: "#1D4E9E",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.result}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            ...(row.result === "OK"
                              ? { background: "rgba(46,125,50,0.1)", color: "#2E7D32" }
                              : { background: "rgba(229,57,53,0.1)", color: "#E53935" }),
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ color: "success.main", fontWeight: 600 }}>
                        {row.ok_count}
                      </TableCell>
                      <TableCell align="center" sx={{ color: "error.main", fontWeight: 600 }}>
                        {row.ng_count}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                        {row.cycle_time}s
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
