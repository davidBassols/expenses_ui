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
import { createTag, updateTag } from '../api/tags';
import type { Tag } from '../types/Tag';

interface TagFormDialogProps {
  open: boolean;
  tag: Tag | null;
  onClose: () => void;
  onError: (message: string) => void;
}

export default function TagFormDialog({ open, tag, onClose, onError }: TagFormDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const isEdit = tag !== null;

  useEffect(() => {
    if (open) {
      setName(tag?.name ?? '');
    }
  }, [open, tag]);

  const mutation = useMutation({
    mutationFn: (value: string) =>
      isEdit ? updateTag(tag.id, { name: value }) : createTag({ name: value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      onClose();
    },
    onError: (err: Error) => onError(err.message),
  });

  const handleSubmit = () => {
    if (name.trim().length === 0) return;
    mutation.mutate(name.trim());
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{isEdit ? 'Edit tag' : 'New tag'}</DialogTitle>
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
          helperText={`${name.length}/50 — e.g. holidays-2026`}
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
