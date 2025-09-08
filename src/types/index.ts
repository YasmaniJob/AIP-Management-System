// User roles and types
export const USER_ROLES = [
  'admin',
  'teacher',
  'student',
  'librarian',
  'assistant'
] as const;

export type UserRole = typeof USER_ROLES[number];

// Common response type for server actions
export interface ServerActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// User type
export interface User {
  id: string;
  name: string;
  email: string;
  dni: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isActive: boolean;
}

// Pagination type
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Generic filter options
export interface FilterOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// Error response type
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Success response type
export interface ApiSuccess<T = any> {
  success: true;
  data: T;
}

// API response type
export type ApiResponse<T = any> = ApiSuccess<T> | { success: false; error: ApiError };
