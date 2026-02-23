export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  fields?: Record<string, string>;
  code?: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export function successResponse<T>(
  data: T,
  message?: string,
): ApiSuccessResponse<T> {
  return { success: true, data, message };
}

export function errorResponse(
  error: string,
  fields?: Record<string, string>,
  code?: string,
): ApiErrorResponse {
  return { success: false, error, fields, code };
}
