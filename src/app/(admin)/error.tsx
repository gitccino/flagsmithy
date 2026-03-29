'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
      <p className="text-sm font-mono text-destructive">
        {error.digest ?? 'Something went wrong'}
      </p>
      <h2 className="text-xl font-semibold">An unexpected error occurred</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        This page failed to load. You can try again or go back to the dashboard.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="ghost" asChild>
          <a href="/">Dashboard</a>
        </Button>
      </div>
    </div>
  )
}
