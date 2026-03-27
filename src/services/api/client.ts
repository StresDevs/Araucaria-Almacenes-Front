import { env } from '@/lib/env'
import type { ApiError } from '@/types'

const API_BASE_URL = env.apiUrl
const API_TIMEOUT_MS = 30_000

// ─── Custom Error ─────────────────────────────────────────────────────────────

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

// ─── Request helpers ──────────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions<TBody = unknown> {
  method?: HttpMethod
  body?: TBody
  headers?: Record<string, string>
  /** Override timeout in milliseconds */
  timeout?: number
}

async function request<TResponse, TBody = unknown>(
  endpoint: string,
  options: RequestOptions<TBody> = {},
): Promise<TResponse> {
  const { method = 'GET', body, headers = {}, timeout = API_TIMEOUT_MS } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  const requestHeaders: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...headers,
  }

  // Attach auth token if present
  const token = getAuthToken()
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body !== undefined ? (isFormData ? (body as BodyInit) : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorBody: ApiError = await response.json().catch(() => ({
        message: response.statusText,
        statusCode: response.status,
        success: false,
      }))

      // Si el token expiró o es inválido, limpiar sesión y redirigir a login
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        window.location.href = '/login'
      }

      throw new HttpError(
        response.status,
        errorBody.message,
        errorBody.code,
        errorBody.errors,
      )
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as unknown as TResponse
    }

    return response.json() as Promise<TResponse>
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof HttpError) throw error
    if ((error as Error).name === 'AbortError') {
      throw new HttpError(408, 'La solicitud tardó demasiado tiempo. Inténtalo de nuevo.')
    }
    throw new HttpError(0, 'Error de conexión. Verifique su conexión a internet.')
  }
}

// ─── Token management (replace with proper auth solution later) ───────────────

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

// ─── HTTP verb shortcuts ──────────────────────────────────────────────────────

export const apiClient = {
  get<TResponse>(endpoint: string, headers?: Record<string, string>): Promise<TResponse> {
    return request<TResponse>(endpoint, { method: 'GET', headers })
  },

  post<TResponse, TBody = unknown>(endpoint: string, body?: TBody, headers?: Record<string, string>): Promise<TResponse> {
    return request<TResponse, TBody>(endpoint, { method: 'POST', body, headers })
  },

  put<TResponse, TBody = unknown>(endpoint: string, body?: TBody, headers?: Record<string, string>): Promise<TResponse> {
    return request<TResponse, TBody>(endpoint, { method: 'PUT', body, headers })
  },

  patch<TResponse, TBody = unknown>(endpoint: string, body?: TBody, headers?: Record<string, string>): Promise<TResponse> {
    return request<TResponse, TBody>(endpoint, { method: 'PATCH', body, headers })
  },

  delete<TResponse>(endpoint: string, headers?: Record<string, string>): Promise<TResponse> {
    return request<TResponse>(endpoint, { method: 'DELETE', headers })
  },
}
