import { NextResponse, type NextRequest } from "next/server";
import { authResultSchema } from "./auth-contract";
export const ACCESS_COOKIE = "mq_access";
export const REFRESH_COOKIE = "mq_refresh";
export function requestOrigin(request: NextRequest) {
  const protocol =
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ??
    request.nextUrl.protocol.replace(":", "");
  return (
    process.env.APP_ORIGIN ?? `${protocol}://${request.headers.get("host")}`
  );
}
const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
export function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export function clearSession(response: NextResponse) {
  for (const cookie of [ACCESS_COOKIE, REFRESH_COOKIE])
    response.cookies.set(cookie, "", { ...options, maxAge: 0 });
}
export function setSession(
  response: NextResponse,
  session: ReturnType<typeof authResultSchema.parse>,
) {
  if (session.access_token)
    response.cookies.set(ACCESS_COOKIE, session.access_token, {
      ...options,
      maxAge: Math.min(session.expires_in ?? 3600, 86400),
    });
  if (session.refresh_token)
    response.cookies.set(REFRESH_COOKIE, session.refresh_token, {
      ...options,
      maxAge: 60 * 60 * 24 * 7,
    });
}
export async function backend(path: string, init: RequestInit = {}) {
  const base =
    process.env.MEDIQUEUE_API_URL ?? "https://mediqueue-backend-eta.vercel.app";
  return fetch(`${base.replace(/\/$/, "")}/v1/auth/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
}
export function apiError(status: number, upstream?: Response, action?: string) {
  const emailAction = action === "register" || action === "forgot-password";
  const emailQuota =
    upstream?.headers.get("x-auth-error-code") === "over_email_send_rate_limit";
  const rawRetry = upstream?.headers.get("retry-after");
  const parsedRetry = rawRetry
    ? /^\d+$/.test(rawRetry)
      ? Number(rawRetry)
      : Math.ceil((Date.parse(rawRetry) - Date.now()) / 1000)
    : 60;
  const retryAfter = Number.isFinite(parsedRetry)
    ? Math.min(86400, Math.max(1, parsedRetry))
    : 60;
  const response = json(
    {
      error:
        status === 401
          ? "invalid"
          : status === 429
            ? emailQuota
              ? "emailQuota"
              : emailAction
                ? "emailRateLimit"
                : "rateLimit"
            : status === 400 || status === 422
              ? "validation"
              : "unavailable",
      ...(status === 429 ? { retryAfter } : {}),
    },
    [400, 401, 422, 429].includes(status) ? status : 503,
  );
  if (status === 429) response.headers.set("Retry-After", String(retryAfter));
  return response;
}
