import { test, expect } from "@playwright/test";
test("staff completes registration and issues an onward consultation ticket", async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: "mq_access",
      value: "fixture-access",
      url: "http://127.0.0.1:3100",
    },
    { name: "mq_language", value: "en", url: "http://127.0.0.1:3100" },
  ]);
  let routed = false;
  await page.route("**/api/backend/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/queues"))
      return route.fulfill({
        json: [
          {
            id: "registration",
            name: "Registration Counter",
            service_type: "REGISTRATION",
          },
          { id: "doctor", name: "Doctor Room 3", service_type: "CONSULTATION" },
        ],
      });
    if (path.endsWith("/snapshot"))
      return route.fulfill({
        json: {
          queueId: "registration",
          tokens: [
            { id: "ticket", label: "024", status: "COMPLETED", version: 3 },
          ],
        },
      });
    if (path.endsWith("/handoff")) {
      expect(route.request().postDataJSON()).toEqual({ queue_id: "doctor" });
      expect(route.request().headers()["idempotency-key"]).toBeTruthy();
      routed = true;
      return route.fulfill({
        status: 201,
        json: { id: "next-ticket", label: "009", status: "WAITING" },
      });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto("/dashboard?resource=queues");
  await page.getByLabel("Queue", { exact: true }).selectOption("registration");
  await page.getByLabel("Next room / service").selectOption("doctor");
  await page.getByRole("button", { name: "Issue onward ticket" }).click();
  await expect(page.getByText("Updated · 009")).toBeVisible();
  expect(routed).toBe(true);
});
test("patient-only space takes a ticket, tracks calls and stays usable on mobile", async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: "mq_access",
      value: "fixture-access",
      url: "http://127.0.0.1:3100",
    },
    { name: "mq_language", value: "en", url: "http://127.0.0.1:3100" },
  ]);
  let issued = false;
  let called = false;
  let key = "";
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      json: {
        id: "00000000-0000-4000-8000-000000000001",
        display_name: "Nimal Perera",
        memberships: [],
      },
    }),
  );
  await page.route("**/api/backend/patient/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.includes("/queue-status/")) return route.fulfill({ json: [] });
    if (path.endsWith("/centers"))
      return route.fulfill({
        json: [
          {
            id: "center",
            tenant_id: "hospital",
            name: "Central Hospital · Main",
          },
        ],
      });
    if (path.endsWith("/overview"))
      return route.fulfill({
        json: {
          profiles: [
            {
              id: "patient",
              tenant_id: "hospital",
              name: "Nimal Perera",
              mrn: "MRN-101",
            },
          ],
          appointments: [],
          records: [],
          ward_stays: [],
        },
      });
    if (path.endsWith("/schedules/center")) return route.fulfill({ json: [] });
    if (path.endsWith("/queues/center"))
      return route.fulfill({
        json: [{ id: "registration", name: "Registration Counter 1" }],
      });
    if (path.endsWith("/queues/registration/tickets")) {
      key = route.request().headers()["idempotency-key"];
      expect(key).toBeTruthy();
      issued = true;
      return route.fulfill({
        status: 201,
        json: { id: "own-ticket", label: "024", status: "WAITING" },
      });
    }
    if (path.endsWith("/tickets"))
      return route.fulfill({
        json: issued
          ? [
              {
                id: "own-ticket",
                visit_id: "visit",
                label: "024",
                status: called ? "CALLED" : "WAITING",
                stage: "REGISTRATION",
                queue: "Registration Counter 1",
                room: "Counter 1",
                business_date: "2026-10-04",
                is_today: true,
                ahead: 3,
                now_serving: called ? ["024"] : ["021"],
              },
            ]
          : [],
      });
    return route.fulfill({
      status: 404,
      json: { detail: "Unexpected fixture request" },
    });
  });
  await page.goto("/account");
  await expect(page).toHaveURL("/patient");
  await expect(
    page.getByRole("complementary", { name: "Workspace navigation" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("complementary", { name: "Patient navigation" }),
  ).toBeVisible();
  for (const label of [
    "Register hospital / medical center",
    "Hospitals",
    "Inventory",
    "Staff directory",
    "Reports",
  ]) {
    await expect(
      page.getByRole("link", { name: label, exact: true }),
    ).toHaveCount(0);
  }
  await page.getByLabel("Hospital / medical center").selectOption("center");
  await page.getByLabel("Registration counter").selectOption("registration");
  await page.getByRole("button", { name: "Take registration ticket" }).click();
  await expect(page.locator(".care-ticket-number strong")).toHaveText("024");
  await expect(page.getByText("3 people ahead of you")).toBeVisible();
  await expect(page.locator(".care-now-serving strong")).toHaveText("021");
  await page.screenshot({
    path: "test-results/patient-space-desktop.png",
    fullPage: true,
  });
  called = true;
  await page.getByRole("button", { name: "Refresh my queue" }).click();
  await expect(page.getByText("Your turn", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Please proceed to the room or counter shown above."),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("navigation", { name: "Patient sections" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/patient-space-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: "test-results/patient-space-mobile-dark.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Sign out", exact: true })
    .last()
    .click();
  await expect(page).toHaveURL("/patient/login");
});
