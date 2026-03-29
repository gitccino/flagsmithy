'use client'

import { type FormEvent, useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createFlagEnvironmentRule } from '@/app/(admin)/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SegmentWithConditions } from '@/lib/segments'
import type { ActionResponse } from '@/types'
import { runActionWithToast } from '@/lib/action-toast'

export function CreateFlagRuleForm({
  flagId,
  environmentKey,
  rulesCount,
  segments,
}: {
  flagId: string
  environmentKey: string
  rulesCount: number
  segments: SegmentWithConditions[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<ActionResponse | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleCreateRule = (formData: FormData) => {
    startTransition(async () => {
      const response = await runActionWithToast(
        createFlagEnvironmentRule(flagId, environmentKey, formData),
        {
          loading: 'Creating rule...',
          success: (result) => result.message ?? 'Rule created',
          error: (result) => result.message,
        },
      )

      setState(response)

      if (response.ok) {
        formRef.current?.reset()
        router.refresh()
      }
    })
  }

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleCreateRule(new FormData(event.currentTarget))
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="grid md:grid-cols-6 gap-3"
    >
      <div className="md:col-span-2">
        <Label htmlFor="segmentId" className="mb-1 font-medium text-sm">
          Segment
        </Label>
        <Select
          name="segmentId"
          {...(segments[0] && { defaultValue: segments[0].id })}
        >
          <SelectTrigger
            id="segmentId"
            className="w-full dark:bg-flag-card-background"
          >
            <SelectValue placeholder="e.g., Pro Users" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {segments.map((segment) => (
                <SelectItem key={segment.id} value={segment.id}>
                  {segment.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="priority" className="mb-1 font-medium text-sm">
          Priority
        </Label>
        <Input
          id="priority"
          name="priority"
          type="number"
          defaultValue={rulesCount}
        />
      </div>

      <div>
        <Label htmlFor="outcomeType" className="mb-1 font-medium text-sm">
          Outcome
        </Label>
        <Select name="outcomeType" defaultValue="enabled_on">
          <SelectTrigger
            id="outcomeType"
            className="w-full dark:bg-flag-card-background"
          >
            <SelectValue placeholder="e.g., enabled_on" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="enabled_on">enabled_on</SelectItem>
              <SelectItem value="enabled_off">enabled_off</SelectItem>
              <SelectItem value="percentage">percentage</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="percentageValue" className="mb-1 font-medium text-sm">
          Percentage
        </Label>
        <Input
          id="percentageValue"
          name="percentageValue"
          min="0"
          max="100"
          placeholder="e.g., 0-100"
        />
      </div>

      <div className="self-end">
        <Button
          type="submit"
          variant="default"
          size="icon-xl"
          disabled={pending}
        >
          <Plus />
        </Button>
      </div>

      {!state?.ok && state?.message ? (
        <p className="md:col-span-6 text-sm text-destructive px-1">
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
