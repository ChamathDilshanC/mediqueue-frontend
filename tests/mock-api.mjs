// Deterministic identity fixture. Tests never create accounts on the live service.
import { createServer } from "node:http";
import { createHash, randomUUID } from "node:crypto";
const oauthCodes = new Map();
const profile = {
  id: "00000000-0000-4000-8000-000000000001",
  display_name: "Test User",
  memberships: [
    {
      id: "00000000-0000-4000-8000-000000000003",
      user_id: "00000000-0000-4000-8000-000000000001",
      tenant_id: "00000000-0000-4000-8000-000000000004",
      branch_id: "00000000-0000-4000-8000-000000000005",
      role: "admin",
      active: true,
    },
  ],
};
const session = {
  access_token: "fixture-access",
  refresh_token: "fixture-refresh",
  expires_in: 3600,
  confirmation_required: false,
};
createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  let data = {};
  try {
    data = JSON.parse(Buffer.concat(chunks).toString() || "{}");
  } catch {
    res.writeHead(400).end();
    return;
  }
  res.setHeader("Content-Type", "application/json");
  const send = (code, value) => {
    res.writeHead(code);
    res.end(JSON.stringify(value));
  };
  if (req.url === "/health") return send(200, { ok: true });
  const url = new URL(req.url, "http://127.0.0.1:4100");
  if (url.pathname === "/auth/v1/authorize") {
    if (
      url.searchParams.get("provider") !== "google" ||
      url.searchParams.get("code_challenge_method") !== "s256"
    )
      return send(400, {});
    const code = randomUUID();
    oauthCodes.set(code, url.searchParams.get("code_challenge"));
    const callback = new URL(url.searchParams.get("redirect_to"));
    callback.searchParams.set("code", code);
    res.writeHead(302, { Location: callback.toString() });
    return res.end();
  }
  if (
    url.pathname === "/auth/v1/token" &&
    url.searchParams.get("grant_type") === "pkce"
  ) {
    const expected = oauthCodes.get(data.auth_code);
    oauthCodes.delete(data.auth_code);
    const challenge = createHash("sha256")
      .update(data.code_verifier || "")
      .digest("base64url");
    if (
      req.headers.apikey !== "fixture-anon" ||
      !expected ||
      challenge !== expected
    )
      return send(400, { error: "invalid_grant" });
    return send(200, session);
  }
  if (req.url === "/v1/auth/login") {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (data.email === "invalid@example.com")
      return send(401, { detail: "Invalid credentials" });
    if (data.email === "unavailable@example.com")
      return send(503, {
        detail: "Private upstream diagnostics must never reach the browser",
      });
    return send(200, session);
  }
  if (req.url === "/v1/auth/register") {
    if (data.email === "limited@example.com") {
      res.setHeader("Retry-After", "3");
      res.setHeader("X-Auth-Error-Code", "over_email_send_rate_limit");
      return send(429, { detail: "Rate limited" });
    }
    return send(201, { confirmation_required: true });
  }
  if (req.url === "/v1/auth/forgot-password")
    return send(202, { message: "Sent" });
  if (req.url === "/v1/auth/password" && req.method === "PUT")
    return req.headers.authorization === "Bearer fixture-access"
      ? send(200, { success: true })
      : send(401, {});
  if (req.url === "/v1/auth/refresh")
    return data.refresh_token === "fixture-refresh"
      ? send(200, session)
      : send(400, { detail: "Expired refresh" });
  if (req.url === "/v1/auth/me")
    return req.headers.authorization === "Bearer fixture-access"
      ? send(200, profile)
      : send(401, { detail: "Expired" });
  if (req.url === "/v1/auth/logout") {
    res.writeHead(204);
    return res.end();
  }
  send(404, { detail: "Missing fixture route" });
}).listen(4100, "127.0.0.1");
