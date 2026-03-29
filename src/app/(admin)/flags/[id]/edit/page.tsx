import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import EditFlagForm from '@/components/edit-flag-form'
import { getEnvironmentContext, getFlagForEnvironment } from '@/lib/flags'
import { EnvironmentSwitcher } from '@/components/environment-switcher'
import { FlagTargetingRules } from '@/components/flag-targeting-rules'
import {
  listRulesForFlagEnvironment,
  listSegmentsForProject,
} from '@/lib/segments'

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ environment?: string }>
}): Promise<Metadata> {
  const { id } = await params
  const { environment: requestedEnvironment } = await searchParams
  const { activeEnvironment } = await getEnvironmentContext(requestedEnvironment)
  const flag = await getFlagForEnvironment(id, activeEnvironment.key)
  return {
    title: flag ? `${flag.key} — Flagsmithy` : 'Edit Flag — Flagsmithy',
  }
}

export default async function EditFlagPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ environment?: string }>
}) {
  const { id } = await params
  const { environment: requestedEnvironment } = await searchParams
  const { environments, activeEnvironment } =
    await getEnvironmentContext(requestedEnvironment)
  const flag = await getFlagForEnvironment(id, activeEnvironment.key)

  if (!flag) notFound()
  /**
   * - All segments for the flag's project
   * - All rules for the flag's environment state, if the state exists
   */
  const [segments, rules] = await Promise.all([
    listSegmentsForProject(flag.projectId),
    flag.stateId
      ? listRulesForFlagEnvironment(flag.stateId)
      : Promise.resolve([]),
  ])

  return (
    <main className="max-w-6xl mx-auto p-8 space-y-8">
      <div className="flex flex-col items-start mb-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Edit Flag: {flag.key}</h1>
          <p className="text-sm text-gray-500 text-pretty">
            Description updates apply everywhere. <br />
            Status and strategy apply only to {activeEnvironment.name}.
          </p>
        </div>
        <EnvironmentSwitcher
          environments={environments}
          activeEnvironment={activeEnvironment}
          pathname={`/flags/${flag.id}/edit`}
        />
      </div>

      <section className="bg-flag-card-background p-6 rounded-xl">
        <EditFlagForm flag={flag} />
      </section>

      <FlagTargetingRules
        flagId={flag.id}
        environmentKey={flag.environmentKey}
        rules={rules}
        segments={segments}
      />
    </main>
  )
}
