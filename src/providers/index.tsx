import type { ReactNode } from 'react'
import { ThemeProvider } from './theme-provider'

interface AppProvidersProps {
  children: ReactNode
}

/**
 * Composes all app-level providers in one place.
 * Add new providers here (Auth, QueryClient, etc.) as the app grows.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  )
}
