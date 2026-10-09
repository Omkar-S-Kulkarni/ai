// ============================================================
// App Root
// src/App.tsx
// ============================================================

import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/queryClient'
import { PokemonProvider } from '@/context/PokemonContext'
import { AppRouter } from '@/app/Router'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PokemonProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </PokemonProvider>
      {/* React Query Devtools — only in development */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

export default App
