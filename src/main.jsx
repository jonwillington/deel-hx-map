import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'

// Create QueryClient with cost-optimized settings for Mapbox geocoding
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Aggressive caching for expensive Mapbox geocoding calls
      staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days - property locations rarely change
      gcTime: 30 * 24 * 60 * 60 * 1000, // 30 days - keep expensive data longer
      retry: 3, // Retry failed expensive API calls
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Cost-aware error handling
      onError: (error, query) => {
        if (query.queryKey[0] === 'geocode') {
          console.error('💰 Mapbox geocoding failed (cost incurred):', error, 'for location:', query.queryKey[1])
        }
      }
    },
  },
})

// Export queryClient for use in utilities
export { queryClient }

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)