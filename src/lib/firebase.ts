import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInAnonymously, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, enableMultiTabIndexedDbPersistence, getDocs, getDocsFromCache, setLogLevel } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

// Resolved configuration for Firebase project: vionex-d7055
const resolvedApiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || firebaseConfig.apiKey || '';

export const isFirebaseConfigured = Boolean(resolvedApiKey && firebaseConfig.projectId);

let appInstance: any = null;
let dbInstance: any = null;
let authInstance: any = null;
let messagingInstance: any = null;

if (isFirebaseConfigured) {
  try {
    appInstance = initializeApp({
      ...firebaseConfig,
      apiKey: resolvedApiKey
    });
    dbInstance = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)')
      ? getFirestore(appInstance, firebaseConfig.firestoreDatabaseId)
      : getFirestore(appInstance);
    authInstance = getAuth(appInstance);
    
    // Suppress offline connection warnings
    setLogLevel('silent');

    // Enable offline persistence
    enableMultiTabIndexedDbPersistence(dbInstance).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence failed: Browser not supported');
      }
    });

    try {
      messagingInstance = getMessaging(appInstance);
    } catch (e) {
      console.warn("Firebase Messaging is not supported or blocked in this environment:", e);
    }
  } catch (err) {
    console.warn("[Firebase] Initialization error:", err);
  }
} else {
  console.log("[Firebase] Notice: Firebase Web API Key is not yet configured in local config. Operating in local/offline mode.");
}

export const app = appInstance;
export const db = dbInstance;
export const auth = authInstance;
export const messaging = messagingInstance;

let anonymousAuthPromise: Promise<any> | null = null;
let isExplicitAuthInProgress = false;

/**
 * Flag to indicate an explicit user login (email/password, admin, etc.) is currently in progress.
 * While this is true, ensureAnonymousAuth will NEVER initiate an anonymous session.
 */
export function setExplicitAuthInProgress(inProgress: boolean) {
  isExplicitAuthInProgress = inProgress;
}

export function isAuthActionPending(): boolean {
  return isExplicitAuthInProgress;
}

/**
 * Thread-safe, idempotent helper to ensure an active Firebase Auth user.
 * 
 * Rules:
 * 1. NEVER runs or signs in anonymously while an admin/user login is in progress.
 * 2. Awaits auth.authStateReady() so any persisted session (e.g. admin email) in IndexedDB is fully restored.
 * 3. If auth.currentUser exists (whether anonymous or a real non-anonymous account), it NEVER overwrites it.
 * 4. Only signs in anonymously if auth.currentUser is truly null after state restoration.
 */
export async function ensureAnonymousAuth(): Promise<any> {
  if (!authInstance) {
    return null;
  }

  // 1. Abort immediately if an explicit login is in progress
  if (isExplicitAuthInProgress) {
    return authInstance.currentUser || null;
  }

  // 2. Wait for Firebase to finish restoring persisted auth state from IndexedDB
  if (typeof authInstance.authStateReady === 'function') {
    try {
      await authInstance.authStateReady();
    } catch {
      // Ignore error and proceed
    }
  }

  // 3. Re-check: If explicit login started while waiting, abort
  if (isExplicitAuthInProgress) {
    return authInstance.currentUser || null;
  }

  // 4. If already authenticated (real user or existing anonymous), NEVER overwrite
  if (authInstance.currentUser) {
    return authInstance.currentUser;
  }

  // 5. If already in flight, reuse the pending promise
  if (anonymousAuthPromise) {
    return anonymousAuthPromise;
  }

  anonymousAuthPromise = (async () => {
    try {
      if (isExplicitAuthInProgress || authInstance.currentUser) {
        return authInstance.currentUser || null;
      }
      const userCredential = await signInAnonymously(authInstance);
      console.log("[Firebase Auth] Anonymous session established:", userCredential.user.uid);
      return userCredential.user;
    } catch (err: any) {
      console.warn("[Firebase Auth] Anonymous sign-in notice:", err?.message || err);
      return null;
    } finally {
      anonymousAuthPromise = null;
    }
  })();

  return anonymousAuthPromise;
}

/**
 * Creates a real Firebase Auth user using an isolated secondary FirebaseApp instance.
 * This GUARANTEES that the current user's session (e.g. Admin) is NEVER disrupted or signed out.
 */
export async function createAuthUserIsolated(email: string, pass: string): Promise<string> {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured.");
  }
  const cleanEmail = email.trim();
  const cleanPass = pass.trim();
  const tempAppName = `isolated_auth_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const tempApp = initializeApp({
    ...firebaseConfig,
    apiKey: resolvedApiKey
  }, tempAppName);

  try {
    const tempAuth = getAuth(tempApp);
    const cred = await createUserWithEmailAndPassword(tempAuth, cleanEmail, cleanPass);
    const uid = cred.user.uid;
    try {
      await signOut(tempAuth);
    } catch (_) {}
    return uid;
  } finally {
    try {
      await deleteApp(tempApp);
    } catch (_) {}
  }
}


let isServerReachable = true;
let lastConnectionCheck = 0;
const COOLDOWN_MS = 20000; // 20 seconds cooldown

/**
 * Executes a Firestore getDocs query with a timeout.
 * Falls back to cache instantly if offline, server is unreachable, or slow.
 */
export async function getDocsSafe(q: any, timeoutMs = 2500) {
  if (!db || !q) {
    return { docs: [], empty: true } as any;
  }
  const now = Date.now();
  
  // If the browser reports offline, or circuit breaker is active, fetch from cache immediately
  if (
    (typeof navigator !== 'undefined' && !navigator.onLine) || 
    (!isServerReachable && (now - lastConnectionCheck < COOLDOWN_MS))
  ) {
    console.log("Offline or server unreachable (circuit breaker active). Fetching directly from Firestore local cache.");
    try {
      const cachedSnapshot = await getDocsFromCache(q);
      return cachedSnapshot;
    } catch (cacheErr) {
      console.warn("Offline cache fetch failed, returning empty snapshot:", cacheErr);
      return { docs: [], empty: true } as any;
    }
  }

  try {
    const serverPromise = getDocs(q);
    
    // Attach error handler to detect server-side errors and prevent unhandled promise rejections
    serverPromise.catch((err: any) => {
      const msg = err?.message || String(err);
      if (msg.includes("Cloud Firestore API has not been used") || err?.code === "permission-denied") {
        console.error(`[Firestore Notice] Cloud Firestore database is not yet created or enabled for project '${firebaseConfig.projectId}'. Enable it in Firebase Console -> Firestore Database -> Create Database.`);
      } else {
        console.log("Background Firestore query settled:", msg);
      }
      isServerReachable = false;
      lastConnectionCheck = Date.now();
    });

    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("Firebase Timeout")), timeoutMs)
    );
    
    const snapshot = await Promise.race([serverPromise, timeoutPromise]);
    
    // Reset circuit breaker on success
    isServerReachable = true;
    lastConnectionCheck = Date.now();
    return snapshot;
  } catch (err) {
    console.warn("Firestore server fetch failed or timed out. Falling back to Cache:", err);
    isServerReachable = false;
    lastConnectionCheck = Date.now();
    
    try {
      return await getDocsFromCache(q);
    } catch (cacheErr) {
      console.error("Firestore Cache fetch failed as well:", cacheErr);
      return { docs: [], empty: true } as any;
    }
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
