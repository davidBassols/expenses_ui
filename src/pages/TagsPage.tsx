import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthError } from '../api/client';
import { deleteTag, getTags } from '../api/tags';
import TagFormDialog from '../components/TagFormDialog';
import type { Tag } from '../types/Tag';

export default function TagsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: tags, isLoading, isError, error } = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (err: Error) => setErrorMessage(err.message),
  });

  const openCreateDialog = () => {
    setEditingTag(null);
    setDialogOpen(true);
  };

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    if (error instanceof AuthError) {
      return <Navigate to="/login" replace />;
    }
    return (
      <Alert severity="error">
        Failed to load tags: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          Tags
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
          New tag
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tags && tags.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    No tags yet. Create one (e.g. "holidays-2026") and assign it to expenses to
                    track what a trip or project cost in total.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {tags?.map((tag) => (
              <TableRow
                key={tag.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/tags/${tag.id}`)}
              >
                <TableCell>{tag.name}</TableCell>
                <TableCell>{new Date(tag.createdAt).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <IconButton
                    aria-label="edit"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(tag);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="delete"
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(tag.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TagFormDialog
        open={dialogOpen}
        tag={editingTag}
        onClose={() => setDialogOpen(false)}
        onError={setErrorMessage}
      />

      <Snackbar
        open={errorMessage !== null}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
      >
        <Alert severity="error" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
