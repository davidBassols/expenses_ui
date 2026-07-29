import { apiFetch } from './client';
import type { Expense, ExpenseRequest } from '../types/Expense';

const BASE = '/api/v1/expenses';

export function getExpensesByMonth(year: number, month: number): Promise<Expense[]> {
  return apiFetch<Expense[]>(`${BASE}?year=${year}&month=${month}`);
}

export function createExpense(request: ExpenseRequest): Promise<Expense> {
  return apiFetch<Expense>(BASE, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function updateExpense(id: string, request: ExpenseRequest): Promise<Expense> {
  return apiFetch<Expense>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

export function deleteExpense(id: string): Promise<void> {
  return apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' });
}
