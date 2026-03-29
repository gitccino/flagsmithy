'use client'

import { useHotkeys } from '@tanstack/react-hotkeys'
import type { RegisterableHotkey } from '@tanstack/hotkeys'
import { useRouter } from 'next/navigation'
import type { SelectEnvironment } from '@/types'

/**
 * Registers Ctrl+Alt+{1-9} hotkeys to switch environments.
 * Matches the shortcut hints shown in the EnvironmentSwitcher dropdown (^⌥1, ^⌥2, …).
 */
export function useEnvironmentHotkeys(
  environments: SelectEnvironment[],
  pathname: string,
) {
  const router = useRouter()

  useHotkeys(
    environments.slice(0, 9).map((env, index) => ({
      hotkey: `Control+Alt+${index + 1}` as RegisterableHotkey,
      callback: () => router.push(`${pathname}?environment=${env.key}`),
    })),
  )
}
