import React, { createContext, useContext, useMemo, useState } from "react";
import { apiRequest, authGetToken, authSetToken } from "../services/api";

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded;
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides auth state and actions. */
  const [token, setToken] = useState(() => authGetToken());
  const user = useMemo(() => (token ? parseJwt(token) : null), [token]);

  const value = useMemo(() => {
    return {
      token,
      user,
      isAuthenticated: !!token,
      async login(email, password) {
        // Backend shape unknown (OpenAPI could not be fetched as JSON),
        // so we support common patterns: {token}, {accessToken}, {jwt}, {data:{token}}
        const res = await apiRequest("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });

        const nextToken =
          res?.token || res?.accessToken || res?.jwt || res?.data?.token || res?.data?.accessToken;

        if (!nextToken) {
          throw new Error("Login succeeded but no token was returned by the API.");
        }

        authSetToken(nextToken);
        setToken(nextToken);
      },
      logout() {
        authSetToken(null);
        setToken(null);
      }
    };
  }, [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Access auth state and actions. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
