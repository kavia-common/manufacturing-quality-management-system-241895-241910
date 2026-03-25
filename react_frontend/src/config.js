/**
 * Centralized configuration.
 * Uses CRA env var convention: REACT_APP_*
 */

export const APP_NAME = "Manufacturing Quality Management";

/**
 * Backend base URL.
 *
 * Supports multiple env var names to match different deployment setups:
 * - REACT_APP_API_BASE (current container .env)
 * - REACT_APP_BACKEND_URL (current container .env)
 * - REACT_APP_API_BASE_URL (template/default)
 *
 * If not set, defaults to same-origin (useful behind a reverse proxy).
 */
export const API_BASE_URL = (
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  ""
).replace(/\/*$/, "");
