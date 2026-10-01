import { type NextRequest, NextResponse } from "next/server";
import { authResultSchema } from "@/lib/auth-contract";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearSession,
  setSession,
} from "@/lib/auth-server";

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: Context) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "sessionExpired" }, { status: 401 });
  }

  const { path } = await context.params;
  const base =
    process.env.MEDIQUEUE_API_URL ?? "https://mediqueue-backend-eta.vercel.app";

  try {
    let upstream = await fetch(
      `${base.replace(/\/$/, "")}/v1/${path.join("/")}${request.nextUrl.search}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );

    if (upstream.status === 401 && refresh) {
      const refreshed = await fetch(
        `${base.replace(/\/$/, "")}/v1/auth/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refresh }),
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
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
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        },
      );

      const response = new NextResponse(upstream.body, {
        status: upstream.status,
        headers: {
          "Content-Type":
            upstream.headers.get("content-type") ?? "application/json",
          "Cache-Control": "no-store",
        },
      });
      setSession(response, session);
      return response;
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "backendUnavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
