import { type NextRequest, NextResponse } from "next/server";
import { authResultSchema } from "@/lib/auth-contract";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearSession,
  setSession,
  requestOrigin,
} from "@/lib/auth-server";

type Context = { params: Promise<{ path: string[] }> };

function forwardResponse(upstream: Response) {
  if (
    upstream.status >= 500 ||
    (upstream.status !== 204 &&
      !upstream.headers.get("content-type")?.includes("application/json"))
  ) {
    return NextResponse.json(
      {
        error: "backendUnavailable",
        detail: "Healthcare data is temporarily unavailable. Please try again.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}

async function proxy(request: NextRequest, context: Context) {
  if (
    ["POST", "PUT", "PATCH", "DELETE"].includes(request.method) &&
    request.headers.get("origin") !== requestOrigin(request)
  ) {
    return NextResponse.json({ error: "invalid" }, { status: 403 });
  }
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!token && !refresh) {
    return NextResponse.json({ error: "sessionExpired" }, { status: 401 });
  }

  const { path } = await context.params;
  const base =
    process.env.MEDIQUEUE_API_URL ?? "https://mediqueue-backend-eta.vercel.app";
  const body = ["POST", "PUT", "PATCH"].includes(request.method)
    ? await request.text()
    : undefined;
  const isPaymentRequest =
    request.method === "POST" && path.at(-1) === "payment";
  const upstreamTimeout = isPaymentRequest ? 30000 : 15000;

  const getHeaders = (bearerToken: string) => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${bearerToken}`,
      "Content-Type": request.headers.get("content-type") ?? "application/json",
    };
    const xTenant =
      request.headers.get("x-tenant-id") ||
      request.cookies.get("active_tenant_id")?.value;
    const xBranch =
      request.headers.get("x-branch-id") ||
      request.cookies.get("active_branch_id")?.value;
    if (xTenant) headers["X-Tenant-ID"] = xTenant;
    if (xBranch) headers["X-Branch-ID"] = xBranch;
    const idempotency = request.headers.get("idempotency-key");
    if (idempotency) headers["Idempotency-Key"] = idempotency;
    return headers;
  };

  try {
    let upstream = token
      ? await fetch(
          `${base.replace(/\/$/, "")}/v1/${path.join("/")}${request.nextUrl.search}`,
          {
            method: request.method,
            headers: getHeaders(token),
            body,
            cache: "no-store",
            signal: AbortSignal.timeout(upstreamTimeout),
          },
        )
      : new Response(null, { status: 401 });

    if (upstream.status === 401 && refresh) {
      const refreshed = await fetch(
        `${base.replace(/\/$/, "")}/v1/auth/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refresh }),
          cache: "no-store",
          signal: AbortSignal.timeout(upstreamTimeout),
        },
      );
      if (!refreshed.ok) {
        const response = NextResponse.json(
          { error: "sessionExpired" },
          { status: 401 },
        );
        clearSession(response);
        return response;
      }

      const session = authResultSchema.parse(await refreshed.json());
      if (!session.access_token) {
        const response = NextResponse.json(
          { error: "sessionExpired" },
          { status: 401 },
        );
        clearSession(response);
        return response;
      }

      upstream = await fetch(
        `${base.replace(/\/$/, "")}/v1/${path.join("/")}${request.nextUrl.search}`,
        {
          method: request.method,
          headers: getHeaders(session.access_token),
          body,
          cache: "no-store",
          signal: AbortSignal.timeout(upstreamTimeout),
        },
      );

      const response = forwardResponse(upstream);
      setSession(response, session);
      return response;
    }

    return forwardResponse(upstream);
  } catch {
    return NextResponse.json(
      { error: "backendUnavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
