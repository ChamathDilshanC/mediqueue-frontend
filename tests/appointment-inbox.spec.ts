import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = "http://127.0.0.1:3100";
test("staff reviews requests, records attendance, searches and reaches later pages", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "mq_access", value: "fixture-access", url: base },
    { name: "mq_language", value: "en", url: base },
  ]);
  const rows = Array.from({ length: 22 }, (_, i) => ({
    id: `appointment-${i}`,
    patient_name: i === 0 ? "Chamath Patient" : `Patient ${i}`,
    patient_ref: `MRN-${i}`,
    doctor: "Dr Perera",
    room: "Consultation 1",
    starts_at: "2026-12-01T04:30:00Z",
    timezone: "Asia/Colombo",
    status: i < 2 ? "PENDING" : "BOOKED",
    source: "PATIENT",
    review_reason: "",
    reviewed_at: null as string | null,
  }));
  await page.route("**/api/backend/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/appointment-inbox")) {
      const q = url.searchParams.get("q") || "",
        status = url.searchParams.get("status") || "";
      const filtered = rows.filter(
        (r) =>
          (!q || r.patient_name.toLowerCase().includes(q.toLowerCase())) &&
          (!status || r.status === status),
      );
      const counts: Record<string, number> = {};
      rows.forEach((r) => (counts[r.status] = (counts[r.status] || 0) + 1));
      const offset = Number(url.searchParams.get("offset") || 0);
      return route.fulfill({
        json: {
          items: filtered.slice(offset, offset + 20),
          total: filtered.length,
          counts,
        },
      });
    }
    if (route.request().method() === "PATCH") {
      const row = rows.find((r) => url.pathname.endsWith(`/${r.id}`))!;
      const payload = route.request().postDataJSON();
      row.status = payload.status;
      row.review_reason = payload.reason;
      row.reviewed_at = "2026-10-05T10:00:00Z";
      return route.fulfill({ json: row });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto("/dashboard?resource=appointments");
  await expect(page.locator(".appointment-row")).toHaveCount(20);
  const row = page
    .locator(".appointment-row")
    .filter({ hasText: "Chamath Patient" });
  for (const action of ["Approve", "Mark arrived", "Complete"]) {
    await row.getByRole("button", { name: action, exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: action, exact: true })
      .click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  }
  await expect(row).toContainText("Completed");
  const rejected = page
    .locator(".appointment-row")
    .filter({
      has: page.getByRole("heading", { name: "Patient 1", exact: true }),
    });
  await rejected.getByRole("button", { name: "Reject", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("button", { name: "Reject", exact: true }),
  ).toBeDisabled();
  await dialog
    .getByLabel("Rejection reason")
    .fill("Please select a later session");
  await dialog.getByRole("button", { name: "Reject", exact: true }).click();
  await expect(rejected).toContainText("Please select a later session");
  await page
    .getByLabel("Appointment status", { exact: true })
    .selectOption("REJECTED");
  await expect(page.locator(".appointment-row")).toHaveCount(1);
  await page.getByLabel("Appointment status", { exact: true }).selectOption("");
  await page.getByRole("button", { name: "Next appointments page" }).click();
  await expect(page.locator(".appointment-row")).toHaveCount(2);
  await expect(page.locator(".appointment-list")).toContainText("Patient 21");
  await page
    .getByRole("textbox", { name: "Search appointments" })
    .fill("Chamath");
  await expect(page.locator(".appointment-row")).toHaveCount(1);
  await expect(row).toContainText("Completed");
  await mkdir("artifacts/ui", { recursive: true });
  await page.getByRole("textbox", { name: "Search appointments" }).fill("");
  await expect(page.locator(".appointment-row")).toHaveCount(20);
  await page.screenshot({
    path: "artifacts/ui/appointments-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "artifacts/ui/appointments-mobile.png",
    fullPage: true,
  });
});
