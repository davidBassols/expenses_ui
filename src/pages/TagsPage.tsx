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
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthError } from '../api/client';
import { deleteTag, getTagDetail, getTags, updateTag } from '../api/tags';
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

  const detailQueries = useQueries({
    queries: (tags ?? []).map((tag) => ({
      queryKey: ['tags', tag.id, 'detail'],
      queryFn: () => getTagDetail(tag.id),
    })),
  });
  const totalsByTagId = new Map(
    detailQueries.flatMap((query) => query.data ? [[query.data.id, query.data.totalCost] as const] : [])
  );

  const deleteMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (err: Error) => setErrorMessage(err.message),
  });

  const activeMutation = useMutation({
    mutationFn: (tag: Tag) => updateTag(tag.id, { name: tag.name, active: !tag.active }),
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
              <TableCell>Status</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tags && tags.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
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
                <TableCell>
                  <Typography
                    variant="body2"
                    color={tag.active ? 'success.main' : 'text.secondary'}
                    sx={{ fontWeight: 600 }}
                  >
                    {tag.active ? 'Active' : 'Closed'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  {totalsByTagId.has(tag.id) ? totalsByTagId.get(tag.id)!.toFixed(2) : '—'}
                </TableCell>
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
                  <Tooltip title={tag.active ? 'Close tag' : 'Reopen tag'}>
                    <span>
                      <IconButton
                        aria-label={tag.active ? 'close tag' : 'reopen tag'}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          activeMutation.mutate(tag);
                        }}
                        disabled={activeMutation.isPending}
                      >
                        {tag.active ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                      </IconButton>
                    </span>
                  </Tooltip>
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
