import { apiClient } from '../api/client'
import type { ApiResponse, LoginResponse, AuthUser, CreateUserResponse, UserListItem, ResetPasswordResponse } from '@/types'

export interface LoginPayload {
  identifier: string
  password: string
}

export interface ChangePasswordPayload {
  newPassword: string
}

export interface CreateUserPayload {
  nombres: string
  primerApellido: string
  segundoApellido?: string
  email?: string
  sinCorreo?: boolean
  telefono?: string
  rol: 'administrador' | 'supervisor_almacen' | 'lectura'
}

export interface UpdateUserPayload {
  nombres?: string
  primerApellido?: string
  segundoApellido?: string
  email?: string
  username?: string
  telefono?: string
  rol?: 'administrador' | 'supervisor_almacen' | 'lectura'
}

export interface UpdateCredentialsPayload {
  email?: string
  username?: string
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

  update(userId: string, payload: UpdateUserPayload) {
    return apiClient.patch<ApiResponse<UserListItem>>(`/users/${userId}`, payload)
  },

  toggleActive(userId: string) {
    return apiClient.patch<ApiResponse<{ id: string; activo: boolean }>>(`/users/${userId}/toggle-active`)
  },

  resetPassword(userId: string) {
    return apiClient.patch<ApiResponse<ResetPasswordResponse>>(`/users/${userId}/reset-password`)
  },

  checkUsername(username: string) {
    return apiClient.get<ApiResponse<{ available: boolean }>>(`/users/check-username?username=${encodeURIComponent(username)}`)
  },

  updateMyCredentials(payload: UpdateCredentialsPayload) {
    return apiClient.patch<ApiResponse<UserListItem>>('/users/me/credentials', payload)
  },
}
