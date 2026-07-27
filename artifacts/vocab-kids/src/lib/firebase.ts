/**
 * Firebase initialization with graceful fallback.
 * All VITE_FIREBASE_* env vars must be set for Firebase to be active.
 * When not configured, the app works fully offline with localStorage only.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

function checkConfigured(): boolean {
  return requiredKeys.every((key) => {
    const val = import.meta.env[key];
    return typeof val === 'string' && val.trim().length > 0;
  });
}

export const isFirebaseConfigured: boolean = checkConfigured();

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;

if (isFirebaseConfigured) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL as string,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  };

  _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  _db = getFirestore(_app);
}

export const db: Firestore | null = _db;

