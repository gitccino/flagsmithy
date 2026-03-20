"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import InputToggle from "@/components/input-toggle";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import PercentageInput from "@/components/percentage-input";
import { cn } from "@/lib/utils";
import { updateFlag } from "@/app/(admin)/actions";
import type { SelectFlag } from "@/types";

interface EditFlagFormProps {
  flag: SelectFlag;
}

export default function EditFlagForm({ flag }: EditFlagFormProps) {
  const strategy = flag.strategy as { type: string; value?: number };
  const [strategyType, setStrategyType] = React.useState(strategy.type);

  // const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   const formData = new FormData(e.currentTarget);
  //   // Get all values and log them out
  //   const values: Record<string, any> = Object.fromEntries(formData.entries());
  //   // Also include checkbox manually as standard FormData.get() only gets 'on' for checked checkboxes
  //   values.isEnabled = formData.has("isEnabled");
  //   console.table(values);
  // };

  const updateFlagWithId = updateFlag.bind(null, flag.id);

  return (
    <form action={updateFlagWithId} className="space-y-6">
      <div>
        <Label htmlFor="description" className="mb-2 block">
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={flag.description ?? ""}
        />
      </div>

      <div className="flex items-center gap-3">
        <InputToggle
          id="isEnabled"
          name="isEnabled"
          defaultChecked={flag.isEnabled}
        />
        <Label htmlFor="isEnabled" className="cursor-pointer">
          Enable Flag Globally
        </Label>
      </div>

      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Rollout Strategy</h2>
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="strategyType"
              className="block text-sm font-medium mb-1"
            >
              Type
            </Label>

            <Select
              name="strategyType"
              value={strategyType}
              onValueChange={setStrategyType}
            >
              <SelectTrigger id="strategyType" className="w-full">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent className="ring-[#2e3033]">
                <SelectGroup>
                  <SelectItem value="boolean" className="h-10">
                    Boolean (Global)
                  </SelectItem>
                  <SelectItem value="percentage" className="h-10">
                    Percentage Rollout
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className={cn(strategyType !== "percentage" && "sr-only")}>
            <Label
              htmlFor="strategyValue"
              className="block text-sm font-medium mb-1"
            >
              Percentage (0-100)
            </Label>
            <PercentageInput
              id="strategyValue"
              name="strategyValue"
              defaultValue={strategy.value ?? 0}
              min="0"
              max="100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Only used for "Percentage Rollout" type
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" size="lg">
          Save Changes
        </Button>
        <Button variant="link" asChild>
          <Link href="/">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
