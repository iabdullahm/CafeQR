"use client";

/**
 * No-op error emitter shim. Real Firestore error events no longer flow
 * through here (Postgres replaces Firestore entirely), but the consumer
 * component still imports and subscribes, so keep the API surface alive.
 */
type Handler = (..._args: unknown[]) => void;

export const errorEmitter = {
  on(_event: string, _handler: Handler): void { void _event; void _handler; },
  off(_event: string, _handler: Handler): void { void _event; void _handler; },
  emit(_event: string, ..._args: unknown[]): void { void _event; void _args; },
};
