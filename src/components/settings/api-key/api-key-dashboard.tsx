import { db } from '@/lib/db'
import { DeleteApiKeyButton } from './delete-api-key-button'
import { apiKeys } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { CreateApiKeyForm } from './create-api-key-form'

type ApiKeyDashboardProps = {
  environmentId: string
  environmentKey: string
}

export async function ApiKeyDashboard({
  environmentId,
  environmentKey,
}: ApiKeyDashboardProps) {
  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.environmentId, environmentId))
    .orderBy(asc(apiKeys.createdAt))

  return (
    <section className="space-y-3 border rounded-xl p-6">
      <div className="flex justify-between">
        <div>
          <h2 className="text-lg font-semibold">API Keys</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Used by your SDK clients to authenticate flag evaluation requests.
          </p>
        </div>
        <CreateApiKeyForm environmentKey={environmentKey} />
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b text-xs">
            <th className="text-left px-2 py-4 text-muted-foreground font-medium">
              Key
            </th>
            <th className="text-left px-2 py-4 text-muted-foreground font-medium">
              Created By
            </th>
            <th className="text-left px-2 py-4 text-muted-foreground font-medium">
              Created At
            </th>
            <th className="text-left px-2 py-4 text-muted-foreground font-medium">
              Last Used At
            </th>
            <th className="text-right px-2 py-4 text-muted-foreground font-medium">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {keys.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="pt-6 pb-2 text-sm text-muted-foreground text-center"
              >
                No generated API keys yet
              </td>
            </tr>
          ) : (
            keys.map((k) => (
              <tr key={k.id} className="text-sm">
                <td className="px-2 py-4">
                  <div className="flex flex-col">
                    <span>{k.name}</span>
                    <span className="text-muted-foreground font-mono text-xs">
                      {k.keyPrefix}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-4">
                  <div className="flex flex-col">
                    <span>Supitcha Klanpradit</span>
                    <span className="text-muted-foreground text-xs">
                      supitchaklanpradit@outlook.com
                    </span>
                  </div>
                </td>
                <td className="px-2 py-4 text-muted-foreground">
                  {k.createdAt.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-2 py-4 text-muted-foreground">
                  {k.lastUsedAt
                    ? k.lastUsedAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Never used'}
                </td>
                <td className="text-right">
                  <DeleteApiKeyButton
                    id={k.id}
                    environmentKey={environmentKey}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  )
}
