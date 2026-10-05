import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = "http://127.0.0.1:3100";
const doctor = {
  id: "doctor-1",
  name: "Dr Chamath",
  department_id: "department-1",
  specialty: "Cardiology",
  is_active: true,
};

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: "mq_language", value: "en", url: base },
    { name: "mq_access", value: "fixture-access", url: base },
  ]);
});

test("doctor edit preserves references, supports keyboard selection and restores focus", async ({
  page,
}) => {
  await page.route("**/api/backend/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({
      json: path.endsWith("/doctors")
        ? [doctor]
        : path.endsWith("/departments")
          ? [
              { id: "department-1", name: "Cardiology" },
              { id: "department-2", name: "Neurology" },
            ]
          : [],
    });
  });
  await page.goto("/dashboard?resource=doctors");
  const edit = page.getByRole("button", { name: "Edit", exact: true });
  await edit.click();
  const dialog = page.getByRole("dialog", { name: "Edit Doctor" });
  await expect(dialog).toBeVisible();
  const department = dialog.locator("#doctors-department_id");
  await expect(department).toContainText("Cardiology");
  await department.click();
  const search = dialog.getByRole("searchbox");
  await expect(search).toBeFocused();
  await search.fill("Neuro");
  await search.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(department).toContainText("Neurology");
  await department.click();
  await search.fill("no-such-department");
  await expect(dialog.getByRole("status")).toHaveText("No options found");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(department).toBeFocused();
  await mkdir("artifacts/ui", { recursive: true });
  await page.screenshot({ path: "artifacts/ui/doctor-edit-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await department.click();
  await page.screenshot({ path: "artifacts/ui/doctor-edit-mobile.png" });
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(edit).toBeFocused();
});

test("failed reference loads show a retry and recover without losing edit values", async ({
  page,
}) => {
  let failed = true;
  await page.route("**/api/backend/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/departments"))
      return failed
        ? route.fulfill({ status: 503, json: { detail: "Unavailable" } })
        : route.fulfill({ json: [{ id: "department-1", name: "Cardiology" }] });
    return route.fulfill({ json: path.endsWith("/doctors") ? [doctor] : [] });
  });
  await page.goto("/dashboard?resource=doctors");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("alert")).toContainText(
    "Some options could not be loaded",
  );
  failed = false;
  await dialog.getByRole("button", { name: "Retry options" }).click();
  await expect(dialog.locator("#doctors-department_id")).toContainText(
    "Cardiology",
  );
  await expect(dialog.locator("#doctors-name")).toHaveValue("Dr Chamath");
});

test("authentication layouts fit mobile in both languages and themes", async ({
  page,
  context,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await context.clearCookies();
  await mkdir("artifacts/ui", { recursive: true });
  for (const language of ["en", "si"]) {
    await context.addCookies([
      { name: "mq_language", value: language, url: base },
    ]);
    for (const theme of ["light", "dark"]) {
      await page.addInitScript(
        (value) => localStorage.setItem("mq_theme", value),
        theme,
      );
      await page.setViewportSize({ width: 390, height: 844 });
      for (const path of [
        "/login",
        "/register",
        "/patient/login",
        "/forgot-password",
      ]) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        const appearance = await page.evaluate(() => {
          const panel = document.querySelector(".auth-form-wrap")!;
          const style = getComputedStyle(panel);
          return {
            background: getComputedStyle(document.body).backgroundColor,
            shadow: style.boxShadow,
            border: style.borderTopWidth,
            panelBackground: style.backgroundColor,
          };
        });
        expect(appearance.background).toBe(
          theme === "light" ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)",
        );
        expect(appearance.shadow).toBe("none");
        expect(appearance.border).toBe("0px");
        expect(appearance.panelBackground).toBe("rgba(0, 0, 0, 0)");
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBeTruthy();
      }
      await page.goto("/login");
      await page.screenshot({
        path: `artifacts/ui/login-${language}-${theme}-mobile.png`,
        fullPage: true,
      });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/login");
  await page.screenshot({
    path: "artifacts/ui/login-desktop.png",
    fullPage: true,
  });
});

test("login and registration fit a desktop viewport with the home link below the caption", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const path of [
    "/login",
    "/register",
    "/patient/login",
    "/patient/register",
  ]) {
    await page.goto(path);
    const home = page.locator(".auth-visual-side .back-link");
    await expect(home).toBeVisible();
    const caption = await page.locator(".auth-visual-caption").boundingBox();
    const link = await home.boundingBox();
    expect(link!.y).toBeGreaterThan(caption!.y + caption!.height);
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBeLessThanOrEqual(900);
  }
});
