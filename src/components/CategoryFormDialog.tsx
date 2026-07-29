import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory, updateCategory } from '../api/categories';
import type { Category } from '../types/Category';

interface CategoryFormDialogProps {
  open: boolean;
  /** When provided, the dialog edits this category; otherwise it creates a new one. */
  category: Category | null;
  onClose: () => void;
  onError: (message: string) => void;
}

export default function CategoryFormDialog({
  open,
  category,
  onClose,
  onError,
}: CategoryFormDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const isEdit = category !== null;

  useEffect(() => {
    if (open) {
      setName(category?.name ?? '');
    }
  }, [open, category]);

  const mutation = useMutation({
    mutationFn: (value: string) =>
      isEdit ? updateCategory(category.id, { name: value }) : createCategory({ name: value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onClose();
    },
    onError: (error: Error) => {
      onError(error.message);
    },
  });

  const handleSubmit = () => {
    if (name.trim().length === 0) return;
    mutation.mutate(name.trim());
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{isEdit ? 'Edit category' : 'New category'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          slotProps={{ htmlInput: { maxLength: 50 } }}
          error={name.trim().length === 0 && name.length > 0}
          helperText={`${name.length}/50`}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={name.trim().length === 0 || mutation.isPending}
        >
          {mutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
