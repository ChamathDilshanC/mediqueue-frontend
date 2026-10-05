import { selectLanguage } from "./helpers";
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
async function revealPage(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(900);
}

test("Sinhala is the default; language, font and metadata persist across routes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "si");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "ඔබේ කාලය වටිනවා",
  );
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(() =>
      document.fonts.check("16px AFSandarenu", "සිංහල"),
    ),
  ).toBe(true);
  await expect(page.locator("link[rel=icon]")).toHaveAttribute(
    "href",
    "/brand/logo.png",
  );
  await revealPage(page);
  await page.screenshot({
    path: "test-results/landing-si-desktop.png",
    fullPage: true,
  });
  await selectLanguage(page, "en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your time matters.",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await revealPage(page);
  await page.screenshot({
    path: "test-results/landing-en-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL("/login");
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.screenshot({
    path: "test-results/login-en-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("mobile navigation, FAQ disclosure and both languages fit the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const lang of ["si", "en"]) {
    await selectLanguage(page, lang);
    await revealPage(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/landing-${lang}-mobile.png`,
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .locator("#mobile-navigation")
    .getByRole("link", { name: "FAQs" })
    .click();
  await page.locator("summary").first().click();
  await expect(page.locator("details").first()).toHaveAttribute("open", "");
  await page.goto("/register");
  await expect(
    page.getByRole("textbox", { name: "Full name", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/register-en-mobile.png",
    fullPage: true,
  });
});

test("sign in displays the requested loader, verifies profile and signs out", async ({
  page,
  context,
}) => {
  await page.goto("/login");
  await selectLanguage(page, "en");
  await page.getByLabel("Email address").fill("person@example.com");
  await page.getByLabel("Password", { exact: true }).fill("valid-password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.locator("#password")).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Please wait" }),
  ).toBeVisible();
  await expect(page).toHaveURL("/account");
  await expect(page.getByText("Test User", { exact: true })).toBeVisible();
  const cookies = await context.cookies();
  for (const name of ["mq_access", "mq_refresh"]) {
    const cookie = cookies.find((c) => c.name === name);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("Lax");
    expect(cookie?.secure).toBe(true);
  }
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "fixture-access",
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL("/login");
  expect((await context.cookies()).some((c) => c.name === "mq_access")).toBe(
    false,
  );
  await page.goto("/account");
  await expect(page).toHaveURL("/login");
});

test("registration and recovery display honest confirmation; invalid login stays on form", async ({
  page,
}) => {
  await page.goto("/register");
  await selectLanguage(page, "en");
  await page.getByLabel("Full name").fill("Test User");
  await page.getByLabel("Email address").fill("new@example.com");
  await page.getByLabel("Password", { exact: true }).fill("valid-password");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Check your inbox" }),
  ).toBeVisible();
  await page.goto("/forgot-password");
  await page.getByLabel("Email address").fill("person@example.com");
  await page.getByRole("button", { name: "Send recovery email" }).click();
  await expect(
    page.getByRole("heading", { name: "Recovery request sent" }),
  ).toBeVisible();
  await page.goto("/login");
  await page.getByLabel("Email address").fill("invalid@example.com");
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator(".form-error")).toContainText(
    "Check your email and password",
  );
  await expect(page).toHaveURL("/login");
  await selectLanguage(page, "si");
  await expect(page.locator(".form-error")).toContainText("ඊමේල් ලිපිනය");
});

test("auth proxy rejects cross-origin requests and malformed input without leaking tokens", async ({
  request,
}) => {
  const origin = "http://127.0.0.1:3100";
  const blocked = await request.post("/api/auth/login", {
    headers: { Origin: "https://untrusted.example" },
    data: { email: "person@example.com", password: "valid-password" },
  });
  expect(blocked.status()).toBe(403);
  const malformed = await request.post("/api/auth/login", {
    headers: { Origin: origin },
    data: { email: "invalid", password: "short" },
  });
  expect(malformed.status()).toBe(400);
  const login = await request.post("/api/auth/login", {
    headers: { Origin: origin },
    data: { email: "person@example.com", password: "valid-password" },
  });
  expect(login.status()).toBe(200);
  expect(await login.text()).not.toContain("fixture-access");
  expect(login.headers()["cache-control"]).toBe("no-store");
  const failure = await request.post("/api/auth/login", {
    headers: { Origin: origin },
    data: { email: "unavailable@example.com", password: "valid-password" },
  });
  expect(failure.status()).toBe(503);
  expect(await failure.text()).not.toContain("Private upstream");
});

test("expired access rotates the refresh token and invalid refresh clears the session", async ({
  request,
}) => {
  const refreshed = await request.get("/api/auth/me", {
    headers: { Cookie: "mq_access=expired; mq_refresh=fixture-refresh" },
  });
  expect(refreshed.status()).toBe(200);
  expect((await refreshed.json()).display_name).toBe("Test User");
  expect(refreshed.headers()["set-cookie"]).toContain(
    "mq_access=fixture-access",
  );
  const expired = await request.get("/api/auth/me", {
    headers: { Cookie: "mq_access=expired; mq_refresh=expired" },
  });
  expect(expired.status()).toBe(401);
  expect(expired.headers()["set-cookie"]).toContain("Max-Age=0");
});

test("email recovery clears the fragment, validates the session and sets a new password", async ({
  page,
  context,
}) => {
  await page.goto(
    "/reset-password#type=recovery&access_token=fixture-access&refresh_token=fixture-refresh",
  );
  await selectLanguage(page, "en");
  await expect(page.getByLabel("New password", { exact: true })).toBeVisible();
  expect(new URL(page.url()).hash).toBe("");
  await page
    .getByLabel("New password", { exact: true })
    .fill("new-password-example");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(
    page.getByRole("heading", { name: "Password updated" }),
  ).toBeVisible();
  expect((await context.cookies()).some((c) => c.name === "mq_access")).toBe(
    false,
  );
  await page.goto("/reset-password");
  await expect(
    page.getByRole("link", { name: "Request a new link" }),
  ).toBeVisible();
});
