'use client'

import { type FormEvent, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createSegmentCondition } from '@/app/(admin)/actions'
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
// import { SEGMENT_OPERATORS } from '@/lib/segments'
import { Plus } from 'lucide-react'
import { SEGMENT_OPERATORS } from '@/lib/constants/segment-operators'

interface AddSegmentConditionFormProps {
  segmentId: string
}

export function AddSegmentConditionForm({
  segmentId,
}: AddSegmentConditionFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const response = await runActionWithToast(
        createSegmentCondition(segmentId, formData),
        {
          loading: 'Creating condition...',
          success: (result) => result.message ?? 'Condition created',
          error: (result) => result.message,
        },
      )

      if (response.ok) {
        formRef.current?.reset()
        router.refresh()
      }
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="grid md:grid-cols-6 gap-3"
    >
      <div>
        <Label htmlFor="attribute" className="text-sm mb-1 font-medium">
          Attribute
        </Label>
        <Input
          id="attribute"
          name="attribute"
          placeholder="e.g., Plan"
          type="text"
          required
        />
      </div>

      <div>
        <Label htmlFor="operator" className="text-sm mb-1 font-medium">
          Operator
        </Label>
        <Select name="operator" defaultValue="equals">
          <SelectTrigger
            id="operator"
            className="w-full dark:bg-flag-card-background"
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
        <Label htmlFor="valueType" className="text-sm mb-1 font-medium">
          Value Type
        </Label>
        <Select name="valueType" defaultValue="string">
          <SelectTrigger
            id="valueType"
            className="w-full dark:bg-flag-card-background"
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
        <Label htmlFor="value" className="text-sm mb-1 font-medium">
          Value
        </Label>
        <Input
          type="text"
          id="value"
          name="value"
          placeholder="e.g., pro or TH"
        />
      </div>

      <div>
        <Label htmlFor="priority" className="text-sm mb-1 font-medium">
          priority
        </Label>
        <Input
          type="text"
          id="priority"
          name="priority"
          placeholder="e.g., 0, 1"
        />
      </div>

      <div className="self-end space-x-1">
        <Button
          type="submit"
          variant="default"
          size="icon-xl"
          disabled={isPending}
        >
          <Plus />
        </Button>
      </div>
    </form>
  )
}
