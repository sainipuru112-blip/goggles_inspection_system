import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, Tooltip, InputAdornment, Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { partsApi } from "../../api/client";

export default function PartTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ part_name: "", description: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["parts", search],
    queryFn: () => partsApi.list({ search: search || undefined, page_size: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: partsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(["parts"]);
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => partsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["parts"]);
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: partsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(["parts"]);
      setDeleteOpen(false);
      setEditing(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }) => partsApi.toggleStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries(["parts"]),
  });

  const handleOpenCreate = () => {
    setEditing(null);
    setFormData({ part_name: "", description: "" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (part) => {
    setEditing(part);
    setFormData({ part_name: part.part_name, description: part.description });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setFormData({ part_name: "", description: "" });
  };

  const handleSave = () => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggle = (part) => {
    toggleMutation.mutate({
      id: part.id,
      status: part.status === "active" ? "inactive" : "active",
    });
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search parts..."
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
          Create Part
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Part Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data?.items || []).map((part) => (
                  <TableRow key={part.id} hover>
                    <TableCell sx={{ fontWeight: 600, fontFamily: "monospace" }}>
                      {part.id}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{part.part_name}</TableCell>
                    <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                      {part.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={part.status}
                        size="small"
                        onClick={() => handleToggle(part)}
                        sx={{
                          cursor: "pointer",
                          fontWeight: 700,
                          fontSize: "0.7rem",
                          textTransform: "capitalize",
                          ...(part.status === "active"
                            ? { background: "rgba(46,125,50,0.1)", color: "#2E7D32" }
                            : { background: "rgba(107,122,144,0.1)", color: "#6B7A90" }),
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem" }}>
                      {part.created_at ? new Date(part.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenEdit(part)}>
                          <EditRoundedIcon fontSize="small" sx={{ color: "primary.main" }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => { setEditing(part); setDeleteOpen(true); }}
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
          {editing ? "Edit Part" : "Create Part"}
        </DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <TextField
            fullWidth
            label="Part Name"
            value={formData.part_name}
            onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!formData.part_name.trim()}
          >
            {editing ? "Save Changes" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Part</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{editing?.part_name}</strong>? This action cannot be undone.
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
