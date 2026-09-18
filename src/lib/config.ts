import { auth, ensureAnonymousAuth, isAuthActionPending } from "./firebase";

/**
 * Centralized Application Configuration
 * All external connection points are managed here.
 * If a value is unconfigured (""), the application gracefully falls back
 * to local/offline modes and NEVER contacts any legacy service.
 */

// Backend API Base URL (e.g., https://your-backend.run.app)
// Leave empty if backend is not yet hosted.
export const BACKEND_URL: string = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) || "";

// Web Hosting Domain (e.g., https://your-app.web.app)
// Leave empty if custom hosting is not yet finalized.
export const HOSTING_URL: string = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_HOSTING_URL) || "";

// Super-Admin Configuration
export const NEW_ADMIN_EMAIL: string = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_EMAIL) || "Primeshrivardhan@gmail.com";

export const NEW_ADMIN_DISPLAY_NAME: string = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_DISPLAY_NAME) || "";

// Company & Report Branding
export const COMPANY_NAME: string = "VIONEX";
export const COMPANY_INITIALS: string = "VIO";
export const COMPANY_ADDRESS: string = "Sangli";
export const COMPANY_PHONE: string = "7249760992";

/**
 * Resolves full API URL with safe guard.
 * Returns empty string if backend is unconfigured and running in native/isolated environment.
 */
export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  if (BACKEND_URL) {
    return `${BACKEND_URL.replace(/\/$/, '')}${cleanEndpoint}`;
  }

  // If in standard browser dev environment on localhost with Express proxying /api
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
      window.location.port === '3000') {
    return cleanEndpoint;
  }

  // Unconfigured / Capacitor native environment: no backend URL available
  return "";
}

/**
 * Attaches the Firebase Auth ID token in the Authorization header.
 * Returns standard JSON headers if user is not yet signed in.
 */
export async function getAuthHeaders(customHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders
  };

  try {
    let user = auth?.currentUser;
    // If no user is authenticated yet and no explicit login is in progress, ensure an anonymous session is active before attaching ID token
    if (!user && auth && !isAuthActionPending()) {
      user = await ensureAnonymousAuth();
    }

    if (user) {
      const idToken = await user.getIdToken();
      if (idToken) {
        headers["Authorization"] = `Bearer ${idToken}`;
      }
    }
  } catch (err) {
    console.warn("Notice: Could not attach Firebase ID token to request:", err);
  }

  return headers;
}

/**
 * Safe backend fetch wrapper:
 * 1. Checks if backend endpoint URL is configured.
 * 2. Attaches the Firebase Auth ID token automatically.
 * 3. Returns null if backend URL is not configured (preventing any accidental calls).
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response | null> {
  const url = getApiUrl(endpoint);
  if (!url) return null;

  const authHeaders = await getAuthHeaders((options.headers as Record<string, string>) || {});
  
  return fetch(url, {
    ...options,
    headers: authHeaders,
  });
}
