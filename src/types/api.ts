// Generic API response wrappers used across all service calls

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface ApiPaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  success: boolean
}

export interface ApiError {
  message: string
  code?: string
  statusCode: number
  errors?: Record<string, string[]>
}

// Generic paginated query params
export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface DateRangeParams {
  fechaDesde?: string
  fechaHasta?: string
}
