import { apiClient } from '../api/client'
import type { ApiResponse, LoginResponse, AuthUser, CreateUserResponse, UserListItem } from '@/types'

export interface LoginPayload {
  email: string
  password: string
}

export interface ChangePasswordPayload {
  newPassword: string
}

export interface CreateUserPayload {
  nombres: string
  primerApellido: string
  segundoApellido?: string
  email: string
  telefono?: string
  rol: 'administrador' | 'supervisor_almacen' | 'lectura'
}

export const authService = {
  login(payload: LoginPayload) {
    return apiClient.post<ApiResponse<LoginResponse>>('/auth/login', payload)
  },

  changePassword(payload: ChangePasswordPayload) {
    return apiClient.post<ApiResponse<LoginResponse>>('/auth/change-password', payload)
  },

  getProfile() {
    return apiClient.get<ApiResponse<AuthUser>>('/auth/profile')
  },
}

export const usersService = {
  getAll() {
    return apiClient.get<ApiResponse<UserListItem[]>>('/users')
  },

  create(payload: CreateUserPayload) {
    return apiClient.post<ApiResponse<CreateUserResponse>>('/users', payload)
  },

  toggleActive(userId: string) {
    return apiClient.patch<ApiResponse<{ id: string; activo: boolean }>>(`/users/${userId}/toggle-active`)
  },
}
