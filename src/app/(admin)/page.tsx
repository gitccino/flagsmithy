import { DeleteFlagButton } from '@/components/delete-flag-button'
import { EnvironmentSwitcher } from '@/components/environment-switcher'
import FlagToggle from '@/components/flag-toggle'
import { Button } from '@/components/ui/button'
import { getEnvironmentContext, listFlagsForEnvironment } from '@/lib/flags'
import { Pencil } from 'lucide-react'
import Link from 'next/link'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ environment?: string }>
}) {
  const { environment: requestedEnvironment } = await searchParams
  const { environments, activeEnvironment } =
    await getEnvironmentContext(requestedEnvironment)
  const { flags: allFlags } = await listFlagsForEnvironment(
    activeEnvironment.key,
  )

  return (
    <>
      <main className="max-w-6xl w-full mx-auto p-8 space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Feature Flags</h1>
            <p className="text-muted-foreground">
              Manage your application features in real-time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <EnvironmentSwitcher
              environments={environments}
              activeEnvironment={activeEnvironment}
              pathname="/"
              variant="dropdown"
            />
            <Button size="lg" asChild>
              <Link href={`/flags/new?environment=${activeEnvironment.key}`}>
                Create New Flag
              </Link>
            </Button>
          </div>
        </header>

        {/*<DashboardFilters />*/}

        <div className="rounded-xl overflow-hidden bg-[#1E2024]">
          <table className="w-full text-left">
            <thead className=" bg-[#26292D] border-b">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold">Flag Key</th>
                <th className="px-6 py-4 text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-sm font-semibold">Strategy</th>
                <th className="px-6 py-4 text-sm font-semibold">Created</th>
                <th
                  colSpan={2}
                  className="px-6 py-4 text-sm text-center font-semibold"
                >
                  Control
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {allFlags.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No flags found. Create your first flag to get started.
                  </td>
                </tr>
              ) : (
                allFlags.map((flag) => (
                  <tr
                    key={flag.id}
                    className="hover:bg-[#26292D] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span>{flag.key}</span>
                      <p className="text-xs text-gray-500 mt-1">
                        {flag.description}
                      </p>
                    </td>

                    <td className="px-6 py-4 min-w-32">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          flag.isEnabled
                            ? 'bg-success/10 text-success'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {flag.isEnabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 capitalize">
                        {flag.strategy.type || 'boolean'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500">
                      {flag.createdAt?.toLocaleDateString('en-US')}
                    </td>

                    <>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <FlagToggle
                            id={flag.id}
                            environmentKey={activeEnvironment.key}
                            initialValue={flag.isEnabled ?? false}
                          />
                          <span
                            className={`w-16 text-xs font-medium ${
                              flag.isEnabled
                                ? 'text-green-800'
                                : 'text-gray-500'
                            }`}
                          >
                            {flag.isEnabled ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 space-x-1 text-nowrap">
                        <Button variant="none" size="lg" asChild>
                          <Link
                            href={`/flags/${flag.id}/edit?environment=${activeEnvironment.key}`}
                            className="bg-flag-card-background-lv3/50 hover:bg-flag-card-background-lv3 transition-colors"
                          >
                            <Pencil />
                          </Link>
                        </Button>
                        <DeleteFlagButton id={flag.id} />
                      </td>
                    </>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
