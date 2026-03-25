import { apiRequest, authSetToken } from "./services/api";

describe("services/api", () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("adds Authorization header when token is present", async () => {
    authSetToken("abc123");
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => ({ status: "ok" }),
    });

    await apiRequest("/api/defects", { method: "GET" });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, options] = fetch.mock.calls[0];
    // Headers in fetch options is a Headers object
    expect(options.headers.get("Authorization")).toBe("Bearer abc123");
  });

  test("sets Content-Type: application/json when body is present and not FormData", async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => ({ ok: true }),
    });

    await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "a@b.com", password: "x" }),
    });

    const [, options] = fetch.mock.calls[0];
    expect(options.headers.get("Content-Type")).toBe("application/json");
  });

  test("does not force Content-Type when body is FormData", async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => ({ ok: true }),
    });

    const fd = new FormData();
    fd.append("files", new Blob(["x"], { type: "text/plain" }), "x.txt");

    await apiRequest("/api/defects/1/uploads", {
      method: "POST",
      body: fd,
    });

    const [, options] = fetch.mock.calls[0];
    expect(options.headers.has("Content-Type")).toBe(false);
  });

  test("throws normalized Error with status on non-2xx response", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => "application/json" },
      json: async () => ({ status: "error", message: "Invalid credentials" }),
    });

    await expect(apiRequest("/api/auth/login", { method: "POST" })).rejects.toMatchObject({
      message: "Invalid credentials",
      status: 401,
    });
  });

  test("handles invalid JSON body gracefully for JSON content-type", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      headers: { get: () => "application/json" },
      json: async () => {
        throw new Error("bad json");
      },
    });

    await expect(apiRequest("/api/defects", { method: "GET" })).rejects.toMatchObject({
      status: 500,
    });
  });
});
