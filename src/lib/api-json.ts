import { messageForStatus } from "./error-messages";

/** Normalize API failures without leaking HTML, SQL or parser diagnostics. */
export async function apiJson(
  response: Response,
  fallback: string,
): Promise<any> {
  const data = await response.json().catch(() => null);
  if (!response.ok || data === null) {
    throw new Error(
      (response.status < 500 ||
        response.headers.get("x-expose-backend-error") === "true") &&
      typeof data?.detail === "string"
        ? data.detail
        : messageForStatus(response.status, fallback),
    );
  }
  return data;
}
