const { createProxyMiddleware } = require("http-proxy-middleware");

/**
 * CRA dev proxy:
 * - Proxies /api and /uploads to the Express backend when running `npm start`.
 * - Helps local development when API_BASE_URL is not set (same-origin fetch).
 *
 * Note: In production builds, this file is not used.
 */
module.exports = function setupProxy(app) {
  const target =
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_BACKEND_URL ||
    process.env.REACT_APP_API_BASE_URL ||
    "http://localhost:3001";

  app.use(
    ["/api", "/uploads", "/docs", "/openapi.json"],
    createProxyMiddleware({
      target,
      changeOrigin: true,
      ws: true,
      logLevel: "warn",
    })
  );
};
