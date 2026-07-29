/** Mirrors com.zerosmet.expenses.dto.expense.CategoryTotal */
export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  total: number;
}

/** Mirrors com.zerosmet.expenses.dto.expense.ExpenseOverviewItem */
export interface ExpenseOverviewItem {
  year: number;
  month: number;
  total: number;
  byCategory: CategoryTotal[];
}
