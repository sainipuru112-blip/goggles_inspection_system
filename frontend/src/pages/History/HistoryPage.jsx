import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box, Typography, Card, CardContent, TextField, FormControl, Select, MenuItem,
  InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Button, Pagination, Tooltip, InputAdornment, Dialog,
  DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { historyApi, modelsApi } from "../../api/client";

const SNAP_BASE = "http://localhost:8000/snapshots";

// Parse snapshot_path — could be a JSON array or a single filename
const getSnapshots = (snapshotPath) => {
  if (!snapshotPath) return [];
  try {
    const parsed = JSON.parse(snapshotPath);
    if (Array.isArray(parsed)) return parsed;
    return [snapshotPath];
  } catch {
    return snapshotPath ? [snapshotPath] : [];
  }
};

// ── Parts Dialog ──────────────────────────────────────
function PartsDialog({ open, onClose, record }) {
  if (!record) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{
        fontWeight: 700,
        background: record.result === "OK"
          ? "linear-gradient(135deg, #2E7D32, #4CAF50)"
          : "linear-gradient(135deg, #C62828, #E53935)",
        color: "#fff",
      }}>
        Part Details — Cycle #{String(record.id).padStart(5, "0")}
      </DialogTitle>
      <DialogContent sx={{ p: 3, pt: 3 }}>
        <Box sx={{ display: "flex", gap: 3, mt: 1 }}>
          {/* OK Parts */}
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#2E7D32", mb: 1.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              ✓ Detected ({(record.ok_parts || []).length})
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              {(record.ok_parts || []).map((p) => (
                <Box key={p} sx={{
                  display: "flex", alignItems: "center", gap: 1, p: 1.2,
                  borderRadius: "10px", background: "rgba(46,125,50,0.06)",
                  border: "1px solid rgba(46,125,50,0.15)",
                }}>
                  <CheckCircleRoundedIcon sx={{ fontSize: 18, color: "#2E7D32" }} />
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "#2E7D32" }}>{p}</Typography>
                </Box>
              ))}
              {(record.ok_parts || []).length === 0 && (
                <Typography sx={{ fontSize: "0.8rem", color: "text.disabled", fontStyle: "italic", py: 2 }}>No parts detected</Typography>
              )}
            </Box>
          </Box>
          {/* NG Parts */}
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#E53935", mb: 1.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              ✗ Missing ({(record.ng_parts || []).length})
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              {(record.ng_parts || []).map((p) => (
                <Box key={p} sx={{
                  display: "flex", alignItems: "center", gap: 1, p: 1.2,
                  borderRadius: "10px", background: "rgba(229,57,53,0.06)",
                  border: "1px solid rgba(229,57,53,0.15)",
                }}>
                  <CancelRoundedIcon sx={{ fontSize: 18, color: "#E53935" }} />
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "#E53935" }}>{p}</Typography>
                </Box>
              ))}
              {(record.ng_parts || []).length === 0 && (
                <Typography sx={{ fontSize: "0.8rem", color: "text.disabled", fontStyle: "italic", py: 2 }}>All parts detected</Typography>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: "10px" }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Snapshots Dialog ──────────────────────────────────
function SnapsDialog({ open, onClose, record }) {
  const [snapIndex, setSnapIndex] = useState(0);
  const snapshots = record ? getSnapshots(record.snapshot_path) : [];

  // Reset index when record changes
  React.useEffect(() => { setSnapIndex(0); }, [record]);

  if (!record) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ fontWeight: 700, background: "rgba(29,78,158,0.04)" }}>
        Snapshots — Cycle #{String(record.id).padStart(5, "0")}
        <Typography component="span" sx={{ ml: 2, fontSize: "0.8rem", color: "text.secondary" }}>
          {snapshots.length} frame{snapshots.length !== 1 ? "s" : ""}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {snapshots.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>No snapshots available</Box>
        ) : (
          <>
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 1, fontWeight: 600 }}>
              Frame {snapIndex + 1} of {snapshots.length}
            </Typography>
            <Box sx={{ position: "relative", borderRadius: "12px", overflow: "hidden", background: "#000" }}>
              <img
                src={`${SNAP_BASE}/${snapshots[snapIndex]}`}
                alt={`Snapshot ${snapIndex + 1}`}
                style={{ width: "100%", height: "auto", maxHeight: 420, objectFit: "contain", display: "block" }}
              />
              {snapshots.length > 1 && (
                <>
                  <IconButton
                    onClick={() => setSnapIndex((i) => Math.max(0, i - 1))}
                    disabled={snapIndex === 0}
                    sx={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "#fff", "&:hover": { background: "rgba(0,0,0,0.7)" }, "&.Mui-disabled": { display: "none" } }}
                  >
                    <ArrowBackIosNewRoundedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={() => setSnapIndex((i) => Math.min(snapshots.length - 1, i + 1))}
                    disabled={snapIndex === snapshots.length - 1}
                    sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "#fff", "&:hover": { background: "rgba(0,0,0,0.7)" }, "&.Mui-disabled": { display: "none" } }}
                  >
                    <ArrowForwardIosRoundedIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            </Box>
            {/* Thumbnail strip */}
            {snapshots.length > 1 && (
              <Box sx={{ display: "flex", gap: 0.5, mt: 1.5, overflowX: "auto", py: 0.5 }}>
                {snapshots.map((snap, i) => (
                  <Box key={i} onClick={() => setSnapIndex(i)} sx={{
                    minWidth: 64, height: 44, borderRadius: "6px", overflow: "hidden", cursor: "pointer",
                    border: i === snapIndex ? "2px solid #1D4E9E" : "2px solid transparent",
                    opacity: i === snapIndex ? 1 : 0.5, transition: "all 0.2s", "&:hover": { opacity: 1 },
                  }}>
                    <img src={`${SNAP_BASE}/${snap}`} alt={`Thumb ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </Box>
                ))}
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: "10px" }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Full Detail Dialog (Parts + Snapshots) ────────────
function DetailDialog({ open, onClose, record }) {
  const [snapIndex, setSnapIndex] = useState(0);
  const snapshots = record ? getSnapshots(record.snapshot_path) : [];

  React.useEffect(() => { setSnapIndex(0); }, [record]);

  if (!record) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: "16px", maxHeight: "90vh" } }}>
      <DialogTitle sx={{
        fontWeight: 700,
        background: record.result === "OK"
          ? "linear-gradient(135deg, #2E7D32, #4CAF50)"
          : "linear-gradient(135deg, #C62828, #E53935)",
        color: "#fff",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span>Cycle #{String(record.id).padStart(5, "0")} — {record.result}</span>
        <Typography sx={{ fontSize: "0.8rem", opacity: 0.9 }}>{new Date(record.timestamp).toLocaleString()}</Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: "flex", height: "calc(90vh - 140px)" }}>
          {/* Left — Parts */}
          <Box sx={{ width: 320, minWidth: 320, borderRight: "1px solid rgba(0,0,0,0.08)", p: 2.5, overflowY: "auto" }}>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "text.secondary", mb: 1.5, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Part Detection Details
            </Typography>

            {/* Cycle info */}
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <Box sx={{ flex: 1, p: 1, borderRadius: "8px", background: "rgba(29,78,158,0.04)" }}>
                <Typography sx={{ fontSize: "0.6rem", color: "text.secondary", fontWeight: 600 }}>Model</Typography>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>{record.model_name}</Typography>
              </Box>
              <Box sx={{ flex: 1, p: 1, borderRadius: "8px", background: "rgba(29,78,158,0.04)" }}>
                <Typography sx={{ fontSize: "0.6rem", color: "text.secondary", fontWeight: 600 }}>Cycle Time</Typography>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>{record.cycle_time}s</Typography>
              </Box>
            </Box>

            {/* OK */}
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#2E7D32", mb: 1, textTransform: "uppercase" }}>
              ✓ Detected ({(record.ok_parts || []).length})
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 2 }}>
              {(record.ok_parts || []).map((p) => (
                <Box key={p} sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: "8px", background: "rgba(46,125,50,0.06)", border: "1px solid rgba(46,125,50,0.12)" }}>
                  <CheckCircleRoundedIcon sx={{ fontSize: 16, color: "#2E7D32" }} />
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#2E7D32" }}>{p}</Typography>
                </Box>
              ))}
              {(record.ok_parts || []).length === 0 && (
                <Typography sx={{ fontSize: "0.75rem", color: "text.disabled", fontStyle: "italic" }}>None</Typography>
              )}
            </Box>

            {/* NG */}
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#E53935", mb: 1, textTransform: "uppercase" }}>
              ✗ Missing ({(record.ng_parts || []).length})
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {(record.ng_parts || []).map((p) => (
                <Box key={p} sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: "8px", background: "rgba(229,57,53,0.06)", border: "1px solid rgba(229,57,53,0.12)" }}>
                  <CancelRoundedIcon sx={{ fontSize: 16, color: "#E53935" }} />
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#E53935" }}>{p}</Typography>
                </Box>
              ))}
              {(record.ng_parts || []).length === 0 && (
                <Typography sx={{ fontSize: "0.75rem", color: "text.disabled", fontStyle: "italic" }}>All parts detected</Typography>
              )}
            </Box>
          </Box>

          {/* Right — Snapshots */}
          <Box sx={{ flex: 1, p: 2.5, display: "flex", flexDirection: "column" }}>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "text.secondary", mb: 1, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Snapshots ({snapIndex + 1} / {snapshots.length})
            </Typography>

            {snapshots.length === 0 ? (
              <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "text.secondary" }}>
                No snapshots
              </Box>
            ) : (
              <>
                <Box sx={{ flex: 1, position: "relative", borderRadius: "12px", overflow: "hidden", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img
                    src={`${SNAP_BASE}/${snapshots[snapIndex]}`}
                    alt={`Snapshot ${snapIndex + 1}`}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                  />
                  {snapshots.length > 1 && (
                    <>
                      <IconButton
                        onClick={() => setSnapIndex((i) => Math.max(0, i - 1))}
                        disabled={snapIndex === 0}
                        sx={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "#fff", "&:hover": { background: "rgba(0,0,0,0.7)" }, "&.Mui-disabled": { display: "none" } }}
                      >
                        <ArrowBackIosNewRoundedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => setSnapIndex((i) => Math.min(snapshots.length - 1, i + 1))}
                        disabled={snapIndex === snapshots.length - 1}
                        sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", color: "#fff", "&:hover": { background: "rgba(0,0,0,0.7)" }, "&.Mui-disabled": { display: "none" } }}
                      >
                        <ArrowForwardIosRoundedIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>
                {/* Thumbnails */}
                {snapshots.length > 1 && (
                  <Box sx={{ display: "flex", gap: 0.5, mt: 1, overflowX: "auto", py: 0.5 }}>
                    {snapshots.map((snap, i) => (
                      <Box key={i} onClick={() => setSnapIndex(i)} sx={{
                        minWidth: 56, height: 38, borderRadius: "6px", overflow: "hidden", cursor: "pointer",
                        border: i === snapIndex ? "2px solid #1D4E9E" : "2px solid transparent",
                        opacity: i === snapIndex ? 1 : 0.5, transition: "all 0.2s", "&:hover": { opacity: 1 },
                      }}>
                        <img src={`${SNAP_BASE}/${snap}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </Box>
                    ))}
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: "10px" }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main History Page ─────────────────────────────────
export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Dialog states
  const [partsOpen, setPartsOpen] = useState(false);
  const [snapsOpen, setSnapsOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["history", page, pageSize, search, modelFilter, resultFilter, dateFrom, dateTo],
    queryFn: () =>
      historyApi.list({
        page,
        page_size: pageSize,
        search: search || undefined,
        model_name: modelFilter || undefined,
        result: resultFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
    keepPreviousData: true,
  });

  const { data: modelNames } = useQuery({
    queryKey: ["model-names-filter"],
    queryFn: modelsApi.getNames,
  });

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  const handleExport = async () => {
    try {
      const blob = await historyApi.exportCsv({
        model_name: modelFilter || undefined,
        result: resultFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "inspection_history.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const openParts = (row) => { setSelectedRecord(row); setPartsOpen(true); };
  const openSnaps = (row) => { setSelectedRecord(row); setSnapsOpen(true); };
  const openDetail = (row) => { setSelectedRecord(row); setDetailOpen(true); };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>
            Inspection History
          </Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
            Complete record of all inspection cycles
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<FileDownloadRoundedIcon />}
          onClick={handleExport}
          sx={{ height: 42 }}
        >
          Export CSV
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <FilterAltRoundedIcon sx={{ color: "text.secondary", fontSize: 20 }} />

            <TextField
              size="small"
              placeholder="Search cycles..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Model</InputLabel>
              <Select value={modelFilter} label="Model" onChange={(e) => { setModelFilter(e.target.value); setPage(1); }}>
                <MenuItem value="">All Models</MenuItem>
                {(modelNames || []).map((m) => (
                  <MenuItem key={m.id} value={m.model_name}>{m.model_name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Result</InputLabel>
              <Select value={resultFilter} label="Result" onChange={(e) => { setResultFilter(e.target.value); setPage(1); }}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="OK">OK</MenuItem>
                <MenuItem value="NG">NG</MenuItem>
              </Select>
            </FormControl>

            <TextField size="small" type="date" label="From" value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }} />
            <TextField size="small" type="date" label="To" value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }} />

            {(search || modelFilter || resultFilter || dateFrom || dateTo) && (
              <Button size="small" onClick={() => { setSearch(""); setModelFilter(""); setResultFilter(""); setDateFrom(""); setDateTo(""); setPage(1); }}
                sx={{ fontSize: "0.75rem" }}>Clear Filters</Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Cycle ID</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell>Cycle Time</TableCell>
                  <TableCell align="center">Parts</TableCell>
                  <TableCell align="center">Snaps</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((__, j) => (
                          <TableCell key={j} sx={{ py: 2 }}>
                            <Box sx={{ height: 16, background: "#f0f2f7", borderRadius: 1, width: "80%" }} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : (data?.items || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
                          No records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      (data?.items || []).map((row) => (
                        <TableRow key={row.id} hover sx={{ transition: "background 0.2s" }}>
                          <TableCell sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                            #{String(row.id).padStart(5, "0")}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.8rem" }}>
                            {new Date(row.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip label={row.model_name} size="small" sx={{
                              background: "rgba(29,78,158,0.08)", color: "#1D4E9E", fontWeight: 600, fontSize: "0.7rem",
                            }} />
                          </TableCell>
                          <TableCell>
                            <Chip label={row.result} size="small" sx={{
                              fontWeight: 700, fontSize: "0.7rem", minWidth: 48,
                              ...(row.result === "OK"
                                ? { background: "rgba(46,125,50,0.1)", color: "#2E7D32" }
                                : { background: "rgba(229,57,53,0.1)", color: "#E53935" }),
                            }} />
                          </TableCell>
                          <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                            {row.cycle_time}s
                          </TableCell>

                          {/* Parts Button */}
                          <TableCell align="center">
                            <Tooltip title="View part details">
                              <Button size="small" onClick={() => openParts(row)} sx={{
                                borderRadius: "8px", textTransform: "none", fontSize: "0.7rem", fontWeight: 700,
                                minWidth: 0, px: 1, py: 0.3, color: "#1D4E9E",
                              }}>
                                <ListAltRoundedIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                <CheckCircleRoundedIcon sx={{ fontSize: 12, color: "#2E7D32", mr: 0.3 }} />
                                {(row.ok_parts || []).length}
                                <Box sx={{ mx: 0.3, color: "text.disabled", fontSize: "0.65rem" }}>/</Box>
                                <CancelRoundedIcon sx={{ fontSize: 12, color: "#E53935", mr: 0.3 }} />
                                {(row.ng_parts || []).length}
                              </Button>
                            </Tooltip>
                          </TableCell>

                          {/* Snaps Button */}
                          <TableCell align="center">
                            <Tooltip title="View snapshots">
                              <Button size="small" onClick={() => openSnaps(row)} sx={{
                                borderRadius: "8px", textTransform: "none", fontSize: "0.7rem", fontWeight: 700,
                                minWidth: 0, px: 1, py: 0.3, color: "#1D4E9E",
                              }}>
                                <PhotoLibraryRoundedIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                {getSnapshots(row.snapshot_path).length}
                              </Button>
                            </Tooltip>
                          </TableCell>

                          {/* Actions — Full Detail */}
                          <TableCell align="center">
                            <Tooltip title="View full details">
                              <IconButton size="small" onClick={() => openDetail(row)} sx={{ color: "primary.main" }}>
                                <VisibilityRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" />
            </Box>
          )}

          {/* Record count */}
          <Box sx={{ px: 2, pb: 1.5, display: "flex", justifyContent: "space-between" }}>
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
              Showing {data?.items?.length || 0} of {data?.total || 0} records
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
              Page {page} of {totalPages || 1}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <PartsDialog open={partsOpen} onClose={() => setPartsOpen(false)} record={selectedRecord} />
      <SnapsDialog open={snapsOpen} onClose={() => setSnapsOpen(false)} record={selectedRecord} />
      <DetailDialog open={detailOpen} onClose={() => setDetailOpen(false)} record={selectedRecord} />
    </Box>
  );
}
