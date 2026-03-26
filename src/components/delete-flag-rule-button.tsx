'use client'

import { Loader, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { useTransition } from 'react'
import { deleteFlagEnvironmentRule } from '@/app/(admin)/actions'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { runActionWithToast } from '@/lib/action-toast'

type DeleteFlagRuleButtonProps = {
  ruleId: string
  flagId: string
  environmentKey: string
}

export function DeleteFlagRuleButton({
  ruleId,
  flagId,
  environmentKey,
  className,
}: DeleteFlagRuleButtonProps & React.ComponentProps<'button'>) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (confirm('Delete this targeting rule?')) {
      startTransition(async () => {
        const response = await runActionWithToast(
          deleteFlagEnvironmentRule(ruleId, flagId, environmentKey),
          {
            loading: 'Deleting rule...',
            success: (result) => result.message ?? 'Rule deleted',
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
      disabled={isPending}
      variant="destructive"
      size="icon-xl"
      className={cn('', className)}
      onClick={handleDelete}
    >
      {isPending ? <Loader className="animate-spin" /> : <Trash2 />}
    </Button>
  )
}
