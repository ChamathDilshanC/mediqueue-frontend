import { test, expect } from "@playwright/test";

for (const route of ["/login", "/register"]) {
  test(`Google sign-in from ${route} uses PKCE and opens the authenticated account`, async ({
    page,
    context,
  }) => {
    await page.goto(route);
    await expect(
      page.getByRole("button", { name: "Google සමඟ ඉදිරියට යන්න" }),
    ).toBeVisible();
    await page.getByRole("combobox").selectOption("en");
    let challenge = "";
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.pathname === "/auth/v1/authorize") {
        challenge = url.searchParams.get("code_challenge") ?? "";
        expect(url.searchParams.get("code_challenge_method")).toBe("s256");
      }
    });
    await page.getByRole("button", { name: "Continue with Google" }).click();
    await expect(page).toHaveURL("/account");
    await expect(page.getByText("Test User", { exact: true })).toBeVisible();
    expect(challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === "mq_access")?.httpOnly).toBe(true);
    expect(cookies.some((c) => c.name === "mq_google_verifier")).toBe(false);
  });
}

test("OAuth cancellation, missing verifier and failed exchanges return helpful errors", async ({
  page,
  context,
}) => {
  await page.goto("/login");
  await page.getByRole("combobox").selectOption("en");
  await page.goto(
    "/auth/callback?error=access_denied&error_description=PRIVATE_PROVIDER_DETAIL",
  );
  await expect(page.locator(".form-error")).toContainText("cancelled");
  await expect(page.locator("body")).not.toContainText(
    "PRIVATE_PROVIDER_DETAIL",
  );
  await page.goto("/auth/callback?code=unsolicited");
  await expect(page.locator(".form-error")).toContainText("expired");
  await context.addCookies([
    {
      name: "mq_google_verifier",
      value: "x".repeat(43),
      domain: "127.0.0.1",
      path: "/auth/callback",
      httpOnly: true,
      sameSite: "Lax",
      secure: true,
    },
  ]);
  await page.goto("/auth/callback?code=invalid");
  await expect(page.locator(".form-error")).toContainText(
    "could not be completed",
  );
  expect((await context.cookies()).some((c) => c.name === "mq_access")).toBe(
    false,
  );
  expect(
    (await context.cookies()).some((c) => c.name === "mq_google_verifier"),
  ).toBe(false);
});

test("Google initiation is origin-checked and the verifier stays out of JSON", async ({
  request,
}) => {
  const denied = await request.post("/api/auth/google", {
    headers: { Origin: "https://untrusted.example" },
  });
  expect(denied.status()).toBe(403);
  const result = await request.post("/api/auth/google", {
    headers: { Origin: "http://127.0.0.1:3100" },
  });
  expect(result.status()).toBe(200);
  const payload = await result.json();
  const url = new URL(payload.url);
  expect(url.searchParams.get("redirect_to")).toBe(
    "http://127.0.0.1:3100/auth/callback",
  );
  expect(url.searchParams.has("code_verifier")).toBe(false);
  const cookies = result.headers()["set-cookie"];
  expect(cookies).toContain("HttpOnly");
  expect(cookies).toContain("SameSite=lax");
  expect(cookies).toContain("Max-Age=600");
  const verifier = /mq_google_verifier=([^;]+)/.exec(cookies)?.[1];
  expect(JSON.stringify(payload)).not.toContain(verifier);
});

test("email quota feedback honours Retry-After while Google remains available", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByRole("combobox").selectOption("en");
  await page.getByLabel("Full name").fill("Example");
  await page.getByLabel("Email address").fill("limited@example.com");
  await page.getByLabel("Password", { exact: true }).fill("test-password");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.locator(".form-error")).toContainText(
    "confirmation email limit",
  );
  await expect(page.locator("button[type=submit]")).toBeDisabled();
  await expect(page.locator("button[type=submit]")).toContainText(
    "Try again in",
  );
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeEnabled();
  await expect(page.locator("button[type=submit]")).toBeEnabled({
    timeout: 6000,
  });
});
