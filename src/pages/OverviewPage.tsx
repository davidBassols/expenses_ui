import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Alert,
  Box,
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
import { getCategories } from '../api/categories';
import { getOverview } from '../api/overview';
import { AuthError } from '../api/client';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const ABOVE_AVG_COLOR = '#ffcdd2'; // light red
const BELOW_AVG_COLOR = '#c8e6c9'; // light green

function formatMonthYear(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function formatAmount(value: number): string {
  return value.toFixed(2);
}

export default function OverviewPage() {
  const { data: overview, isLoading, isError, error } = useQuery({
    queryKey: ['overview'],
    queryFn: getOverview,
  });
  const { data: allCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  /**
   * Pivot the API response:
   * - columns: every category in user-defined order (from categories API)
   * - rows: one per year-month (descending — newest first), with categoryId -> total lookup
   * - cumulative: running sum of month totals (newest first accumulates)
   * - averages: per category across the months where it appears
   */
  const { categories, rows, averages } = useMemo(() => {
    const items = overview ?? [];

    // Use user-defined category order from the categories endpoint
    const categories = (allCategories ?? []).map((c) => ({ id: c.id, name: c.name }));

    // Months descending: newest first
    const sortedItems = [...items].sort((a, b) =>
      b.year !== a.year ? b.year - a.year : b.month - a.month
    );

    // Build rows with cumulative sum (accumulating from newest backwards)
    let runningTotal = 0;
    const rows = sortedItems.map((item) => {
      const totals = new Map<string, number>();
      for (const cat of item.byCategory) {
        totals.set(cat.categoryId, cat.total);
      }
      runningTotal += item.total;
      return { year: item.year, month: item.month, total: item.total, totals, cumulative: runningTotal };
    });

    const averages = new Map<string, number>();
    for (const cat of categories) {
      const values = rows
        .map((row) => row.totals.get(cat.id))
        .filter((v): v is number => v !== undefined);
      const avg = values.length > 0
        ? values.reduce((sum, v) => sum + v, 0) / values.length
        : 0;
      averages.set(cat.id, avg);
    }

    return { categories, rows, averages };
  }, [overview, allCategories]);

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
        Failed to load overview: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <>
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        Overview
      </Typography>

      {rows.length === 0 ? (
        <Alert severity="info">
          No expenses yet. Add some expenses and they will appear here grouped by month and category.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              {/* Average row at the top */}
              <TableRow sx={{ borderBottom: 2, borderColor: 'divider' }}>
                <TableCell sx={{ fontWeight: 'bold', fontStyle: 'italic' }}>
                  Average
                </TableCell>
                {categories.map((cat) => (
                  <TableCell key={cat.id} align="right" sx={{ fontStyle: 'italic' }}>
                    {formatAmount(averages.get(cat.id) ?? 0)}
                  </TableCell>
                ))}
                <TableCell />
                <TableCell />
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Month</TableCell>
                {categories.map((cat) => (
                  <TableCell key={cat.id} align="right" sx={{ fontWeight: 'bold' }}>
                    {cat.name}
                  </TableCell>
                ))}
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Total
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Cumulative
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.year}-${row.month}`} hover>
                  <TableCell>{formatMonthYear(row.year, row.month)}</TableCell>
                  {categories.map((cat) => {
                    const value = row.totals.get(cat.id);
                    const avg = averages.get(cat.id) ?? 0;
                    const isZero = value !== undefined && value === 0;
                    const backgroundColor =
                      value === undefined || isZero
                        ? undefined
                        : value > avg
                          ? ABOVE_AVG_COLOR
                          : BELOW_AVG_COLOR;
                    return (
                      <TableCell
                        key={cat.id}
                        align="right"
                        sx={{ backgroundColor }}
                      >
                        {value !== undefined && !isZero ? formatAmount(value) : '—'}
                      </TableCell>
                    );
                  })}
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatAmount(row.total)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatAmount(row.cumulative)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}
