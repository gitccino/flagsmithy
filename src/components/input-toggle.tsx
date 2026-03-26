'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputToggleProps = React.InputHTMLAttributes<HTMLInputElement>

const InputToggle = React.forwardRef<HTMLInputElement, InputToggleProps>(
  ({ className, disabled, ...props }, ref) => {
    return (
      <label
        className={cn(
          'relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-flag-card-background-lv2 transition-all',
          'has-checked:bg-[#86E89D]',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          className,
        )}
      >
        <input
          type="checkbox"
          role="switch"
          className="peer sr-only"
          disabled={disabled}
          ref={ref}
          {...props}
        />
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-all',
            '-translate-x-2 peer-checked:translate-x-2',
          )}
        />
      </label>
    )
  },
)

InputToggle.displayName = 'InputToggle'

export default InputToggle
