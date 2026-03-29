import { db } from '@/lib/db'
import { apiKeys, auditLogs, projects, users } from '@/lib/db/schema'
import { DEFAULT_PROJECT_KEY, getEnvironmentContext } from '@/lib/flags'
import { eq, desc } from 'drizzle-orm'
import { AUDIT_ACTION_LABELS } from '@/lib/constants/audit-actions'
import { ApiKeyDashboard } from '@/components/settings/api-key/api-key-dashboard'
import { EnvironmentSwitcher } from '@/components/environment-switcher'
import { Separator } from '@/components/ui/separator'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ environment?: string }>
}) {
  const { environment: requestedEnvironment } = await searchParams
  const { environments, activeEnvironment } =
    await getEnvironmentContext(requestedEnvironment)

  const [project] = await db
    .select({ id: projects.id, name: projects.name, key: projects.key })
    .from(projects)
    .where(eq(projects.key, DEFAULT_PROJECT_KEY))
    .limit(1)

  const recentEvents = project
    ? await db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          resourceType: auditLogs.resourceType,
          resourceKey: auditLogs.resourceKey,
          createdAt: auditLogs.createdAt,
          userName: users.name,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(eq(auditLogs.projectId, project.id))
        .orderBy(desc(auditLogs.createdAt))
        .limit(20)
    : []

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your project configuration.
          </p>
        </div>
        <EnvironmentSwitcher
          environments={environments}
          activeEnvironment={activeEnvironment}
          pathname="/settings"
          variant="dropdown"
        />
      </header>

      {/* General */}
      <section className="border rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold">General</h2>
        <div className="flex flex-row items-center text-sm">
          <div className="w-1/3">
            <p className="text-muted-foreground mb-1">Project name</p>
            <p>{project?.name ?? '—'}</p>
          </div>
          <div className="w-2/3">
            <p className="text-muted-foreground mb-1">Project key</p>
            <p>{project?.key ?? '—'}</p>
          </div>
        </div>
      </section>

      <ApiKeyDashboard environmentId={activeEnvironment.id} />

      {/* Audit Log */}
      <section className="space-y-3 border p-6 rounded-xl">
        <div>
          <h2 className="text-lg font-semibold">Audit Log</h2>
          <p className="text-sm text-muted-foreground">
            Last 20 changes made by your team.
          </p>
        </div>

        {recentEvents.length === 0 ? (
          <>
            <Separator />
            <p className="text-center text-sm text-muted-foreground p-6">
              No activity yet.
            </p>
          </>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-xs">
                <th className="text-left px-2 py-4 text-muted-foreground font-medium">
                  Time
                </th>
                <th className="text-left px-2 py-4 text-muted-foreground font-medium">
                  Actions
                </th>
                <th className="text-left px-2 py-4 text-muted-foreground font-medium">
                  Resource Key
                </th>
                <th className="text-left px-2 py-4 text-muted-foreground font-medium">
                  Performed by
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentEvents.map((event) => {
                const label =
                  AUDIT_ACTION_LABELS[
                    event.action as keyof typeof AUDIT_ACTION_LABELS
                  ] ?? event.action
                return (
                  <tr
                    key={event.id}
                    className="text-muted-foreground text-xs border-muted-foreground/5"
                  >
                    <td className="px-2 py-3">
                      {event.createdAt.toLocaleString()}
                    </td>
                    <td className="px-2 py-3 text-foreground">{label}</td>
                    <td className="px-2 py-3">{event.resourceKey}</td>
                    <td className="px-2 py-3">
                      {event.userName ?? 'System'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
