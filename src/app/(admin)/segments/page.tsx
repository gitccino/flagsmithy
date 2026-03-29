import { Button } from '@/components/ui/button'
import { DEFAULT_ENVIRONMENT_KEY, getEnvironmentContext } from '@/lib/flags'
import { listSegmentsForProject } from '@/lib/segments'
import { CreateSegmentForm } from '@/components/create-segment-form'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { DeleteSegmentButton } from '@/components/delete-segment-button'

export default async function SegmentsPage() {
  const { activeEnvironment } = await getEnvironmentContext(
    DEFAULT_ENVIRONMENT_KEY,
  )
  const segments = await listSegmentsForProject(activeEnvironment.projectId)

  return (
    <main className="max-w-6xl w-full mx-auto p-8 space-y-8">
      <header>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Segments</h1>
          <p className="text-muted-foreground">
            Reusable audience definitions shared across all environments in this
            project.
          </p>
        </div>
      </header>

      <section className="bg-flag-card-background rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Create Segments</h2>
        <CreateSegmentForm />
      </section>

      <section className="rounded-xl overflow-hidden bg-flag-card-background">
        <table className="w-full text-left">
          <thead className="bg-flag-card-background-lv2 border-b">
            <tr>
              <th className="table-header-cell">Name</th>
              <th className="table-header-cell">Conditions</th>
              <th className="table-header-cell">Updated</th>
              <th className="table-header-cell text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {segments.length === 0 ? (
              <tr className="col-span-4 ">
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  No segments yet. Create your first audience definition.
                </td>
              </tr>
            ) : (
              segments.map((segment) => (
                <tr
                  key={segment.id}
                  className="hover:bg-flag-card-background-lv2 transition-colors"
                >
                  <td className="table-body-cell">
                    <span className="font-medium">{segment.name}</span>
                    <p className="text-muted-foreground text-xs mt-1">
                      {segment.description || 'No description'}
                    </p>
                  </td>

                  <td className="table-body-cell text-sm text-muted-foreground">
                    {segment.conditions.length}
                  </td>

                  <td className="table-body-cell text-sm text-muted-foreground">
                    {segment.updatedAt.toLocaleDateString()}
                  </td>

                  <td className="table-body-cell">
                    <div className="flex justify-center flex-nowrap gap-1">
                      <Button variant="none" size="lg" asChild>
                        <Link
                          href={`/segments/${segment.id}/edit`}
                          className="bg-flag-card-background-lv3/50 hover:bg-flag-card-background-lv3 transition-colors"
                        >
                          <Pencil />
                        </Link>
                      </Button>
                      <DeleteSegmentButton segmentId={segment.id} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  )
}
