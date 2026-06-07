"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * No-op error emitter shim. Real Firestore error events no longer flow
 * through here, but the consumer component still subscribes, so keep the
 * API surface alive.
 */
export const errorEmitter = {
  on(_event: string, _handler: (...args: any[]) => void): void { void _event; void _handler; },
  off(_event: string, _handler: (...args: any[]) => void): void { void _event; void _handler; },
  emit(_event: string, ..._args: any[]): void { void _event; void _args; },
};
