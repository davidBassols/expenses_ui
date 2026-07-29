import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
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
import { deleteRecurringExpense, getRecurringExpenses } from '../api/recurringExpenses';
import RecurringExpenseFormDialog from '../components/RecurringExpenseFormDialog';
import type { RecurringExpense } from '../types/RecurringExpense';

function periodLabel(periodMonths: number): string {
  if (periodMonths === 1) return 'Monthly';
  if (periodMonths === 2) return 'Every 2 months';
  if (periodMonths === 3) return 'Quarterly';
  if (periodMonths === 6) return 'Every 6 months';
  if (periodMonths === 12) return 'Yearly';
  return `Every ${periodMonths} months`;
}

export default function RecurringExpensesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: recurringExpenses, isLoading, isError, error } = useQuery({
    queryKey: ['recurring-expenses'],
    queryFn: getRecurringExpenses,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRecurringExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
    },
    onError: (err: Error) => setErrorMessage(err.message),
  });

  const openCreateDialog = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item: RecurringExpense) => {
    setEditing(item);
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
        Failed to load recurring expenses: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          Recurring expenses
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
          New recurring expense
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Cost</TableCell>
              <TableCell>Repeats</TableCell>
              <TableCell>Start month</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recurringExpenses && recurringExpenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    No recurring expenses yet. Create one (e.g. insurance, 50, monthly) and it will
                    appear as a planned expense in the current month.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {recurringExpenses?.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.categoryName}</TableCell>
                <TableCell align="right">{item.cost.toFixed(2)}</TableCell>
                <TableCell>{periodLabel(item.periodMonths)}</TableCell>
                <TableCell>{item.startMonth ?? '—'}</TableCell>
                <TableCell>
                  <Chip
                    label={item.active ? 'Active' : 'Paused'}
                    size="small"
                    color={item.active ? 'success' : 'default'}
                    variant={item.active ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton aria-label="edit" size="small" onClick={() => openEditDialog(item)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="delete"
                    size="small"
                    color="error"
                    onClick={() => deleteMutation.mutate(item.id)}
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

      <RecurringExpenseFormDialog
        open={dialogOpen}
        recurringExpense={editing}
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
