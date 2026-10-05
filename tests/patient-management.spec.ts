import { expect, test } from "@playwright/test";
const base = "http://127.0.0.1:3100";
test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: "mq_language", value: "en", url: base }]);
});
test("patient sign in, enrollment, booking, records and cancellation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let enrolled = false;
  let booked = false;
  let cancelled = false;
  await page.route("**/api/backend/patient/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (
      path.endsWith("/tickets") ||
      path.includes("/queues/") ||
      path.includes("/queue-status/")
    )
      return route.fulfill({ json: [] });
    if (path.endsWith("/centers"))
      return route.fulfill({
        json: [
          {
            id: "center",
            tenant_id: "hospital",
            name: "Medical Center · Main",
          },
        ],
      });
    if (path.endsWith("/overview"))
      return route.fulfill({
        json: {
          profiles: enrolled
            ? [
                {
                  id: "patient",
                  name: "Test Patient",
                  tenant_id: "hospital",
                  mrn: "P-001",
                },
              ]
            : [],
          appointments: booked
            ? [
                {
                  id: "booking",
                  doctor: "Dr. Test",
                  status: cancelled ? "CANCELLED" : "PENDING",
                  starts_at: "2026-11-01T03:30:00Z",
                },
              ]
            : [],
          records: enrolled
            ? [
                {
                  id: "record",
                  module: "invoices",
                  description: "Consultation",
                  amount: "1500.00",
                  balance: "1000.00",
                  status: "PARTIAL",
                },
              ]
            : [],
        },
      });
    if (path.endsWith("/schedules/center"))
      return route.fulfill({
        json: [
          {
            id: "schedule",
            doctor: "Dr. Test",
            specialty: "General medicine",
            starts_at: "2026-11-01T03:30:00Z",
            capacity: 20,
          },
        ],
      });
    if (path.endsWith("/profiles")) {
      enrolled = true;
      return route.fulfill({ status: 201, json: { id: "patient" } });
    }
    if (path.endsWith("/appointments")) {
      expect(route.request().postDataJSON()).toEqual({
        schedule_id: "schedule",
      });
      booked = true;
      return route.fulfill({ status: 201, json: { id: "booking" } });
    }
    if (path.endsWith("/cancel")) {
      cancelled = true;
      return route.fulfill({ json: { status: "CANCELLED" } });
    }
    return route.fulfill({
      status: 404,
      json: { detail: "Unexpected request" },
    });
  });
  await page.goto("/patient/login");
  await expect(
    page.getByRole("heading", { name: "Patient sign in" }),
  ).toBeVisible();
  await page.getByLabel("Email address").fill("person@example.com");
  await page.getByLabel("Password", { exact: true }).fill("valid-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL("/patient");
  await page.getByLabel("Hospital / medical center").selectOption("center");
  await expect(
    page.getByRole("button", { name: "Book session" }),
  ).toBeDisabled();
  await page.getByLabel("Full name").fill("Test Patient");
  await page.getByLabel("Mobile number").fill("0771234567");
  await page.getByRole("button", { name: "Create patient profile" }).click();
  await expect(
    page.getByRole("button", { name: "Book session" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Book session" }).click();
  await page
    .getByRole("button", { name: "Confirm booking", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cancel appointment" }),
  ).toBeVisible();
  await expect(page.getByText("1000.00", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "test-results/patient-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Cancel appointment" }).click();
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/patient-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("reception gets billing but cannot open clinical management", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "mq_access", value: "fixture-access", url: base },
  ]);
  const profile = {
    id: "00000000-0000-4000-8000-000000000001",
    display_name: "Reception",
    memberships: [
      {
        id: "00000000-0000-4000-8000-000000000003",
        tenant_id: "00000000-0000-4000-8000-000000000004",
        branch_id: "00000000-0000-4000-8000-000000000005",
        role: "reception",
        active: true,
      },
    ],
  };
  await page.route("**/api/auth/me", (r) => r.fulfill({ json: profile }));
  await page.route("**/api/backend/**", (r) => r.fulfill({ json: [] }));
  await page.goto("/dashboard?resource=invoices");
  await expect(
    page.getByRole("heading", { name: "Invoices", exact: true, level: 1 }),
  ).toBeVisible();
  const nav = page.getByRole("complementary", { name: "Workspace navigation" });
  await expect(
    nav.getByRole("link", { name: "Clinical records", exact: true }),
  ).toHaveCount(0);
  await page.goto("/dashboard?resource=clinical-records");
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Your role does not have access" }),
  ).toBeVisible();
});

test("backend proxy checks mutation origin and forwards queue idempotency", async ({
  context,
}) => {
  await context.addCookies([
    { name: "mq_access", value: "fixture-access", url: base },
  ]);
  const rejected = await context.request.post(
    `${base}/api/backend/queues/fixture/call-next`,
    { headers: { Origin: "https://other.example" }, data: {} },
  );
  expect(rejected.status()).toBe(403);
  const response = await context.request.post(
    `${base}/api/backend/queues/fixture/call-next`,
    {
      headers: { Origin: base, "Idempotency-Key": "queue-command-1" },
      data: {},
    },
  );
  expect(response.ok()).toBe(true);
  expect((await response.json()).received_key).toBe("queue-command-1");
});
