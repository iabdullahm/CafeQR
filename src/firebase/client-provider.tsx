"use client";

import type { ReactNode } from "react";

interface Props { children: ReactNode }

/**
 * No-op provider after Firebase removal. Used to wrap Firebase context
 * around the app; now just renders children.
 */
export function FirebaseClientProvider({ children }: Props) {
  return <>{children}</>;
}
