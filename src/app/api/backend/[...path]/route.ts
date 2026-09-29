import { type NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/auth-server";

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: Context) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token)
    return NextResponse.json({ error: "sessionExpired" }, { status: 401 });

  const { path } = await context.params;
  const base =
    process.env.MEDIQUEUE_API_URL ?? "https://mediqueue-backend-eta.vercel.app";
  const upstream = await fetch(
    `${base.replace(/\/$/, "")}/v1/${path.join("/")}${request.nextUrl.search}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    },
  );

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}
