import { test, expect } from "@playwright/test";
import { resources } from "../src/lib/dashboard-resources";

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: "mq_language", value: "en", url: "http://127.0.0.1:3100" },
  ]);
});

test("theme reveal persists across pages and reloads", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveClass(/dark/);
  for (const route of [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ]) {
    await page.goto(route);
    await expect(
      page.getByRole("button", { name: "Switch to light theme" }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  }
  await page.screenshot({
    path: "test-results/theme-auth-dark.png",
    fullPage: true,
  });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(() => localStorage.getItem("mq_theme"))).toBe(
    "light",
  );
  expect(errors).toEqual([]);
});

test("theme supports reduced motion and unavailable View Transitions", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("/login");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(() =>
    Object.defineProperty(document, "startViewTransition", {
      value: undefined,
      configurable: true,
    }),
  );
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("mobile menu traps focus, closes with Escape and follows links", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Open menu", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Mobile navigation" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("link", { name: "Create your account" }).focus();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("link", { name: "MediQueue home" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("link", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL("/login");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(dialog).toBeVisible();
  await page.screenshot({ path: "test-results/sidebar-mobile.png" });
  await page.keyboard.press("Escape");
  for (const width of [320, 390, 768, 1024]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("workspace sidebar connects every resource and collapses on desktop", async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: "mq_access",
      value: "fixture-access",
      url: "http://127.0.0.1:3100",
    },
  ]);
  await page.route("**/api/backend/**", (route) =>
    route.fulfill({ json: [{ id: "fixture-record", name: "Sample record" }] }),
  );
  await page.goto("/dashboard");
  const sidebar = page.getByRole("complementary", {
    name: "Workspace navigation",
  });
  for (const { key, label } of resources) {
    await sidebar.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(`/dashboard?resource=${key}`);
    await expect(
      page.getByRole("heading", { name: label, exact: true }),
    ).toBeVisible();
    await expect(
      sidebar.getByRole("link", { name: label, exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }
  await page
    .getByRole("button", { name: "Collapse navigation", exact: true })
    .click();
  await expect(sidebar).toHaveAttribute("data-state", "collapsed");
  await expect(
    sidebar.getByRole("link", { name: "Hospitals", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Expand navigation", exact: true })
    .click();
  await expect(sidebar).toHaveAttribute("data-state", "expanded");
  await page.screenshot({
    path: "test-results/sidebar-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-magicui-theme-vt",
    "active",
  );
  await page.screenshot({
    path: "test-results/sidebar-desktop-dark.png",
    fullPage: true,
  });
  await sidebar.getByRole("link", { name: "My account" }).click();
  await expect(page).toHaveURL("/account");
  await expect(page.getByText("Test User", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Patients", exact: true })
    .click();
  await expect(page).toHaveURL("/dashboard?resource=patients");
  await expect(
    page.getByRole("heading", { name: "Patients", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/dashboard-mobile-dark.png",
    fullPage: true,
  });
});
