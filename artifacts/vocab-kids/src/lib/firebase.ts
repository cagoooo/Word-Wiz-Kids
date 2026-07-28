/**
 * Firebase initialization with graceful fallback.
 * All VITE_FIREBASE_* env vars must be set for Firebase to be active.
 * When not configured, the app works fully offline with localStorage only.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getDatabase, type Database } from 'firebase/database';
import { getAuth, signInAnonymously, type Auth, type User } from 'firebase/auth';

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
let _rtdb: Database | null = null;
let _auth: Auth | null = null;

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
  _rtdb = getDatabase(_app);
  _auth = getAuth(_app);
}

export const db: Firestore | null = _db;
export const rtdb: Database | null = _rtdb;
export const auth: Auth | null = _auth;

let anonymousAuthPromise: Promise<User> | null = null;

/** Ensure every arena device has a stable anonymous Firebase identity. */
export function ensureAnonymousAuth(): Promise<User> {
  if (!auth) return Promise.reject(new Error('即時對戰服務尚未完成設定'));
  if (anonymousAuthPromise) return anonymousAuthPromise;

  anonymousAuthPromise = (async () => {
    await auth.authStateReady();
    if (auth.currentUser) return auth.currentUser;
    const credential = await signInAnonymously(auth);
    return credential.user;
  })().catch((error) => {
    anonymousAuthPromise = null;
    throw error;
  });

  return anonymousAuthPromise;
}
