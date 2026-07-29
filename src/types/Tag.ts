import type { Expense } from './Expense';

/** Mirrors com.zerosmet.expenses.dto.tag.TagResponse */
export interface Tag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors com.zerosmet.expenses.dto.tag.TagRequest */
export interface TagRequest {
  name: string;
}

/** Mirrors com.zerosmet.expenses.dto.tag.TagSummary (embedded in ExpenseResponse) */
export interface TagSummary {
  id: string;
  name: string;
}

/** Mirrors com.zerosmet.expenses.dto.tag.TagDetailResponse */
export interface TagDetail {
  id: string;
  name: string;
  totalCost: number;
  expenses: Expense[];
  createdAt: string;
  updatedAt: string;
}
