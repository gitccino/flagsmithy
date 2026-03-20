"use client";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useTransition } from "react";
import { deleteFlag } from "@/app/(admin)/actions";
import { Loader, Trash2 } from "lucide-react";

type DeleteFlagButtonProps = {
  id: string;
};

export function DeleteFlagButton({
  id,
  className,
}: DeleteFlagButtonProps & React.ComponentProps<"button">) {
  const [isPending, startTransition] = useTransition();

  const handleDeleteFlag = () => {
    if (
      confirm(
        "Are you sure? This will immediately disable the feature for all users.",
      )
    ) {
      startTransition(() => deleteFlag(id));
    }
  };

  return (
    <Button
      disabled={isPending}
      variant="destructive"
      size="lg"
      className={cn("cursor-pointer", className)}
      onClick={handleDeleteFlag}
    >
      {isPending ? <Loader className="animate-spin" /> : <Trash2 />}
      {/* {isPending ? "Deleting..." : "Delete"} */}
    </Button>
  );
}
