'use client'

import { LogOut, Settings } from 'lucide-react'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import type { UserSession } from '@/lib/auth'
import Link from 'next/link'
import { signOut } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

type ProfileMenuProps = {
  user: UserSession
}

export default function ProfileMenu({ user }: ProfileMenuProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.replace('/sign-in')
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="none"
          size="sm"
          className="group h-fit py-2 px-2 min-w-0 flex items-center"
        >
          <div className="max-w-30 flex flex-col items-end justify-center -space-y-0.5">
            <span className="truncate text-right text-xs">{user.name}</span>
            <span className="w-full truncate text-right text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
          <div className="group-hover:bg-flag-card-background transition-colors uppercase size-4 p-4 rounded-md border flex items-center justify-center">
            {user.name.slice(0, 1)}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="mr-2">
        <DropdownMenuGroup>
          <DropdownMenuItem className="px-3 py-1.5" asChild>
            <Link href="/settings" className="text-muted-foreground">
              <Settings /> Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleSignOut}
            className="px-3 py-1.5 text-muted-foreground"
          >
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
