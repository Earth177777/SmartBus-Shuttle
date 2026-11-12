// Firebase project for live sync (stop screens on phones, data for BigQuery).
// Leave as null to run fully offline. To connect, either paste the web app config from
// Firebase console → Project settings → Your apps, or set VITE_FIREBASE_* env vars.
// Firestore rules should allow writes only to the demo collections (see README).
const env = import.meta.env ?? {};

export const firebaseConfig = env.VITE_FIREBASE_PROJECT_ID
  ? {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    }
  : null;

// Local Firestore emulator ("host:port"), for testing without a real project.
export const firestoreEmulator = env.VITE_FIRESTORE_EMULATOR || null;
