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
