/** Mirrors com.zerosmet.expenses.dto.ApiResponse */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
