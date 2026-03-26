'use client'

import { type FormEvent, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateSegmentCondition } from '@/app/(admin)/actions'
import { runActionWithToast } from '@/lib/action-toast'
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
import { DeleteSegmentConditionButton } from '@/components/delete-segment-condition-button'
import {
  formatConditionValue,
  inferConditionValueType,
  // SEGMENT_OPERATORS,
  type SegmentConditionRecord,
} from '@/lib/segments'
import { SEGMENT_OPERATORS } from '@/lib/constants/segment-operators'
import { Save } from 'lucide-react'

interface EditSegmentConditionFormProps {
  condition: SegmentConditionRecord
  segmentId: string
}

export function EditSegmentConditionForm({
  condition,
  segmentId,
}: EditSegmentConditionFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const response = await runActionWithToast(
        updateSegmentCondition(condition.id, segmentId, formData),
        {
          loading: 'Saving condition...',
          success: (result) => result.message ?? 'Condition updated',
          error: (result) => result.message,
        },
      )

      if (response.ok) {
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid md:grid-cols-6 gap-3">
      <div>
        <Label
          htmlFor={`attribute-${condition.id}`}
          className="text-sm mb-1 font-medium"
        >
          Attribute
        </Label>
        <Input
          id={`attribute-${condition.id}`}
          name="attribute"
          defaultValue={condition.attribute}
          placeholder="e.g., Plan"
          type="text"
          required
        />
      </div>

      <div>
        <Label
          htmlFor={`operator-${condition.id}`}
          className="text-sm mb-1 font-medium"
        >
          Operator
        </Label>
        <Select name="operator" defaultValue={condition.operator}>
          <SelectTrigger
            id={`operator-${condition.id}`}
            className="w-full dark:bg-flag-card-background-lv2"
          >
            <SelectValue placeholder="e.g., equals" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {SEGMENT_OPERATORS.map((operator) => (
                <SelectItem key={operator} value={operator}>
                  {operator}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label
          htmlFor={`valueType-${condition.id}`}
          className="text-sm mb-1 font-medium"
        >
          Value Type
        </Label>
        <Select
          name="valueType"
          defaultValue={inferConditionValueType(condition.valueJson)}
        >
          <SelectTrigger
            id={`valueType-${condition.id}`}
            className="w-full dark:bg-flag-card-background-lv2"
          >
            <SelectValue placeholder="e.g., string" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="string">string</SelectItem>
              <SelectItem value="number">number</SelectItem>
              <SelectItem value="boolean">boolean</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label
          htmlFor={`value-${condition.id}`}
          className="text-sm mb-1 font-medium"
        >
          Value
        </Label>
        <Input
          type="text"
          id={`value-${condition.id}`}
          name="value"
          placeholder="e.g., pro or TH"
          defaultValue={formatConditionValue(condition.valueJson)}
        />
      </div>

      <div>
        <Label
          htmlFor={`priority-${condition.id}`}
          className="text-sm mb-1 font-medium"
        >
          priority
        </Label>
        <Input
          type="number"
          id={`priority-${condition.id}`}
          name="priority"
          placeholder="e.g., 0, 1"
          defaultValue={condition.priority}
        />
      </div>

      <div className="self-end space-x-1">
        <Button
          type="submit"
          variant="default"
          size="icon-xl"
          disabled={isPending}
        >
          <Save />
        </Button>
        <DeleteSegmentConditionButton
          conditionId={condition.id}
          segmentId={segmentId}
        />
      </div>
    </form>
  )
}
