'use client'

import { type FormEvent, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateSegment } from '@/app/(admin)/actions'
import { runActionWithToast } from '@/lib/action-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

interface UpdateSegmentFormProps {
  segmentId: string
  name: string
  description: string | null
}

export function UpdateSegmentForm({
  segmentId,
  name,
  description,
}: UpdateSegmentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const response = await runActionWithToast(
        updateSegment(segmentId, formData),
        {
          loading: 'Saving segment...',
          success: (result) => result.message ?? 'Segment updated',
          error: (result) => result.message,
        },
      )

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
        <Input id="name" name="name" type="text" defaultValue={name} required />
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="description" className="mb-1 font-medium text-sm">
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={description ?? ''}
        />
      </div>

      <div className="space-x-4">
        <Button type="submit" size="lg" disabled={isPending}>
          Save Segment
        </Button>
        <Button variant="link" asChild>
          <Link href="/segments">Back to Segments</Link>
        </Button>
      </div>
    </form>
  )
}
