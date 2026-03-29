import Link from 'next/link'
import { Button } from './ui/button'
import {
  FlagEnvironmentRuleWithSegment,
  formatConditionValue,
  SegmentWithConditions,
} from '@/lib/segments'
import { Separator } from './ui/separator'
import { DeleteFlagRuleButton } from './delete-flag-rule-button'
import { CreateFlagRuleForm } from '@/components/flag/create-flag-rule-form'
import { UpdateFlagRuleForm } from '@/components/flag/update-flag-rule-form'

type FlagTargetingRulesProps = {
  flagId: string
  environmentKey: string
  rules: FlagEnvironmentRuleWithSegment[]
  segments: SegmentWithConditions[]
}

export function FlagTargetingRules({
  flagId,
  environmentKey,
  rules,
  segments,
}: FlagTargetingRulesProps) {
  const segmentOptions = segments.map((segment) => ({
    id: segment.id,
    name: segment.name,
  }))

  return (
    <section className="rounded-xl bg-flag-card-background p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold mb-1">Targeting Rules</h2>
          <p className="text-muted-foreground text-sm">
            The first matching rule wins. <br />
            If no rule matches, the fallback rollout strategy above is used.
          </p>
        </div>
        <Button size="lg" asChild>
          <Link href="/segments">Manage Segments</Link>
        </Button>
      </div>

      {segments.length === 0 ? (
        <p className="rounded-lg text-muted-foreground text-sm border border-dashed px-4 py-6">
          Create a segment first before adding targeting rules
        </p>
      ) : (
        <div className="space-y-6">
          <CreateFlagRuleForm
            flagId={flagId}
            environmentKey={environmentKey}
            rulesCount={rules.length}
            segments={segments}
          />

          <Separator />

          <div className="space-y-4">
            {rules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">
                No targeting rules yet. This flag currently used only the
                fallback strategy
              </p>
            ) : (
              rules.map((rule) => {
                return (
                  <div
                    key={rule.id}
                    className="rounded-lg bg-flag-card-background-lv2 p-4"
                  >
                    <div className="mb-4">
                      <h3 className="font-medium mb-1">{rule.segment.name}</h3>
                      <p className="text-muted-foreground text-sm">
                        {rule.segment.description}
                      </p>
                      <div className="mt-2 text-xs flex flex-wrap gap-2">
                        {rule.segment.conditions.map((condition) => (
                          <span
                            key={condition.id}
                            className="rounded-full bg-flag-card-background-lv3 px-3 py-1"
                          >
                            {condition.attribute} {condition.operator}{' '}
                            {condition.operator !== 'exists' &&
                            condition.operator !== 'not_exists'
                              ? ` ${formatConditionValue(condition.valueJson)}`
                              : ''}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <UpdateFlagRuleForm
                        ruleId={rule.id}
                        flagId={flagId}
                        environmentKey={environmentKey}
                        segmentId={rule.segmentId}
                        priority={rule.priority}
                        outcomeType={rule.outcomeType}
                        percentageValue={rule.percentageValue}
                        segmentOptions={segmentOptions}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </section>
  )
}
