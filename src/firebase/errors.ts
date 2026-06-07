"use client";

/**
 * No-op shim for the legacy Firestore error class. After the Postgres
 * migration the runtime never throws this, but a consumer file still
 * imports the type for the FirebaseErrorListener.
 */
export class FirestorePermissionError extends Error {
  constructor(message?: string) {
    super(message ?? "FirestorePermissionError");
    this.name = "FirestorePermissionError";
  }
}
