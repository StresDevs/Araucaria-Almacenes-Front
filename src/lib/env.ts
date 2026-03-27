/**
 * Centralized environment variable access with runtime validation.
 * Import from this file instead of using process.env directly.
 */

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

export const env = {
  /** Base URL of the backend API, e.g. http://localhost:3001/api */
  apiUrl: optionalEnv('NEXT_PUBLIC_API_URL', ''),

  appName: optionalEnv('NEXT_PUBLIC_APP_NAME', 'Araucaria Almacenes'),
  appVersion: optionalEnv('NEXT_PUBLIC_APP_VERSION', '0.1.0'),

  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const

// Intentionally unused — call this in a Server Component or instrumentation
// to fail fast if required variables are missing before the app starts.
export function validateEnv(): void {
  requireEnv('NEXT_PUBLIC_API_URL')
}
