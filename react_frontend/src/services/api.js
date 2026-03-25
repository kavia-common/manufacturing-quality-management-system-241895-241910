import { API_BASE_URL } from "../config";

/**
 * Very small API layer:
 * - Adds Authorization: Bearer <token> if present
 * - Handles JSON responses and throws normalized errors
 */

const TOKEN_KEY = "mqms_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}

/** Normalize various backend error shapes into a consistent Error */
function toApiError(response, body) {
  const message =
    body?.message ||
    body?.error ||
    body?.detail ||
    `Request failed with status ${response.status}`;
  const err = new Error(message);
  err.status = response.status;
  err.body = body;
  return err;
}

// PUBLIC_INTERFACE
export function authGetToken() {
  /** Returns the stored JWT access token (or null). */
  return getToken();
}

// PUBLIC_INTERFACE
export function authSetToken(token) {
  /** Stores a JWT access token in localStorage. */
  setToken(token);
}

// PUBLIC_INTERFACE
export async function apiRequest(path, options = {}) {
  /**
   * Perform a JSON request to the backend.
   * @param {string} path - URL path (e.g. "/api/defects")
   * @param {RequestInit} options - fetch options
   * @returns {Promise<any>} parsed JSON or null
   */
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const resp = await fetch(url, { ...options, headers });

  const contentType = resp.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  let body = null;
  if (isJson) {
    try {
      body = await resp.json();
    } catch {
      body = null;
    }
  } else {
    // best-effort parse text for errors
    try {
      body = await resp.text();
    } catch {
      body = null;
    }
  }

  if (!resp.ok) {
    throw toApiError(resp, body);
  }
  return body;
}

// PUBLIC_INTERFACE
export async function apiDownload(path, filename = "report.pdf") {
  /**
   * Download a file from the backend and trigger browser save.
   * @param {string} path
   * @param {string} filename
   */
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const resp = await fetch(url, { headers });
  if (!resp.ok) {
    let body = null;
    try {
      body = await resp.json();
    } catch {
      // ignore
    }
    throw toApiError(resp, body);
  }

  const blob = await resp.blob();
  const blobUrl = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(blobUrl);
}
