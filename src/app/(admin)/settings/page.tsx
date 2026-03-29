import { db } from '@/lib/db'
import { apiKeys, auditLogs, projects, users } from '@/lib/db/schema'
import { DEFAULT_PROJECT_KEY, getEnvironmentContext } from '@/lib/flags'
import { and, desc, eq, gte } from 'drizzle-orm'
import { AUDIT_ACTION_LABELS } from '@/lib/constants/audit-actions'
import { ApiKeyDashboard } from '@/components/settings/api-key/api-key-dashboard'
import { EnvironmentSwitcher } from '@/components/environment-switcher'
import { Separator } from '@/components/ui/separator'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    environment?: string
    auditEnvironment?: string
    auditAction?: string
    auditRange?: string
  }>
}) {
  const {
    environment: requestedEnvironment,
    auditEnvironment: requestedAuditEnvironment,
    auditAction: requestedAuditAction,
    auditRange: requestedAuditRange,
  } = await searchParams
  const { environments, activeEnvironment } =
    await getEnvironmentContext(requestedEnvironment)
  const auditEnvironmentFilter = requestedAuditEnvironment ?? 'all'
  const auditActionFilter = requestedAuditAction ?? 'all'
  const auditRangeFilter = requestedAuditRange ?? '7d'
  const now = new Date()
  const sinceDate =
    auditRangeFilter === '24h'
      ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
      : auditRangeFilter === '7d'
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        : auditRangeFilter === '30d'
          ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          : null

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
          status: auditLogs.status,
          environmentKey: auditLogs.environmentKey,
          resourceType: auditLogs.resourceType,
          resourceKey: auditLogs.resourceKey,
          createdAt: auditLogs.createdAt,
          userName: users.name,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(
          and(
            eq(auditLogs.projectId, project.id),
            auditEnvironmentFilter !== 'all'
              ? eq(auditLogs.environmentKey, auditEnvironmentFilter)
              : undefined,
            auditActionFilter !== 'all'
              ? eq(auditLogs.action, auditActionFilter)
              : undefined,
            sinceDate ? gte(auditLogs.createdAt, sinceDate) : undefined,
          ),
        )
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

      <ApiKeyDashboard
        environmentId={activeEnvironment.id}
        environmentKey={activeEnvironment.key}
      />

      {/* Audit Log */}
      <section className="space-y-3 border p-6 rounded-xl">
        <div>
          <h2 className="text-lg font-semibold">Audit Log</h2>
          <p className="text-sm text-muted-foreground">
            Last 20 changes made by your team.
          </p>
        </div>

        <form method="get" className="flex flex-wrap gap-3 items-end">
          <input
            type="hidden"
            name="environment"
            value={activeEnvironment.key}
          />
          <label className="text-xs text-muted-foreground flex flex-col gap-1">
            Audit environment
            <select
              name="auditEnvironment"
              defaultValue={auditEnvironmentFilter}
              className="border rounded-md bg-background px-2 py-1 text-sm text-foreground"
            >
              <option value="all">All environments</option>
              {environments.map((environment) => (
                <option key={environment.id} value={environment.key}>
                  {environment.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-muted-foreground flex flex-col gap-1">
            Action
            <select
              name="auditAction"
              defaultValue={auditActionFilter}
              className="border rounded-md bg-background px-2 py-1 text-sm text-foreground"
            >
              <option value="all">All actions</option>
              {Object.entries(AUDIT_ACTION_LABELS).map(([action, label]) => (
                <option key={action} value={action}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-muted-foreground flex flex-col gap-1">
            Time range
            <select
              name="auditRange"
              defaultValue={auditRangeFilter}
              className="border rounded-md bg-background px-2 py-1 text-sm text-foreground"
            >
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </label>

          <button
            type="submit"
            className="h-9 px-3 rounded-md border text-sm hover:bg-muted/30"
          >
            Apply filters
          </button>
        </form>

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
                  Environment
                </th>
                <th className="text-left px-2 py-4 text-muted-foreground font-medium">
                  Status
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
                    <td className="px-2 py-3">
                      {event.environmentKey ?? 'Project-wide'}
                    </td>
                    <td className="px-2 py-3">{event.status}</td>
                    <td className="px-2 py-3">{event.resourceKey}</td>
                    <td className="px-2 py-3">{event.userName ?? 'System'}</td>
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
