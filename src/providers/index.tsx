import type { ReactNode } from 'react'
import { ThemeProvider } from './theme-provider'
import { AuthProvider } from './auth-provider'

interface AppProvidersProps {
  children: ReactNode
}

/**
 * Composes all app-level providers in one place.
 * Add new providers here (QueryClient, etc.) as the app grows.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  )
}
