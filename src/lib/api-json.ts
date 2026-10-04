/** Normalize upstream outages without leaking HTML, SQL or parser diagnostics. */
export async function apiJson(
  response: Response,
  fallback: string,
): Promise<any> {
  const data = await response.json().catch(() => null);
  if (!response.ok || data === null) {
    throw new Error(
      response.status < 500 && typeof data?.detail === "string"
        ? data.detail
        : fallback,
    );
  }
  return data;
}
