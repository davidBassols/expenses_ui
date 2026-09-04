import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories } from '../api/categories';
import { AuthError } from '../api/client';
import { createExpense, getExpensesByMonth } from '../api/expenses';
import { getOverview } from '../api/overview';
import ExpenseFormDialog from '../components/ExpenseFormDialog';
import type { Expense, ExpenseRequest } from '../types/Expense';

const PLANNED_BORDER_COLOR = '#8e24aa'; // dashed border used to mark planned expenses without hiding the sign color
const POSITIVE_CARD_COLOR = '#c8e6c9'; // light green — money in
const NEGATIVE_CARD_COLOR = '#ffcdd2'; // light red — money out

/** A creation that has been sent to the backend but not confirmed yet. */
interface PendingExpense {
  tempId: string;
  year: number;
  month: number;
  request: ExpenseRequest;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function formatAmount(value: number): string {
  return value.toFixed(2);
}

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export default function ExpensesPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [defaultCategoryId, setDefaultCategoryId] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);

  const queryClient = useQueryClient();

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });

  const {
    data: expenses,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['expenses', year, month],
    queryFn: () => getExpensesByMonth(year, month),
  });

  // Warm the neighbouring months so navigation is instant and they end up in the offline cache.
  const previous = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  useQuery({
    queryKey: ['expenses', previous.year, previous.month],
    queryFn: () => getExpensesByMonth(previous.year, previous.month),
  });
  useQuery({
    queryKey: ['expenses', next.year, next.month],
    queryFn: () => getExpensesByMonth(next.year, next.month),
  });

  const { data: overview } = useQuery({ queryKey: ['overview'], queryFn: getOverview });
  const accountBalance = useMemo(
    () => (overview ?? []).reduce((sum, item) => sum + item.total, 0),
    [overview]
  );

  // Creations are fire-and-forget: the dialog closes immediately and the card shows up as
  // pending until the (possibly very slow, cold-starting) backend confirms it.
  const createMutation = useMutation({
    mutationFn: (item: PendingExpense) => createExpense(item.request),
    // Awaited so the pending card is only dropped once the refetched list contains the real one.
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['overview'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: (err: Error, item) =>
      setErrorMessage(`Failed to create "${item.request.name}": ${err.message}`),
    onSettled: (_data, _err, item) =>
      setPendingExpenses((current) => current.filter((p) => p.tempId !== item.tempId)),
  });

  const handleCreate = (request: ExpenseRequest) => {
    // Undated (planned) expenses stay in the month currently on screen.
    const item: PendingExpense = {
      tempId: crypto.randomUUID(),
      year: request.billed ? Number(request.billed.slice(0, 4)) : year,
      month: request.billed ? Number(request.billed.slice(5, 7)) : month,
      request,
    };
    setPendingExpenses((current) => [...current, item]);
    createMutation.mutate(item);
  };

  const pendingIds = useMemo(
    () => new Set(pendingExpenses.map((p) => p.tempId)),
    [pendingExpenses]
  );

  /** Group expenses by categoryId, sorted by date inside each column. */
  const { columns, maxRows, monthTotal } = useMemo(() => {
    const placeholders: Expense[] = pendingExpenses
      .filter((p) => p.year === year && p.month === month)
      .map((p) => ({
        id: p.tempId,
        name: p.request.name,
        description: p.request.description ?? null,
        billed: p.request.billed,
        cost: p.request.cost,
        categoryId: p.request.categoryId,
        categoryName: '',
        tags: [],
        createdAt: '',
        updatedAt: '',
      }));
    const byCategory = new Map<string, Expense[]>();
    for (const expense of [...(expenses ?? []), ...placeholders]) {
      const list = byCategory.get(expense.categoryId) ?? [];
      list.push(expense);
      byCategory.set(expense.categoryId, list);
    }
    for (const list of byCategory.values()) {
      // Planned (undated) expenses first, then by date
      list.sort((a, b) => {
        if (a.billed === null && b.billed === null) return 0;
        if (a.billed === null) return -1;
        if (b.billed === null) return 1;
        return a.billed.localeCompare(b.billed);
      });
    }
    const columns = (categories ?? [])
      .map((cat) => {
        const expenses = byCategory.get(cat.id) ?? [];
        const sum = expenses.reduce((total, e) => total + e.cost, 0);
        return { category: cat, expenses, sum };
      });
    const maxRows = Math.max(0, ...columns.map((c) => c.expenses.length));
    const monthTotal = columns.reduce((total, c) => total + c.sum, 0);
    return { columns, maxRows, monthTotal };
  }, [expenses, categories, pendingExpenses, year, month]);

  const goToPreviousMonth = () => {
    const target = shiftMonth(year, month, -1);
    setYear(target.year);
    setMonth(target.month);
  };

  const goToNextMonth = () => {
    const target = shiftMonth(year, month, 1);
    setYear(target.year);
    setMonth(target.month);
  };

  /**
   * Planned expenses have no billed date yet — they are provisions
   * (e.g. auto-generated from a recurring rule) not yet charged.
   */
  const isPlanned = (expense: Expense): boolean => expense.billed === null;

  const openCreateDialog = (categoryId?: string) => {
    setEditingExpense(null);
    setDefaultCategoryId(categoryId);
    setDialogOpen(true);
  };

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setDefaultCategoryId(undefined);
    setDialogOpen(true);
  };

  // A failed refresh must not throw away the cached month that is already on screen.
  if (isError && expenses === undefined) {
    if (error instanceof AuthError) {
      return <Navigate to="/login" replace />;
    }
    return (
      <Alert severity="error">
        Failed to load expenses: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={goToPreviousMonth} aria-label="Previous month">
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h5" component="h1" sx={{ minWidth: 200, textAlign: 'center' }}>
            {monthLabel(year, month)}
          </Typography>
          <IconButton onClick={goToNextMonth} aria-label="Next month">
            <ChevronRightIcon />
          </IconButton>
          {isFetching && !isLoading && (
            <Tooltip title="Refreshing from the server">
              <CircularProgress size={16} />
            </Tooltip>
          )}
        </Stack>
        <Stack direction="row" spacing={3} alignItems="center">
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">This month</Typography>
            <Typography
              variant="h6"
              sx={{ color: monthTotal >= 0 ? 'success.main' : 'error.main', fontWeight: 'bold' }}
            >
              {formatAmount(monthTotal)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">Account balance</Typography>
            <Typography
              variant="h6"
              sx={{ color: accountBalance >= 0 ? 'success.main' : 'error.main', fontWeight: 'bold' }}
            >
              {formatAmount(accountBalance)}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openCreateDialog()}>
            New expense
          </Button>
        </Stack>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : columns.length === 0 ? (
        <Alert severity="info">
          No categories yet. Create one first.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small" sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                {columns.map(({ category, sum }) => (
                  <TableCell key={category.id} sx={{ fontWeight: 'bold', verticalAlign: 'middle' }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <span>{category.name}</span>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: sum >= 0 ? 'success.main' : 'error.main' }}>
                        {formatAmount(sum)}
                      </Typography>
                    </Stack>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: maxRows }, (_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map(({ category, expenses: columnExpenses }) => {
                    const expense = columnExpenses[rowIndex];
                    if (!expense) {
                      return <TableCell key={category.id} sx={{ border: 'none' }} />;
                    }
                    const planned = isPlanned(expense);
                    const pending = pendingIds.has(expense.id);
                    const cardContent = (
                      <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                        <Stack spacing={0.25}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 500, overflowWrap: 'anywhere' }}
                          >
                            {expense.name}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatAmount(expense.cost)}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                          <Typography variant="caption" color="text.secondary">
                            {expense.billed ?? 'not charged yet'}
                          </Typography>
                          {planned && (
                            <Chip label="planned" size="small" color="secondary" variant="outlined" />
                          )}
                          {pending && (
                            <Chip
                              label="saving…"
                              size="small"
                              color="warning"
                              variant="outlined"
                              icon={<CircularProgress size={10} color="inherit" />}
                            />
                          )}
                          {expense.tags.map((tag) => (
                            <Chip key={tag.id} label={tag.name} size="small" variant="outlined" />
                          ))}
                        </Stack>
                      </CardContent>
                    );
                    return (
                      <TableCell key={category.id} sx={{ border: 'none', pb: 1 }}>
                        <Card
                          variant="outlined"
                          sx={{
                            backgroundColor: expense.cost >= 0 ? POSITIVE_CARD_COLOR : NEGATIVE_CARD_COLOR,
                            ...(planned && { borderStyle: 'dashed', borderWidth: 2, borderColor: PLANNED_BORDER_COLOR }),
                            ...(pending && { opacity: 0.6 }),
                          }}
                        >
                          {pending ? (
                            cardContent
                          ) : (
                            <CardActionArea onClick={() => openEditDialog(expense)}>
                              {cardContent}
                            </CardActionArea>
                          )}
                        </Card>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                {columns.map(({ category, sum }) => (
                  <TableCell key={category.id} sx={{ borderTop: 2, borderColor: 'divider' }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Total</Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 'bold', color: sum >= 0 ? 'success.main' : 'error.main' }}
                      >
                        {formatAmount(sum)}
                      </Typography>
                    </Stack>
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}

      <ExpenseFormDialog
        open={dialogOpen}
        expense={editingExpense}
        defaults={{
          billed: toISODate(year, month, Math.min(now.getDate(), 28)),
          categoryId: defaultCategoryId,
        }}
        onCreate={handleCreate}
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
