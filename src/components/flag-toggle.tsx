"use client";

import { useTransition } from "react";
import { Button } from "./ui/button";
import { toggleFlag } from "@/app/(admin)/actions";

export default function FlagToggle({
  id,
  initialValue,
}: {
  id: string;
  initialValue: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await toggleFlag(id);
    });
  };

  return (
    <Button
      variant="none"
      onClick={handleToggle}
      disabled={isPending}
      role="switch"
      aria-checked={initialValue}
      className={`relative inline-flex h-6 w-10 bg-flag-card-background-lv3 rounded-full items-center ${initialValue ? "bg-green-100" : ""} ${isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-flag-card-background-lv2 transition-transform ${
          initialValue ? "translate-x-2" : "-translate-x-2"
        }`}
      />
    </Button>
  );
}
