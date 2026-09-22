import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const config = {
  apiKey: import.meta.env['VITE_FIREBASE_API_KEY'] as string | undefined,
  authDomain: import.meta.env['VITE_FIREBASE_AUTH_DOMAIN'] as string | undefined,
  projectId: import.meta.env['VITE_FIREBASE_PROJECT_ID'] as string | undefined,
  storageBucket: import.meta.env['VITE_FIREBASE_STORAGE_BUCKET'] as string | undefined,
  messagingSenderId: import.meta.env['VITE_FIREBASE_MESSAGING_SENDER_ID'] as string | undefined,
  appId: import.meta.env['VITE_FIREBASE_APP_ID'] as string | undefined,
};

export const firebaseConfigured = Boolean(config.apiKey && config.authDomain && config.appId);

let app: FirebaseApp | null = null;

export function getFirebaseAuth(): Auth | null {
  if (typeof window === "undefined" || !firebaseConfigured) return null;
  if (!app) app = getApps().length ? getApp() : initializeApp(config as { apiKey: string; authDomain: string; appId: string });
  return getAuth(app);
}

export const googleProvider = new GoogleAuthProvider();
