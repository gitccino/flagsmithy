'use client'

import { type FormEvent, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createFlag } from '@/app/(admin)/actions'
import { runActionWithToast } from '@/lib/action-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface CreateFlagFormProps {
  environmentKey: string
  activeEnvironmentName: string
  cancelHref: string
}

export function CreateFlagForm({
  environmentKey,
  activeEnvironmentName,
  cancelHref,
}: CreateFlagFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const response = await runActionWithToast(createFlag(formData), {
        loading: 'Creating flag...',
        success: (result) => result.message ?? 'Flag created',
        error: (result) => result.message,
      })

      if (response.ok && response.data) {
        router.push(response.data.redirectUrl)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="environmentKey" value={environmentKey} />

      <div>
        <label className="block text-sm font-medium mb-1">
          Flag Key (Unique)
        </label>
        <Input
          name="key"
          placeholder="e.g., enable-new-checkout"
          className="w-full border p-2 rounded-md font-mono"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Textarea
          name="description"
          placeholder="What does this feature do?"
          className="w-full border p-2 rounded-md"
        />
      </div>

      <div>
        <p className="text-sm text-gray-500 text-pretty">
          This creates the definition globally and the initial state in{' '}
          <span
            className={cn(
              activeEnvironmentName.toLowerCase() === 'development' &&
                'text-[#03E072]',
              activeEnvironmentName.toLowerCase() === 'production' &&
                'text-destructive',
              activeEnvironmentName.toLowerCase() === 'staging' &&
                'text-[#EAB306]',
            )}
          >
            {activeEnvironmentName}
          </span>{' '}
          environment
        </p>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" size="lg" disabled={isPending}>
          Create Flag
        </Button>
        <Button size="lg" variant="link" asChild>
          <a href={cancelHref} className="text-gray-600">
            Cancel
          </a>
        </Button>
      </div>
    </form>
  )
}
