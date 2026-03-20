"use server";

import { db } from "@/lib/db";
import { flags } from "@/lib/db/schema";
import { eq, not } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createFlag(formData: FormData) {
  const key = formData.get("key") as string;
  const description = formData.get("description") as string;

  await db.insert(flags).values({
    key,
    description,
    isEnabled: false,
    strategy: { type: "boolean" },
  });

  // Tell Next.js to refresh the dashboard data
  revalidatePath("/");
  redirect("/");
}

export async function toggleFlag(id: string) {
  await db
    .update(flags)
    .set({ isEnabled: not(flags.isEnabled) })
    .where(eq(flags.id, id));

  // Clear the cache for the dashboard and any evaluation logic
  revalidatePath("/");
}

export async function deleteFlag(id: string) {
  await db.delete(flags).where(eq(flags.id, id));

  // Important: We should also clear the Redis cache for this key here
  // but for now, revalidatePath will refresh the server-side list
  revalidatePath("/");
}

export async function updateFlag(id: string, formData: FormData) {
  const description = formData.get("description") as string;
  const isEnabled = formData.get("isEnabled") === "on";
  const strategyType = formData.get("strategyType") as string;
  const strategyValue = formData.get("strategyValue")
    ? parseInt(formData.get("strategyValue") as string)
    : undefined;

  await db
    .update(flags)
    .set({
      description,
      isEnabled,
      strategy: {
        type: strategyType,
        ...(strategyValue !== undefined && { value: strategyValue }),
      },
    })
    .where(eq(flags.id, id));

  revalidatePath("/");
  redirect("/");
}
