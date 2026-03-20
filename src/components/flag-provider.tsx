"use client";

import { createContext, useContext } from "react";

type FlagContextType = Record<string, boolean>;

const FlagContext = createContext<FlagContextType>({});

export function FlagProvider({
  children,
  initialFlags,
}: {
  children: React.ReactNode;
  initialFlags: FlagContextType;
}) {
  return (
    <FlagContext.Provider value={initialFlags}>{children}</FlagContext.Provider>
  );
}

export function useFlag(key: string) {
  const context = useContext(FlagContext);
  return context[key] ?? false; // Default to false if flag is missing
}
