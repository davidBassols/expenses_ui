/** Mirrors com.zerosmet.expenses.dto.category.CategoryResponse */
export interface Category {
  id: string; // UUID
  name: string;
  position: number;
  createdAt: string; // ISO LocalDateTime
  updatedAt: string;
}

/** Mirrors com.zerosmet.expenses.dto.category.CategoryRequest */
export interface CategoryRequest {
  name: string;
}
