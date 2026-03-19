import { createFlag } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function NewFlagPage() {
  return (
    <main className="max-w-2xl w-full mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Create New Feature Flag</h1>

      <form action={createFlag} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Flag Key (Unique)
          </label>
          <Input
            name="key"
            placeholder="e.g., enable-new-checkout"
            className="w-full border p-2 rounded-md font-mono"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Textarea
            name="description"
            placeholder="What does this feature do?"
            className="w-full border p-2 rounded-md"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            size="lg"
            className="bg-[#2A8DFF] text-white hover:bg-[#1b72f5] transition"
          >
            Create Flag
          </Button>
          <Button size="lg" variant="link" asChild>
            <a href="/" className="text-gray-600">
              Cancel
            </a>
          </Button>
        </div>
      </form>
    </main>
  );
}
