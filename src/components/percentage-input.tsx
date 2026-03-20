"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

export default function PercentageInput(
  props: React.ComponentProps<typeof Input>,
) {
  const handleInput = (e: React.InputEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const value = parseInt(input.value);

    if (value > 100) {
      input.value = "100";
    } else if (value < 0) {
      input.value = "0";
    }
  };

  return <Input {...props} type="number" onInput={handleInput} />;
}
