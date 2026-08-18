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

const POSITIVE_COLOR = '#c8e6c9'; // light green — money in
const NEGATIVE_COLOR = '#ffcdd2'; // light red — money out

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
   * - cumulative: each month's own total plus every earlier month's total (chronological running sum)
   * - averages: per category across past months only (current and future months are excluded)
   */
  const { categories, rows, averages, accountBalance } = useMemo(() => {
    const items = overview ?? [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const isPastMonth = (year: number, month: number) =>
      year < currentYear || (year === currentYear && month < currentMonth);

    // Use user-defined category order from the categories endpoint
    const categories = (allCategories ?? []).map((c) => ({ id: c.id, name: c.name }));

    // Compute cumulative totals chronologically (oldest first) so each month's cumulative
    // includes its own total plus all previous months' totals.
    const sortedAsc = [...items].sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.month - b.month
    );
    let runningTotal = 0;
    const cumulativeByKey = new Map<string, number>();
    for (const item of sortedAsc) {
      runningTotal += item.total;
      cumulativeByKey.set(`${item.year}-${item.month}`, runningTotal);
    }

    // Months descending: newest first
    const sortedItems = [...items].sort((a, b) =>
      b.year !== a.year ? b.year - a.year : b.month - a.month
    );

    const rows = sortedItems.map((item) => {
      const totals = new Map<string, number>();
      for (const cat of item.byCategory) {
        totals.set(cat.categoryId, cat.total);
      }
      const cumulative = cumulativeByKey.get(`${item.year}-${item.month}`) ?? 0;
      return { year: item.year, month: item.month, total: item.total, totals, cumulative };
    });

    const pastRows = rows.filter((row) => isPastMonth(row.year, row.month));
    const averages = new Map<string, number>();
    for (const cat of categories) {
      const values = pastRows
        .map((row) => row.totals.get(cat.id))
        .filter((v): v is number => v !== undefined);
      const avg = values.length > 0
        ? values.reduce((sum, v) => sum + v, 0) / values.length
        : 0;
      averages.set(cat.id, avg);
    }

    const accountBalance = rows.length > 0 ? rows[0].cumulative : 0;
    return { categories, rows, averages, accountBalance };
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          Overview
        </Typography>
        {rows.length > 0 && (
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">Account balance</Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: 'bold', color: accountBalance >= 0 ? 'success.main' : 'error.main' }}
            >
              {formatAmount(accountBalance)}
            </Typography>
          </Box>
        )}
      </Box>

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
                          ? POSITIVE_COLOR
                          : NEGATIVE_COLOR;
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
