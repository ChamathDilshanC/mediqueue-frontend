import { test, expect } from "@playwright/test";
const stay = {
  id: "stay",
  status: "ADMITTED",
  patient_id: "patient",
  patient_name: "Nimal Perera",
  mrn: "MRN-101",
  admitted_at: "2026-10-01T04:00:00Z",
  bed_assigned_at: "2026-10-02T04:00:00Z",
  stay_days: 4,
  bed_days: 3,
  planned_discharge_at: "2026-10-04T10:00:00Z",
  discharged_at: null,
  discharge_state: "DUE_TODAY",
  assigned_by: "Nurse Silva",
  discharged_by: "",
};
test("backend proxy replaces upstream plain-text failures with safe JSON", async ({
  request,
}) => {
  const response = await request.get("/api/backend/fixture-server-error", {
    headers: { Cookie: "mq_access=fixture-access" },
  });
  expect(response.status()).toBe(503);
  expect(await response.json()).toEqual({
    error: "backendUnavailable",
    detail: "Healthcare data is temporarily unavailable. Please try again.",
  });
  expect(await response.text()).not.toContain("private SQL");
});
test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: "mq_language", value: "en", url: "http://127.0.0.1:3100" },
    {
      name: "mq_access",
      value: "fixture-access",
      url: "http://127.0.0.1:3100",
    },
  ]);
});
test("visual ward map shows status, dates, filters and completed stays on mobile", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/backend/wards?**", (route) =>
    route.fulfill({ json: [{ id: "ward", name: "Medical Ward" }] }),
  );
  await page.route("**/api/backend/wards/ward/bed-map", (route) =>
    route.fulfill({
      json: {
        ward: {
          id: "ward",
          name: "Medical Ward",
          code: "MW",
          type: "GENERAL",
          floor: "2",
          building: "East Wing",
          capacity: 6,
        },
        timezone: "Asia/Colombo",
        as_of: "2026-10-04T11:00:00Z",
        summary: { occupied: 1, available: 1, due_today: 1, overdue: 0 },
        beds: [
          "OCCUPIED",
          "AVAILABLE",
          "RESERVED",
          "CLEANING",
          "MAINTENANCE",
          "INACTIVE",
        ].map((status, i) => ({
          id: `bed-${i}`,
          number: `A-0${i + 1}`,
          type: "STANDARD",
          status,
          active: status !== "INACTIVE",
          admission:
            i === 0
              ? stay
              : i === 3
                ? {
                    ...stay,
                    status: "DISCHARGED",
                    discharge_state: "DISCHARGED",
                    discharged_at: "2026-10-04T10:00:00Z",
                  }
                : null,
        })),
      },
    }),
  );
  await page.goto("/dashboard?resource=bed-board");
  await expect(
    page.getByRole("button", { name: "Bed A-01, Occupied", exact: true }),
  ).toBeVisible();
  const details = page.getByRole("complementary", {
    name: "Selected bed details",
  });
  await expect(details.getByText("Nimal Perera")).toBeVisible();
  await expect(details.getByText("4 days", { exact: true })).toBeVisible();
  await expect(details.getByText("3 days", { exact: true })).toBeVisible();
  await expect(details.getByText("2026-Oct-01", { exact: false })).toBeVisible();
  await expect(details.getByText("Discharge due today")).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Bed occupancy" }),
  ).toHaveAttribute("aria-valuenow", "20");
  await page.screenshot({
    path: "test-results/ward-board-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Available", exact: true }).click();
  await expect(page.locator(".ward-bed-tile")).toHaveCount(1);
  await expect(details.getByText("Nimal Perera")).toHaveCount(0);
  await page.getByRole("button", { name: "All beds", exact: true }).click();
  await page.getByLabel("Search bed or patient").fill("MRN-101");
  await expect(page.locator(".ward-bed-tile")).toHaveCount(1);
  await page.getByLabel("Search bed or patient").fill("");
  await page
    .getByRole("button", { name: "Bed A-04, Cleaning", exact: true })
    .click();
  await expect(details.getByText("Last stay", { exact: false })).toBeVisible();
  await expect(details.getByText("2026-Oct-04", { exact: false })).toHaveCount(
    2,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/ward-board-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("patient portal hides non-JSON server diagnostics and shows own stay details", async ({
  page,
}) => {
  await page.route("**/api/backend/patient/centers", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route("**/api/backend/patient/overview", (route) =>
    route.fulfill({
      status: 500,
      contentType: "text/plain",
      body: "Internal Server Error private SQL diagnostics",
    }),
  );
  await page.goto("/patient");
  await expect(
    page.getByText(
      "Healthcare data is temporarily unavailable. Please try again.",
    ),
  ).toBeVisible();
  await expect(page.getByText(/Unexpected token|private SQL/)).toHaveCount(0);
  await page.unroute("**/api/backend/patient/overview");
  await page.route("**/api/backend/patient/overview", (route) =>
    route.fulfill({
      json: {
        profiles: [],
        appointments: [],
        records: [],
        ward_stays: [
          {
            ...stay,
            ward: "Medical Ward",
            bed: "A-01",
            timezone: "Asia/Colombo",
          },
        ],
      },
    }),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "My ward stays" }),
  ).toBeVisible();
  await expect(page.getByText("4 days", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Medical Ward" }),
  ).toBeVisible();
  await expect(page.getByText("Bed: A-01", { exact: true })).toBeVisible();
});
