'use client'

import { type FormEvent, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createSegment } from '@/app/(admin)/actions'
import { runActionWithToast } from '@/lib/action-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function CreateSegmentForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const response = await runActionWithToast(createSegment(formData), {
        loading: 'Creating segment...',
        success: (result) => result.message ?? 'Segment created',
        error: (result) => result.message,
      })

      if (response.ok) {
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <div>
        <Label htmlFor="name" className="mb-1 font-medium text-sm">
          Name
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Pro Users"
          required
        />
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="description" className="mb-1 font-medium text-sm">
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Users on paid plans who should receive premium features."
        />
      </div>

      <div>
        <Button type="submit" size="lg" disabled={isPending}>
          Create Segment
        </Button>
      </div>
    </form>
  )
}
