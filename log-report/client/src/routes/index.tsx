import LogReport from '#/components/Log/LogReport'
import { createFileRoute } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/')({ component: Home })

const queryClient = new QueryClient()

function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-8">
        <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
        <p className="mt-4 text-lg">
        </p>
        <LogReport />
      </div>
    </QueryClientProvider>

  )
}
