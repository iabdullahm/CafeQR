/**
 * Legacy Firebase config. After the Firebase migration the values here are
 * inert — nothing actively initializes the SDK with them. Kept exported
 * because a handful of consumer-facing pages still import it; their reads
 * resolve to no-op stubs.
 */
export const firebaseConfig = {
  apiKey: "DEPRECATED",
  authDomain: "DEPRECATED",
  projectId: "DEPRECATED",
  storageBucket: "DEPRECATED",
  messagingSenderId: "DEPRECATED",
  appId: "DEPRECATED",
};
