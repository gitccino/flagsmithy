'use client'

import { useTransition } from 'react'
import { deleteApiKey } from '@/app/(admin)/settings/actions'
import { runActionWithToast } from '@/lib/action-toast'
import { Button } from '@/components/ui/button'
import { Ban, EllipsisVertical, Loader, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function DeleteApiKeyButton({
  id,
  environmentKey,
}: {
  id: string
  environmentKey: string
}) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (
      !confirm(
        'Delete this API key? Any apps using it will immediately lose access.',
      )
    )
      return

    startTransition(async () => {
      await runActionWithToast(deleteApiKey(id, environmentKey), {
        loading: 'Deleting key…',
        success: (r) => r.message ?? 'Key deleted',
        error: (r) => r.message,
      })
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghostBg" size="lg">
            <EllipsisVertical color="var(--muted-foreground)" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom" className="w-fit">
          <DropdownMenuGroup className="space-y-1">
            <DropdownMenuItem
              disabled={true}
              className="px-3 py-1.5 text-destructive dark:hover:bg-destructive/10  dark:hover:text-destructive"
            >
              <Ban color="var(--destructive)" />
              Disable API key
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isPending}
              onClick={handleDelete}
              className="px-3 py-1.5 text-destructive dark:hover:bg-destructive/10 dark:hover:text-destructive"
            >
              <Trash2 color="var(--destructive)" />
              Delete API key
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {/*<Button
        variant="destructive"
        size="icon-lg"
        disabled={isPending}
        onClick={handleDelete}
        className="text-muted-foreground hover:text-destructive"
        title="Delete key"
      >
        {isPending ? (
          <Loader size={14} className="animate-spin" />
        ) : (
          <Trash2 size={14} />
        )}
      </Button>*/}
    </>
  )
}
