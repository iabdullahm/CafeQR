"use client";

/**
 * Firebase compatibility shim (post Firestore + Auth migration).
 *
 * src/firebase/ used to initialize the Firebase JS SDK and expose
 * useUser, useFirestore, useCollection, useDoc etc. After Phases 1-4c
 * every page reads from Postgres via /api/* — so this directory is now
 * a stub: imports resolve, hooks return null/empty, the firebase package
 * itself is no longer required.
 *
 * 40+ files still import from '@/firebase'; preserving the export
 * surface here keeps the build green while we phase those imports out.
 */

export function initializeFirebase() {
  return { firebaseApp: null, auth: null, firestore: null };
}

export function getSdks() {
  return { firebaseApp: null, auth: null, firestore: null };
}

export * from "./provider";
export * from "./client-provider";
export * from "./firestore/use-collection";
export * from "./firestore/use-doc";
export * from "./non-blocking-updates";
export * from "./non-blocking-login";
export * from "./errors";
export * from "./error-emitter";
