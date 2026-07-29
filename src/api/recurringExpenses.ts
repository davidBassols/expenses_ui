import { apiFetch } from './client';
import type { RecurringExpense, RecurringExpenseRequest } from '../types/RecurringExpense';

const BASE = '/api/v1/recurring-expenses';

export function getRecurringExpenses(): Promise<RecurringExpense[]> {
  return apiFetch<RecurringExpense[]>(BASE);
}

export function createRecurringExpense(request: RecurringExpenseRequest): Promise<RecurringExpense> {
  return apiFetch<RecurringExpense>(BASE, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function updateRecurringExpense(
  id: string,
  request: RecurringExpenseRequest,
): Promise<RecurringExpense> {
  return apiFetch<RecurringExpense>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

export function deleteRecurringExpense(id: string): Promise<void> {
  return apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' });
}
