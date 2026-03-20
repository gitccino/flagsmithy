import { Button } from "@/components/ui/button";
import { FlagOff } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-4xl font-bold">Not Found</h2>
      </div>

      <p>Could not find requested resource</p>
      <Button variant="linkMuted" size="lg" asChild>
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}
