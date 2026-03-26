'use client'

import { Loader, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteSegmentCondition } from '@/app/(admin)/actions'
import { runActionWithToast } from '@/lib/action-toast'

type DeleteSegmentConditionButtonProps = {
  conditionId: string
  segmentId: string
}

export function DeleteSegmentConditionButton({
  conditionId,
  segmentId,
}: DeleteSegmentConditionButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (confirm('Delete this condition from the segment?')) {
      startTransition(async () => {
        const response = await runActionWithToast(
          deleteSegmentCondition(conditionId, segmentId),
          {
            loading: 'Deleting condition...',
            success: (result) => result.message ?? 'Condition deleted',
            error: (result) => result.message,
          },
        )

        if (response.ok) {
          router.refresh()
        }
      })
    }
  }
  return (
    <Button
      type="button"
      variant="destructive"
      size="icon-xl"
      disabled={isPending}
      onClick={handleDelete}
    >
      {isPending ? <Loader className="animate-spin" /> : <Trash2 />}
    </Button>
  )
}
