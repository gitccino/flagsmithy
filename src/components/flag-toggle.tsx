'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { toggleFlag } from '@/app/(admin)/actions'
import { runActionWithToast } from '@/lib/action-toast'

export default function FlagToggle({
  id,
  environmentKey,
  initialValue,
}: {
  id: string
  environmentKey: string
  initialValue: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      const response = await runActionWithToast(
        toggleFlag(id, environmentKey),
        {
          loading: 'Toggling...',
          success: (result) => result.message ?? 'Flag toggled',
          error: (result) => result.message,
        },
      )

      if (response.ok) {
        router.refresh()
      }
    })
  }

  return (
    <Button
      variant="none"
      onClick={handleToggle}
      disabled={isPending}
      role="switch"
      aria-checked={initialValue}
      className={`relative inline-flex h-6 w-10 bg-flag-card-background-lv3 rounded-full items-center ${initialValue ? 'bg-green-100' : ''} ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-flag-card-background-lv2 transition-transform ${
          initialValue ? 'translate-x-2' : '-translate-x-2'
        }`}
      />
    </Button>
  )
}
