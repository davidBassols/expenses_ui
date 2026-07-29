/** Mirrors com.zerosmet.expenses.dto.recurringexpense.RecurringExpenseResponse */
export interface RecurringExpense {
  id: string;
  name: string;
  cost: number;
  periodMonths: number;
  startMonth: string | null; // "YYYY-MM" or null
  active: boolean;
  categoryId: string;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors com.zerosmet.expenses.dto.recurringexpense.RecurringExpenseRequest */
export interface RecurringExpenseRequest {
  name: string;
  cost: number;
  periodMonths: number;
  startMonth?: string | null; // "YYYY-MM"
  active?: boolean;
  categoryId: string;
}
