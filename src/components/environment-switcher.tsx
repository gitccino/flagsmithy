'use client'

import type { SelectEnvironment } from '@/types'
import { Button } from './ui/button'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu'
import { ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEnvironmentHotkeys } from '@/hooks/use-environment-hotkeys'

type EnvironmentSwitcherProps = {
  environments: SelectEnvironment[]
  activeEnvironment: SelectEnvironment
  pathname: string
  variant?: 'dropdown' | 'switcher'
}

export function EnvironmentSwitcher({
  environments,
  activeEnvironment,
  pathname,
  variant = 'switcher',
}: EnvironmentSwitcherProps) {
  useEnvironmentHotkeys(environments, pathname)

  return (
    <>
      {variant === 'switcher' ? (
        <div className="flex items-center gap-2 rounded-xl bg-flag-card-background p-1">
          {environments.map((environment) => {
            const isActive = environment.key === activeEnvironment.key

            return (
              <Button
                key={environment.id}
                variant="none"
                size="lg"
                asChild
                className={cn(
                  isActive
                    ? 'bg-flag-card-background-lv2'
                    : 'bg-flag-card-background',
                  isActive &&
                    environment.name.toLowerCase() === 'development' &&
                    'bg-success/10 text-success border-success',
                  isActive &&
                    environment.name.toLowerCase() === 'production' &&
                    'bg-destructive/20 text-destructive border-destructive',
                  isActive &&
                    environment.name.toLowerCase() === 'staging' &&
                    'bg-[#302B1F] text-[#EAB306] border-[#EAB306]',
                )}
              >
                <Link href={`${pathname}?environment=${environment.key}`}>
                  {environment.name}
                </Link>
              </Button>
            )
          })}
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="none"
              size="lg"
              className={cn(
                'border border-border',
                activeEnvironment.name.toLowerCase() === 'development' &&
                  'bg-success/10 text-success border-success',
                activeEnvironment.name.toLowerCase() === 'production' &&
                  'bg-destructive/20 text-destructive border-destructive',
                activeEnvironment.name.toLowerCase() === 'staging' &&
                  'bg-[#302B1F] text-[#EAB306] border-[#EAB306]',
              )}
            >
              {activeEnvironment.name}
              <ChevronsUpDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-50">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Environments</DropdownMenuLabel>
              {environments.map((environment, index) => {
                return (
                  <DropdownMenuItem key={environment.key} asChild>
                    <Link href={`${pathname}?environment=${environment.key}`}>
                      <span className="flex-1">{environment.name}</span>
                      <DropdownMenuShortcut>^⌥{index + 1}</DropdownMenuShortcut>
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  )
}
