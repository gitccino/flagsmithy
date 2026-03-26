'use client'

import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteSegment } from '@/app/(admin)/actions'
import { runActionWithToast } from '@/lib/action-toast'
import { Loader, Trash2 } from 'lucide-react'

type DeleteSegmentButtonProps = {
  segmentId: string
}

export function DeleteSegmentButton({
  segmentId,
  className,
}: DeleteSegmentButtonProps & React.ComponentProps<'button'>) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (confirm('Delete this segment and all targeting rules that use it?')) {
      startTransition(async () => {
        const response = await runActionWithToast(deleteSegment(segmentId), {
          loading: 'Deleting segment...',
          success: (result) => result.message ?? 'Segment deleted',
          error: (result) => result.message,
        })

        if (response.ok) {
          router.refresh()
        }
      })
    }
  }

  return (
    <Button
      disabled={isPending}
      variant="destructive"
      size="lg"
      className={cn('', className)}
      onClick={handleDelete}
    >
      {isPending ? <Loader className="animate-spin" /> : <Trash2 />}
    </Button>
  )
}
