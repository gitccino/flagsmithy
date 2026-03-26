import { db } from '.'
import { environments, flagEnvironments, flags, projects } from './schema'
import {
  DEFAULT_ENVIRONMENT_KEY,
  DEFAULT_PROJECT_KEY,
  DEFAULT_PROJECT_NAME,
  SYSTEM_ENVIRONMENTS,
} from '@/lib/flags'

async function seed() {
  console.log('🌱 Seeding database...')

  await db.delete(flagEnvironments)
  await db.delete(flags)
  await db.delete(environments)
  await db.delete(projects)

  const [project] = await db
    .insert(projects)
    .values({
      key: DEFAULT_PROJECT_KEY,
      name: DEFAULT_PROJECT_NAME,
    })
    .returning({ id: projects.id })

  const seededEnvironments = await db
    .insert(environments)
    .values(
      SYSTEM_ENVIRONMENTS.map((environment) => ({
        projectId: project.id,
        key: environment.key,
        name: environment.name,
      })),
    )
    .returning({
      id: environments.id,
      key: environments.key,
    })

  const [developmentEnvironment] = seededEnvironments.filter(
    (environment) => environment.key === DEFAULT_ENVIRONMENT_KEY,
  )

  const createdFlags = await db
    .insert(flags)
    .values([
      {
        projectId: project.id,
        key: 'new-user-onboarding',
        description: 'Shows the new 2026 onboarding flow to users',
      },
      {
        projectId: project.id,
        key: 'beta-search-v2',
        description: 'Enables the experimental AI search engine',
      },
      {
        projectId: project.id,
        key: 'discount-banner-rollout',
        description: 'Rolls out a 20% discount banner to half the users',
      },
    ])
    .returning({
      id: flags.id,
      key: flags.key,
    })

  await db.insert(flagEnvironments).values([
    {
      flagId: createdFlags.find((flag) => flag.key === 'new-user-onboarding')!
        .id,
      environmentId: developmentEnvironment.id,
      isEnabled: true,
      strategy: { type: 'boolean' },
    },
    {
      flagId: createdFlags.find((flag) => flag.key === 'beta-search-v2')!.id,
      environmentId: developmentEnvironment.id,
      isEnabled: false,
      strategy: { type: 'boolean' },
    },
    {
      flagId: createdFlags.find(
        (flag) => flag.key === 'discount-banner-rollout',
      )!.id,
      environmentId: developmentEnvironment.id,
      isEnabled: true,
      strategy: { type: 'percentage', value: 50 },
    },
  ])

  console.log('✅ Seeding finished!')
  process.exit(0)
}

seed()
