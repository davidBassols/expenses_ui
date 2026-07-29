import type { TagSummary } from './Tag';

/** Mirrors com.zerosmet.expenses.dto.expense.ExpenseResponse */
export interface Expense {
  id: string;
  name: string;
  description: string | null;
  /** ISO LocalDate "YYYY-MM-DD", or null when the expense is planned (not yet charged). */
  billed: string | null;
  cost: number;
  categoryId: string;
  categoryName: string;
  tags: TagSummary[];
  createdAt: string;
  updatedAt: string;
}

/** Mirrors com.zerosmet.expenses.dto.expense.ExpenseRequest */
export interface ExpenseRequest {
  name: string;
  description?: string | null;
  /** "YYYY-MM-DD", or null for a planned expense. */
  billed: string | null;
  cost: number;
  categoryId: string;
  /** Tags to assign (e.g. "holidays-2026"). Optional. */
  tagIds?: string[];
}
