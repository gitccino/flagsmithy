'use client'

import { type FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { updateFlagEnvironmentRule } from '@/app/(admin)/actions'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ActionResponse } from '@/types'
import { runActionWithToast } from '@/lib/action-toast'
import {
  RULE_OUTCOME_TYPES,
  type RuleOutcomeType,
} from '@/lib/constants/rule-outcome'
import { DeleteFlagRuleButton } from '../delete-flag-rule-button'

type SegmentOption = {
  id: string
  name: string
}

type UpdateFlagRuleFormProps = {
  ruleId: string
  flagId: string
  environmentKey: string
  segmentId: string
  priority: number
  outcomeType: RuleOutcomeType
  percentageValue: number | null
  segmentOptions: SegmentOption[]
}

export function UpdateFlagRuleForm({
  ruleId,
  flagId,
  environmentKey,
  segmentId,
  priority,
  outcomeType,
  percentageValue,
  segmentOptions,
}: UpdateFlagRuleFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<ActionResponse | null>(null)

  const handleUpdateRule = (formData: FormData) => {
    startTransition(async () => {
      const response = await runActionWithToast(
        updateFlagEnvironmentRule(ruleId, flagId, environmentKey, formData),
        {
          loading: 'Updating rule...',
          success: (result) => result.message ?? 'Rule updated',
          error: (result) => result.message,
        },
      )

      setState(response)

      if (response.ok) {
        router.refresh()
      }
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleUpdateRule(new FormData(event.currentTarget))
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup className="grid gap-3 md:grid-cols-6">
        <Field className="md:col-span-2">
          <FieldLabel htmlFor={`segmentId-${ruleId}`}>Segment</FieldLabel>
          <Select name="segmentId" defaultValue={segmentId}>
            <SelectTrigger
              id={`segmentId-${ruleId}`}
              className="w-full dark:bg-flag-card-background-lv2"
            >
              <SelectValue placeholder="e.g., Pro Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {segmentOptions.map((segmentOption) => (
                  <SelectItem key={segmentOption.id} value={segmentOption.id}>
                    {segmentOption.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor={`priority-${ruleId}`}>Priority</FieldLabel>
          <Input
            id={`priority-${ruleId}`}
            name="priority"
            type="number"
            defaultValue={priority}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`outcomeType-${ruleId}`}>Outcome</FieldLabel>
          <Select name="outcomeType" defaultValue={outcomeType}>
            <SelectTrigger
              id={`outcomeType-${ruleId}`}
              className="w-full dark:bg-flag-card-background-lv2"
            >
              <SelectValue placeholder="e.g., enabled_on" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {RULE_OUTCOME_TYPES.map((nextOutcomeType) => (
                  <SelectItem key={nextOutcomeType} value={nextOutcomeType}>
                    {nextOutcomeType}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor={`percentageValue-${ruleId}`}>
            Percentage
          </FieldLabel>
          <Input
            id={`percentageValue-${ruleId}`}
            name="percentageValue"
            placeholder="e.g., 0-100"
            min="0"
            max="100"
            defaultValue={percentageValue ?? ''}
          />
        </Field>

        <div className="self-end space-x-1">
          <Button
            type="submit"
            variant="default"
            size="icon-xl"
            disabled={pending}
          >
            <Save />
          </Button>
          <DeleteFlagRuleButton
            ruleId={ruleId}
            flagId={flagId}
            environmentKey={environmentKey}
          />
        </div>

        {!state?.ok && state?.message ? (
          <p className="md:col-span-6 text-sm text-destructive">
            {state.message}
          </p>
        ) : null}
      </FieldGroup>
    </form>
  )
}
