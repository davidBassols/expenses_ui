import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCategories } from '../api/categories';
import { createRecurringExpense, updateRecurringExpense } from '../api/recurringExpenses';
import type { RecurringExpense } from '../types/RecurringExpense';

interface RecurringExpenseFormDialogProps {
  open: boolean;
  recurringExpense: RecurringExpense | null;
  onClose: () => void;
  onError: (message: string) => void;
}

const PERIOD_OPTIONS = [
  { value: 1, label: 'Monthly' },
  { value: 2, label: 'Every 2 months' },
  { value: 3, label: 'Quarterly' },
  { value: 6, label: 'Every 6 months' },
  { value: 12, label: 'Yearly' },
];

export default function RecurringExpenseFormDialog({
  open,
  recurringExpense,
  onClose,
  onError,
}: RecurringExpenseFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = recurringExpense !== null;

  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [periodMonths, setPeriodMonths] = useState(1);
  const [startMonth, setStartMonth] = useState('');
  const [active, setActive] = useState(true);
  const [categoryId, setCategoryId] = useState('');

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });

  useEffect(() => {
    if (open) {
      setName(recurringExpense?.name ?? '');
      setCost(recurringExpense !== null ? String(recurringExpense.cost) : '');
      setPeriodMonths(recurringExpense?.periodMonths ?? 1);
      setStartMonth(recurringExpense?.startMonth ?? '');
      setActive(recurringExpense?.active ?? true);
      setCategoryId(recurringExpense?.categoryId ?? '');
    }
  }, [open, recurringExpense]);

  const mutation = useMutation({
    mutationFn: () => {
      const request = {
        name: name.trim(),
        cost: parseFloat(cost),
        periodMonths,
        startMonth: startMonth || null,
        active,
        categoryId,
      };
      return isEdit
        ? updateRecurringExpense(recurringExpense.id, request)
        : createRecurringExpense(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      onClose();
    },
    onError: (err: Error) => onError(err.message),
  });

  const isValid =
    name.trim().length > 0 &&
    cost !== '' &&
    !isNaN(parseFloat(cost)) &&
    categoryId.length > 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Edit recurring expense' : 'New recurring expense'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <TextField
          autoFocus
          label="Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField
          label="Cost"
          type="number"
          fullWidth
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          slotProps={{ htmlInput: { step: 0.01 } }}
          required
        />
        <FormControl fullWidth required>
          <InputLabel id="recurring-period-label">Repeats</InputLabel>
          <Select
            labelId="recurring-period-label"
            label="Repeats"
            value={periodMonths}
            onChange={(e) => setPeriodMonths(Number(e.target.value))}
          >
            {PERIOD_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Start month (optional)"
          type="month"
          fullWidth
          value={startMonth}
          onChange={(e) => setStartMonth(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          helperText="First month this expense applies to. Empty = has always applied."
        />
        <FormControl fullWidth required>
          <InputLabel id="recurring-category-label">Category</InputLabel>
          <Select
            labelId="recurring-category-label"
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories?.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          control={<Switch checked={active} onChange={(e) => setActive(e.target.checked)} />}
          label="Active"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => mutation.mutate()}
          disabled={!isValid || mutation.isPending}
        >
          {mutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
