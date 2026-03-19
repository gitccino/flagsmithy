import { db } from ".";
import { flags } from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  await db.insert(flags).values([
    {
      key: "new-user-onboarding",
      description: "Shows the new 2026 onboarding flow to users",
      isEnabled: true,
      strategy: { type: "boolean" },
    },
    {
      key: "beta-search-v2",
      description: "Enables the experimental AI search engine",
      isEnabled: false,
      strategy: { type: "boolean" },
    },
    {
      key: "discount-banner-rollout",
      description: "Rolls out a 20% discount banner to half the users",
      isEnabled: true,
      strategy: { type: "percentage", value: 50 },
    },
  ]);

  console.log("✅ Seeding finished!");
  process.exit(0);
}

seed();
