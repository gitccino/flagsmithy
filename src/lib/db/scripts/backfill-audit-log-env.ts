import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

type CountRow = { count: string | number }

function toNumber(value: string | number | undefined) {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number.parseInt(value, 10)
  return 0
}

async function selectCount(query: ReturnType<typeof sql>) {
  const result = await db.execute<CountRow>(query)
  return toNumber(result.rows[0]?.count)
}

async function backfill() {
  const dryRun = process.argv.includes('--dry-run')

  const scanned = await selectCount(
    sql`select count(*)::int as count from audit_logs where environment_key is null`,
  )

  const canBackfillKey = await selectCount(
    sql`
      select count(*)::int as count
      from audit_logs
      where environment_key is null
        and nullif(trim(metadata->>'environment'), '') is not null
    `,
  )

  const updatedEnvironmentKey = dryRun
    ? 0
    : await selectCount(sql`
        with updated as (
          update audit_logs
          set environment_key = trim(metadata->>'environment')
          where environment_key is null
            and nullif(trim(metadata->>'environment'), '') is not null
          returning id
        )
        select count(*)::int as count from updated
      `)

  const updatedEnvironmentId = dryRun
    ? 0
    : await selectCount(sql`
        with updated as (
          update audit_logs as al
          set environment_id = e.id
          from environments as e
          where al.environment_id is null
            and al.environment_key is not null
            and al.project_id = e.project_id
            and al.environment_key = e.key
          returning al.id
        )
        select count(*)::int as count from updated
      `)

  const unknown = await selectCount(
    sql`select count(*)::int as count from audit_logs where environment_key is null`,
  )

  console.log('audit_logs environment backfill summary')
  console.log(`dry_run: ${dryRun}`)
  console.log(`scanned: ${scanned}`)
  console.log(`eligible_for_environment_key: ${canBackfillKey}`)
  console.log(`updated_environment_key: ${updatedEnvironmentKey}`)
  console.log(`updated_environment_id: ${updatedEnvironmentId}`)
  console.log(`unknown_remaining: ${unknown}`)
}

backfill()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('backfill_failed', error)
    process.exit(1)
  })
