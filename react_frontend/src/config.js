/**
 * Centralized configuration.
 * Uses CRA env var convention: REACT_APP_*
 */

export const APP_NAME = "Manufacturing Quality Management";

/**
 * Backend base URL.
 * If not set, defaults to same-origin (useful behind a reverse proxy).
 */
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/+$/, "") || "";
