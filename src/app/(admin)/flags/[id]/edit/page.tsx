import { db } from "@/lib/db";
import { flags } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import EditFlagForm from "@/components/edit-flag-form";

export default async function EditFlagPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flag = await db.query.flags.findFirst({
    where: eq(flags.id, id),
  });

  if (!flag) notFound();

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Flag: {flag.key}</h1>
      <EditFlagForm flag={flag} />
    </main>
  );
}
