import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";

function createFakeJwt(payload) {
  const b64 = (obj) =>
    window.btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${b64({ alg: "none", typ: "JWT" })}.${b64(payload)}.sig`;
}

describe("login flow", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(window, "fetch");
  });

  afterEach(() => {
    window.fetch.mockRestore();
  });

  test("successful login stores token and redirects into app shell", async () => {
    const token = createFakeJwt({ sub: "u1", email: "qe@factory.local", role: "QUALITY_ENGINEER" });

    window.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => ({ status: "ok", accessToken: token, user: { id: "u1" } }),
    });

    render(<App />);

    // login page
    const btn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(btn);

    await waitFor(() => {
      // token persisted
      expect(localStorage.getItem("mqms_token")).toBe(token);
    });

    // once authenticated, app shell nav should appear (from AppShell)
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });

    expect(window.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/auth\/login$/),
      expect.objectContaining({ method: "POST" })
    );
  });

  test("failed login shows error message", async () => {
    window.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: { get: () => "application/json" },
      json: async () => ({ status: "error", message: "Invalid credentials" }),
    });

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    expect(localStorage.getItem("mqms_token")).toBeNull();
  });
});
