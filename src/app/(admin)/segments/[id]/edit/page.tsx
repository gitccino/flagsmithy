import { DEFAULT_ENVIRONMENT_KEY, getEnvironmentContext } from '@/lib/flags'
import { getSegmentForProject, listRulesForSegment } from '@/lib/segments'
import { UpdateSegmentForm } from '@/components/segment/update-segment-form'
import { AddSegmentConditionForm } from '@/components/segment/add-segment-condition-form'
import { EditSegmentConditionForm } from '@/components/segment/edit-segment-condition-form'
import { notFound } from 'next/navigation'
import { Separator } from '@/components/ui/separator'

export default async function EditSegmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { activeEnvironment } = await getEnvironmentContext(
    DEFAULT_ENVIRONMENT_KEY,
  )
  const segment = await getSegmentForProject(id, activeEnvironment.projectId)

  if (!segment) {
    notFound()
  }

  const rules = await listRulesForSegment(segment.id)

  return (
    <main className="max-w-6xl w-full mx-auto p-8 space-y-8">
      <header>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Segment: {segment.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            This segment is currently referenced by {rules.length} targeting
            rule{rules.length === 1 && 's'}
          </p>
        </div>
      </header>

      <section className="bg-flag-card-background rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Segment Details</h2>
        <UpdateSegmentForm
          segmentId={segment.id}
          name={segment.name}
          description={segment.description}
        />
      </section>

      <section className="rounded-xl overflow-hidden bg-flag-card-background p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Conditions</h2>
          <p className="text-muted-foreground text-sm">
            All conditions in this segment must match (Priority only controls
            order)
          </p>
        </div>

        <AddSegmentConditionForm segmentId={segment.id} />

        <Separator />

        <div className="space-y-4">
          {segment.conditions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center">
              No conditions yet. Add one to define this audience.
            </p>
          ) : (
            segment.conditions.map((condition) => (
              <div
                key={condition.id}
                className="rounded-lg bg-flag-card-background-lv2 p-4"
              >
                <EditSegmentConditionForm
                  condition={condition}
                  segmentId={segment.id}
                />
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  )
}
