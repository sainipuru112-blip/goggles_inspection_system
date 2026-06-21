import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, Tooltip, InputAdornment, Typography,
  FormControl, InputLabel, Select, MenuItem, OutlinedInput,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { modelsApi, partsApi } from "../../api/client";

export default function ModelTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    model_name: "",
    model_path: "",
    part_ids: [],
  });

  const { data } = useQuery({
    queryKey: ["models-list", search],
    queryFn: () => modelsApi.list({ search: search || undefined, page_size: 100 }),
  });

  const { data: partsData } = useQuery({
    queryKey: ["all-parts"],
    queryFn: () => partsApi.list({ status: "active", page_size: 200 }),
  });

  const createMutation = useMutation({
    mutationFn: modelsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(["models-list"]);
      queryClient.invalidateQueries(["model-names"]);
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => modelsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["models-list"]);
      queryClient.invalidateQueries(["model-names"]);
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: modelsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(["models-list"]);
      queryClient.invalidateQueries(["model-names"]);
      setDeleteOpen(false);
      setEditing(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }) => modelsApi.toggleStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(["models-list"]);
      queryClient.invalidateQueries(["model-names"]);
    },
  });

  const handleOpenCreate = () => {
    setEditing(null);
    setFormData({ model_name: "", model_path: "", part_ids: [] });
    setDialogOpen(true);
  };

  const handleOpenEdit = (model) => {
    setEditing(model);
    setFormData({
      model_name: model.model_name,
      model_path: model.model_path,
      part_ids: (model.parts || []).map((p) => p.id),
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const handleSave = () => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggle = (model) => {
    toggleMutation.mutate({
      id: model.id,
      status: model.status === "active" ? "inactive" : "active",
    });
  };

  const allParts = partsData?.items || [];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search models..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 280 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
        />
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={handleOpenCreate}>
          Create Model
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Model Name</TableCell>
                  <TableCell align="center">No. of Parts</TableCell>
                  <TableCell>Model Path</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data?.items || []).map((model) => (
                  <TableRow key={model.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{model.model_name}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={model.parts_count}
                        size="small"
                        sx={{
                          background: "rgba(29,78,158,0.08)",
                          color: "#1D4E9E",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          minWidth: 32,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem", color: "text.secondary" }}>
                      {model.model_path || "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={model.status}
                        size="small"
                        onClick={() => handleToggle(model)}
                        sx={{
                          cursor: "pointer",
                          fontWeight: 700,
                          fontSize: "0.7rem",
                          textTransform: "capitalize",
                          ...(model.status === "active"
                            ? { background: "rgba(46,125,50,0.1)", color: "#2E7D32" }
                            : { background: "rgba(107,122,144,0.1)", color: "#6B7A90" }),
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem" }}>
                      {model.created_at ? new Date(model.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenEdit(model)}>
                          <EditRoundedIcon fontSize="small" sx={{ color: "primary.main" }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => { setEditing(model); setDeleteOpen(true); }}
                        >
                          <DeleteRoundedIcon fontSize="small" sx={{ color: "error.main" }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? "Edit Model" : "Create Model"}
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <TextField
            fullWidth
            label="Model Name"
            value={formData.model_name}
            onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Model Path (.pt file)"
            value={formData.model_path}
            onChange={(e) => setFormData({ ...formData, model_path: e.target.value })}
            placeholder="e.g., roof_body.pt"
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Assign Parts</InputLabel>
            <Select
              multiple
              value={formData.part_ids}
              onChange={(e) => setFormData({ ...formData, part_ids: e.target.value })}
              input={<OutlinedInput label="Assign Parts" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((id) => {
                    const part = allParts.find((p) => p.id === id);
                    return (
                      <Chip
                        key={id}
                        label={part?.part_name || id}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          background: "rgba(29,78,158,0.08)",
                          color: "#1D4E9E",
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            >
              {allParts.map((part) => (
                <MenuItem key={part.id} value={part.id}>
                  {part.part_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!formData.model_name.trim()}
          >
            {editing ? "Save Changes" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Model</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{editing?.model_name}</strong>? This will also remove all part assignments.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteMutation.mutate(editing?.id)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
