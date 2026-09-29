import { type NextRequest } from "next/server";
import {
  authResultSchema,
  credentialsSchema,
  passwordSchema,
  profileSchema,
  recoverySchema,
  recoverySessionSchema,
  registerSchema,
} from "@/lib/auth-contract";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  apiError,
  backend,
  clearSession,
  json,
  setSession,
  requestOrigin,
} from "@/lib/auth-server";
import { startGoogle } from "@/lib/oauth-server";
type Context = { params: Promise<{ action: string }> };
export async function POST(request: NextRequest, context: Context) {
  // Cookie-authenticated mutations must originate from this application.
  const expectedOrigin = requestOrigin(request);
  if (request.headers.get("origin") !== expectedOrigin)
    return json({ error: "invalid" }, 403);
  const { action } = await context.params;
  if (action === "google") return startGoogle(request);
  if (action === "recovery-session") {
    try {
      const parsed = recoverySessionSchema.safeParse(await request.json());
      if (!parsed.success) return json({ error: "recoveryInvalid" }, 400);
      // Rotate and validate the refresh token; never trust tokens supplied in the fragment.
      const refreshed = await backend("refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: parsed.data.refresh_token }),
      });
      if (!refreshed.ok)
        return json(
          { error: "recoveryInvalid" },
          refreshed.status >= 500 ? 503 : 401,
        );
      const session = authResultSchema.parse(await refreshed.json());
      if (!session.access_token) return apiError(503);
      const response = json({ success: true });
      clearSession(response);
      setSession(response, session);
      return response;
    } catch {
      return apiError(503);
    }
  }
  if (action === "password") {
    const token = request.cookies.get(ACCESS_COOKIE)?.value;
    if (!token) return json({ error: "sessionExpired" }, 401);
    try {
      const parsed = passwordSchema.safeParse(await request.json());
      if (!parsed.success) return json({ error: "validation" }, 400);
      const updated = await backend("password", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(parsed.data),
      });
      if (!updated.ok) return apiError(updated.status);
      // The user signs in again with their new password; attempt global revocation.
      await backend("logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
      const response = json({ success: true });
      clearSession(response);
      return response;
    } catch {
      return apiError(503);
    }
  }
  if (action === "logout") {
    const response = json({ success: true });
    const access = request.cookies.get(ACCESS_COOKIE)?.value;
    const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
    let revoked = !access && !refresh;
    try {
      let token = access;
      if (!token && refresh) {
        const refreshed = await backend("refresh", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refresh }),
        });
        if (refreshed.ok)
          token =
            authResultSchema.parse(await refreshed.json()).access_token ??
            undefined;
      }
      if (token)
        revoked = (
          await backend("logout", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          })
        ).ok;
    } catch {
      /* Always clear this browser's session, even when upstream is unavailable. */
    }
    clearSession(response);
    if (!revoked) {
      const local = json({ success: true, localOnly: true });
      clearSession(local);
      return local;
    }
    return response;
  }
  if (!["login", "register", "forgot-password"].includes(action))
    return json({ error: "notFound" }, 404);
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 8192)
      return json({ error: "validation" }, 413);
    const input = await request.json().catch(() => null);
    const schema =
      action === "register"
        ? registerSchema
        : action === "login"
          ? credentialsSchema
          : recoverySchema;
    const parsed = schema.safeParse(input);
    if (!parsed.success) return json({ error: "validation" }, 400);
    const upstream = await backend(action, {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    if (!upstream.ok) return apiError(upstream.status, upstream, action);
    if (action === "forgot-password") return json({ success: true });
    const session = authResultSchema.parse(await upstream.json());
    if (action === "login" && !session.access_token) return apiError(503);
    const response = json({
      success: true,
      confirmationRequired: !session.access_token,
    });
    clearSession(response);
    setSession(response, session);
    return response;
  } catch {
    return apiError(503);
  }
}
export async function GET(request: NextRequest, context: Context) {
  const { action } = await context.params;
  if (action !== "me") return json({ error: "notFound" }, 404);
  let token = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!token && !refresh) return json({ error: "sessionExpired" }, 401);
  let rotated: ReturnType<typeof authResultSchema.parse> | null = null;
  try {
    let upstream = token
      ? await backend("me", { headers: { Authorization: `Bearer ${token}` } })
      : null;
    if ((!upstream || upstream.status === 401) && refresh) {
      const refreshed = await backend("refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!refreshed.ok) {
        if ([400, 401, 403].includes(refreshed.status)) {
          const response = json({ error: "sessionExpired" }, 401);
          clearSession(response);
          return response;
        }
        return apiError(refreshed.status);
      }
      rotated = authResultSchema.parse(await refreshed.json());
      token = rotated.access_token ?? undefined;
      if (!token) return apiError(503);
      upstream = await backend("me", {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    if (!upstream || upstream.status === 401) {
      const response = json({ error: "sessionExpired" }, 401);
      clearSession(response);
      return response;
    }
    if (!upstream.ok) {
      const response = apiError(upstream.status);
      if (rotated) setSession(response, rotated);
      return response;
    }
    const response = json(profileSchema.parse(await upstream.json()));
    if (rotated) setSession(response, rotated);
    return response;
  } catch {
    const response = apiError(503);
    if (rotated) setSession(response, rotated);
    return response;
  }
}
