import { Navigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { AuthError } from '../api/client';
import { getTagDetail } from '../api/tags';

export default function TagDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: detail, isLoading, isError, error } = useQuery({
    queryKey: ['tags', id, 'detail'],
    queryFn: () => getTagDetail(id!),
    enabled: !!id,
  });

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
        Failed to load tag: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  if (!detail) {
    return null;
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          {detail.name}
        </Typography>
        <Card variant="outlined">
          <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
            <Typography variant="body2" color="text.secondary">
              Total cost
            </Typography>
            <Typography variant="h6">{detail.totalCost.toFixed(2)}</Typography>
          </CardContent>
        </Card>
      </Box>

      {detail.expenses.length === 0 ? (
        <Alert severity="info">
          No expenses tagged with "{detail.name}" yet. Assign this tag to expenses from the
          expense dialog to see them here.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell align="right">Cost</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detail.expenses.map((expense) => (
                <TableRow key={expense.id} hover>
                  <TableCell>{expense.name}</TableCell>
                  <TableCell>{expense.categoryName}</TableCell>
                  <TableCell>{expense.billed ?? 'planned'}</TableCell>
                  <TableCell>
                    {expense.tags.map((tag) => (
                      <Chip key={tag.id} label={tag.name} size="small" sx={{ mr: 0.5 }} />
                    ))}
                  </TableCell>
                  <TableCell align="right">{expense.cost.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ borderTop: 2, borderColor: 'divider' }}>
                <TableCell colSpan={4} sx={{ fontWeight: 'bold' }}>
                  Total
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {detail.totalCost.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}
