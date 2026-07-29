import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCategories } from '../api/categories';
import { createExpense, deleteExpense, updateExpense } from '../api/expenses';
import { getTags } from '../api/tags';
import type { Expense } from '../types/Expense';

interface ExpenseFormDialogProps {
  open: boolean;
  /** When provided, edits (and can delete) this expense; otherwise creates a new one. */
  expense: Expense | null;
  /** Initial values for creation (e.g. current month, preselected category). */
  defaults?: { billed?: string; categoryId?: string };
  onClose: () => void;
  onError: (message: string) => void;
}

export default function ExpenseFormDialog({
  open,
  expense,
  defaults,
  onClose,
  onError,
}: ExpenseFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = expense !== null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [billed, setBilled] = useState('');
  const [planned, setPlanned] = useState(false);
  const [cost, setCost] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const { data: tags } = useQuery({ queryKey: ['tags'], queryFn: getTags });

  useEffect(() => {
    if (open) {
      setName(expense?.name ?? '');
      setDescription(expense?.description ?? '');
      setBilled(expense?.billed ?? defaults?.billed ?? '');
      setPlanned(expense !== null ? expense.billed === null : false);
      setCost(expense !== null ? String(expense.cost) : '');
      setCategoryId(expense?.categoryId ?? defaults?.categoryId ?? '');
      setTagIds(expense?.tags.map((t) => t.id) ?? []);
    }
  }, [open, expense, defaults]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['overview'] });
    queryClient.invalidateQueries({ queryKey: ['tags'] });
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const request = {
        name: name.trim(),
        description: description.trim() || null,
        billed: planned ? null : billed,
        cost: parseFloat(cost),
        categoryId,
        tagIds,
      };
      return isEdit ? updateExpense(expense.id, request) : createExpense(request);
    },
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (err: Error) => onError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteExpense(expense!.id),
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (err: Error) => onError(err.message),
  });

  const isValid =
    name.trim().length > 0 &&
    (planned || billed.length > 0) &&
    cost !== '' &&
    !isNaN(parseFloat(cost)) &&
    categoryId.length > 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Edit expense' : 'New expense'}</DialogTitle>
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
          label="Description"
          fullWidth
          multiline
          minRows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 250 } }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={planned}
              onChange={(e) => setPlanned(e.target.checked)}
            />
          }
          label="Planned (not yet charged)"
        />
        {!planned && (
          <TextField
            label="Billed date"
            type="date"
            fullWidth
            value={billed}
            onChange={(e) => setBilled(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            required
          />
        )}
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
          <InputLabel id="expense-category-label">Category</InputLabel>
          <Select
            labelId="expense-category-label"
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
        <FormControl fullWidth>
          <InputLabel id="expense-tags-label">Tags</InputLabel>
          <Select
            labelId="expense-tags-label"
            label="Tags"
            multiple
            value={tagIds}
            onChange={(e) => setTagIds(typeof e.target.value === 'string' ? [e.target.value] : e.target.value)}
            renderValue={(selected) =>
              (tags ?? [])
                .filter((t) => selected.includes(t.id))
                .map((t) => t.name)
                .join(', ')
            }
          >
            {tags?.map((tag) => (
              <MenuItem key={tag.id} value={tag.id}>
                {tag.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        {isEdit && (
          <Button
            color="error"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending || saveMutation.isPending}
            sx={{ mr: 'auto' }}
          >
            Delete
          </Button>
        )}
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => saveMutation.mutate()}
          disabled={!isValid || saveMutation.isPending || deleteMutation.isPending}
        >
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
