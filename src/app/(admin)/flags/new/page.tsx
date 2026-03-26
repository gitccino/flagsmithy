import { EnvironmentSwitcher } from '@/components/environment-switcher'
import { CreateFlagForm } from '@/components/create-flag-form'
import { getEnvironmentContext } from '@/lib/flags'

export default async function NewFlagPage({
  searchParams,
}: {
  searchParams: Promise<{ environment: string }>
}) {
  const { environment: requestedEnvironment } = await searchParams
  const { environments, activeEnvironment } =
    await getEnvironmentContext(requestedEnvironment)
  return (
    <main className="max-w-6xl w-full mx-auto p-8">
      <div className="flex flex-col items-start mb-6">
        <h1 className="text-2xl font-bold mb-6">Create New Feature Flag</h1>
        <EnvironmentSwitcher
          environments={environments}
          activeEnvironment={activeEnvironment}
          pathname="/flags/new"
        />
      </div>

      <CreateFlagForm
        environmentKey={activeEnvironment.key}
        activeEnvironmentName={activeEnvironment.name}
        cancelHref={`/?environment=${activeEnvironment.key}`}
      />
    </main>
  )
}
