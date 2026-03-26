'use client'

import { type FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import InputToggle from '@/components/input-toggle'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import PercentageInput from '@/components/percentage-input'
import { cn } from '@/lib/utils'
import { updateFlag } from '@/app/(admin)/actions'
import { runActionWithToast } from '@/lib/action-toast'
import type { SelectAdminFlag } from '@/types'

interface EditFlagFormProps {
  flag: SelectAdminFlag
}

export default function EditFlagForm({ flag }: EditFlagFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const strategy = flag.strategy
  const [strategyType, setStrategyType] = useState(strategy.type)
  const strategyValue = strategy.type === 'percentage' ? strategy.value : 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const response = await runActionWithToast(
        updateFlag(flag.id, flag.environmentKey, formData),
        {
          loading: 'Saving changes...',
          success: (result) => result.message ?? 'Flag updated',
          error: (result) => result.message,
        },
      )

      if (response.ok) {
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="description" className="mb-2 block">
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={flag.description ?? ''}
        />
      </div>

      <div className="flex items-center gap-3">
        <InputToggle
          id="isEnabled"
          name="isEnabled"
          defaultChecked={flag.isEnabled}
        />
        <Label htmlFor="isEnabled" className="cursor-pointer">
          Enable Flag Globally
        </Label>
      </div>

      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Rollout Strategy</h2>
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="strategyType"
              className="block text-sm font-medium mb-1"
            >
              Type
            </Label>

            <Select
              name="strategyType"
              value={strategyType}
              onValueChange={(value) =>
                setStrategyType(value as typeof strategy.type)
              }
            >
              <SelectTrigger id="strategyType" className="w-full">
                <SelectValue placeholder="e.g., Boolean (Global)" />
              </SelectTrigger>
              <SelectContent className="ring-[#2e3033]">
                <SelectGroup>
                  <SelectItem value="boolean" className="h-10">
                    Boolean (Global)
                  </SelectItem>
                  <SelectItem value="percentage" className="h-10">
                    Percentage Rollout
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className={cn(strategyType !== 'percentage' && 'sr-only')}>
            <Label
              htmlFor="strategyValue"
              className="block text-sm font-medium mb-1"
            >
              Percentage (0-100)
            </Label>
            <PercentageInput
              id="strategyValue"
              name="strategyValue"
              defaultValue={strategyValue}
              min="0"
              max="100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Only used for "Percentage Rollout" type
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" size="lg" disabled={isPending}>
          Save Changes
        </Button>
        <Button variant="link" asChild>
          <Link href={`/?environment=${flag.environmentKey}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
