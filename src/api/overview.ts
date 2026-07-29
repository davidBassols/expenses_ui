import { apiFetch } from './client';
import type { ExpenseOverviewItem } from '../types/Overview';

export function getOverview(): Promise<ExpenseOverviewItem[]> {
  return apiFetch<ExpenseOverviewItem[]>('/api/v1/expenses/overview');
}
