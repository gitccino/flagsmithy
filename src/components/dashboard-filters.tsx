'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Button } from './ui/button'
import { Eye, SlidersHorizontal } from 'lucide-react'
import { Select, SelectTrigger, SelectValue } from './ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

export function DashboardFilters() {
  return (
    <div className="w-full h-fit rounded-xl mb-6">
      {/* <Button variant="ghost" size="icon-lg" className="">
        <SlidersHorizontal />
      </Button> */}

      <DropdownMenu defaultOpen={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-lg" className="">
            <SlidersHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-fit">
          <DropdownMenuGroup className="">
            <DropdownMenuLabel>Manage Columns</DropdownMenuLabel>
            <DropdownMenuItem>Status</DropdownMenuItem>
            <DropdownMenuItem>Strategy</DropdownMenuItem>
            <DropdownMenuItem>Created</DropdownMenuItem>
            <DropdownMenuItem className="whitespace-nowrap">
              Last Evaluated
            </DropdownMenuItem>
          </DropdownMenuGroup>
          {/* <DropdownMenuSeparator /> */}
          {/* <DropdownMenuGroup>
            <DropdownMenuItem>Team</DropdownMenuItem>
            <DropdownMenuItem>Subscription</DropdownMenuItem>
          </DropdownMenuGroup> */}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function DropdownMenuItemComponent() {
  return (
    <>
      <Eye />
    </>
  )
}
