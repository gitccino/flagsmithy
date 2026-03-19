import FlagToggle from "@/components/flag-toggle";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { flags } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  // Fetch flags sorted by most recent
  const allFlags = await db.select().from(flags).orderBy(desc(flags.createdAt));
  // const allFlags = [];

  return (
    <main className="max-w-6xl w-full mx-auto p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature Flags</h1>
          <p className="text-gray-500">
            Manage your application features in real-time
          </p>
        </div>
        <div>
          <Button size="lg" asChild>
            <Link href="/new">+ Create Flag</Link>
          </Button>
        </div>
      </header>

      <div className="rounded-xl overflow-hidden bg-[#1E2024]">
        <table className="w-full text-left">
          <thead className=" bg-[#26292D] border-b">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold">Flag Key</th>
              <th className="px-6 py-4 text-sm font-semibold">Status</th>
              <th className="px-6 py-4 text-sm font-semibold">Strategy</th>
              <th className="px-6 py-4 text-sm font-semibold">Created</th>
              <th className="px-6 py-4 text-sm font-semibold">Control</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {allFlags.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No flags found. Create your first flas to get started.
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
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        flag.isEnabled
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {flag.isEnabled ? "Active" : "Disabled"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 capitalize">
                      {(flag.strategy as any)?.type || "boolean"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {flag.createdAt?.toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FlagToggle
                        id={flag.id}
                        initialValue={flag.isEnabled ?? false}
                      />
                      <span
                        className={`w-16 text-xs font-medium ${
                          flag.isEnabled ? "text-green-800" : "text-gray-500"
                        }`}
                      >
                        {flag.isEnabled ? "Active" : "Disabled"}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
