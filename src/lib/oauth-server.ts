import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { authResultSchema } from "./auth-contract";
import { json, setSession, requestOrigin } from "./auth-server";

export const OAUTH_COOKIE = "mq_google_verifier";
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/auth/callback",
  maxAge: 600,
};

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("OAuth configuration missing");
  return { url: url.replace(/\/$/, ""), key };
}

export function startGoogle(request: NextRequest) {
  try {
    const { url } = config();
    const verifier = randomBytes(32).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const authorization = new URL(`${url}/auth/v1/authorize`);
    authorization.searchParams.set("provider", "google");
    authorization.searchParams.set(
      "redirect_to",
      `${requestOrigin(request)}/auth/callback`,
    );
    authorization.searchParams.set("code_challenge", challenge);
    authorization.searchParams.set("code_challenge_method", "s256");
    authorization.searchParams.set("prompt", "select_account");
    const response = json({ url: authorization.toString() });
    response.cookies.set(OAUTH_COOKIE, verifier, cookieOptions);
    response.cookies.set(
      "mq_google_audience",
      request.nextUrl.searchParams.get("audience") === "patient"
        ? "patient"
        : "staff",
      cookieOptions,
    );
    return response;
  } catch {
    return json({ error: "googleUnavailable" }, 503);
  }
}

export async function finishGoogle(request: NextRequest) {
  const patient =
    request.cookies.get("mq_google_audience")?.value === "patient";
  function redirect(path: string) {
    const response = NextResponse.redirect(
      new URL(path, requestOrigin(request)),
      303,
    );
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.cookies.set(OAUTH_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    response.cookies.set("mq_google_audience", "", {
      ...cookieOptions,
      maxAge: 0,
    });
    return response;
  }
  const code = request.nextUrl.searchParams.get("code");
  const verifier = request.cookies.get(OAUTH_COOKIE)?.value;
  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError)
    return redirect(
      `/login?auth_error=${providerError === "access_denied" ? "googleCancelled" : "googleFailed"}`,
    );
  if (
    !code ||
    code.length > 4096 ||
    !verifier ||
    !/^[A-Za-z0-9_-]{43}$/.test(verifier)
  )
    return redirect("/login?auth_error=googleExpired");
  try {
    const { url, key } = config();
    const upstream = await fetch(`${url}/auth/v1/token?grant_type=pkce`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!upstream.ok)
      return redirect(
        `/login?auth_error=${upstream.status === 429 ? "rateLimit" : "googleFailed"}`,
      );
    const session = authResultSchema.parse(await upstream.json());
    if (!session.access_token || !session.refresh_token)
      return redirect("/login?auth_error=googleFailed");
    const response = redirect(patient ? "/patient" : "/account");
    setSession(response, session);
    return response;
  } catch {
    return redirect("/login?auth_error=googleFailed");
  }
}
