import { test, expect } from "@playwright/test";

const centers = [
  {
    id: "colombo",
    tenant_id: "hospital",
    name: "Central Hospital · Colombo",
    hospital: "Central Hospital",
    branch: "Colombo",
    address: "10 Hospital Road, Colombo",
    latitude: 6.9271,
    longitude: 79.8612,
    timezone: "Asia/Colombo",
    phone: "+94112345678",
  },
  {
    id: "kandy",
    tenant_id: "kandy-hospital",
    name: "Hill Hospital · Kandy",
    hospital: "Hill Hospital",
    branch: "Kandy",
    address: "Kandy",
    latitude: 7.2906,
    longitude: 80.6337,
    timezone: "Asia/Colombo",
  },
  {
    id: "missing",
    tenant_id: "other",
    name: "Other Hospital",
    address: "Galle",
    latitude: null,
    longitude: null,
  },
];
test.beforeEach(async ({ context, page }) => {
  await context.addCookies([
    {
      name: "mq_access",
      value: "fixture-access",
      url: "http://127.0.0.1:3100",
    },
    { name: "mq_language", value: "en", url: "http://127.0.0.1:3100" },
  ]);
  // Never fetch community map tiles from automated tests.
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.fulfill({
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=",
        "base64",
      ),
    }),
  );
});

test("patient finds nearest hospital, enrolls, confirms a session and sees live queue estimates", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 7.29, longitude: 80.633 });
  let enrolled = false,
    booked = false;
  const summary = {
    id: "registration",
    name: "Registration Counter 1",
    service_type: "REGISTRATION",
    waiting_count: 5,
    serving_count: 1,
    now_serving: ["021"],
    estimated_wait_minutes: 30,
    estimate_source: "configured_average",
  };
  await page.route("**/api/backend/patient/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/centers")) return route.fulfill({ json: centers });
    if (path.endsWith("/overview"))
      return route.fulfill({
        json: {
          profiles: enrolled
            ? [
                {
                  id: "patient",
                  name: "Nimal Perera",
                  tenant_id: "hospital",
                  mrn: "MRN-101",
                },
              ]
            : [],
          appointments: booked
            ? [
                {
                  id: "appointment",
                  status: "PENDING",
                  doctor: "Dr. Perera",
                  starts_at: "2026-12-01T04:00:00Z",
                  center: centers[0].name,
                  timezone: "Asia/Colombo",
                  address: centers[0].address,
                },
              ]
            : [],
          records: [],
          ward_stays: [],
        },
      });
    if (path.includes("/doctors/")) return route.fulfill({ json: [] });
    if (path.endsWith("/schedules/colombo"))
      return route.fulfill({
        json: [
          {
            id: "session",
            doctor: "Dr. Perera",
            specialty: "General medicine",
            starts_at: "2026-12-01T04:00:00Z",
            capacity: 10,
            remaining: booked ? 9 : 10,
            already_booked: booked,
          },
          {
            id: "full",
            doctor: "Dr. Silva",
            specialty: "Cardiology",
            starts_at: "2026-12-01T05:00:00Z",
            capacity: 1,
            remaining: 0,
            already_booked: false,
          },
        ],
      });
    if (path.includes("/schedules/")) return route.fulfill({ json: [] });
    if (path.includes("/queue-status/"))
      return route.fulfill({ json: [summary] });
    if (path.includes("/queues/")) return route.fulfill({ json: [summary] });
    if (path.endsWith("/tickets"))
      return route.fulfill({
        json: enrolled
          ? [
              {
                id: "ticket",
                visit_id: "visit",
                label: "024",
                status: "WAITING",
                stage: "REGISTRATION",
                queue: "Registration Counter 1",
                room: "Counter 1",
                business_date: "2026-10-05",
                is_today: true,
                ahead: 3,
                now_serving: ["021"],
                waiting_count: 5,
                estimated_wait_minutes: 20,
              },
            ]
          : [],
      });
    if (path.endsWith("/profiles")) {
      expect(route.request().postDataJSON()).toEqual({
        branch_id: "colombo",
        full_name: "Nimal Perera",
        mobile: "0771234567",
      });
      enrolled = true;
      return route.fulfill({ status: 201, json: { id: "patient" } });
    }
    if (path.endsWith("/appointments")) {
      expect(route.request().postDataJSON()).toEqual({
        schedule_id: "session",
      });
      booked = true;
      return route.fulfill({
        status: 201,
        json: { id: "appointment", status: "PENDING" },
      });
    }
    return route.fulfill({
      status: 404,
      json: { detail: "Unexpected fixture request" },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/patient");
  await expect(page.locator(".hospital-result")).toHaveCount(3);
  await expect(page.locator(".hospital-map .leaflet-marker-icon")).toHaveCount(
    2,
  );
  await expect(
    page.getByText("Map location has not been added by this hospital yet."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Use my location" }).click();
  await expect(page.locator(".hospital-result").first()).toContainText(
    "Hill Hospital",
  );
  await expect(page.locator(".distance-pill").first()).toContainText("Nearest");
  await page.getByRole("button", { name: "All hospitals (3)" }).click();
  await expect(page.locator(".hospital-result").first()).toContainText(
    "Central Hospital",
  );
  const hospital = page
    .locator(".hospital-result")
    .filter({ hasText: "Central Hospital" });
  await expect(
    hospital.getByRole("link", { name: "Directions" }),
  ).toHaveAttribute("href", /destination=6\.9271%2C79\.8612/);
  await hospital.getByRole("button", { name: "Choose hospital" }).click();
  await expect(page.getByLabel("Hospital / medical center")).toHaveValue(
    "colombo",
  );
  await expect(
    page
      .locator(".booking-session")
      .filter({ hasText: "Dr. Silva" })
      .getByRole("button", { name: "Book session" }),
  ).toBeDisabled();
  await page.getByLabel("Full name", { exact: true }).fill("Nimal Perera");
  await page.getByLabel("Mobile number").fill("0771234567");
  await page.getByRole("button", { name: "Create patient profile" }).click();
  await expect(
    page.getByText("Your profile is ready. Choose a session below."),
  ).toBeVisible();
  await page.getByLabel("Search doctor or specialty").fill("Perera");
  await page.getByLabel("Session date").fill("2026-12-01");
  await expect(page.locator(".booking-session")).toHaveCount(1);
  await page.getByRole("button", { name: "Book session", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Central Hospital");
  await page
    .getByRole("button", { name: "Confirm booking", exact: true })
    .click();
  await expect(
    page.getByText(
      "Appointment requested. The hospital will review it. Track the status under My appointments.",
    ),
  ).toBeVisible();
  await expect(page.locator("#my-appointments")).toContainText("Dr. Perera");
  await expect(
    page.getByRole("button", { name: "Book session", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Refresh my queue" }).click();
  await expect(page.locator(".queue-summary-card")).toContainText("~30");
  await expect(page.locator(".own-queue-metrics")).toContainText("~20 min");
  await page.screenshot({
    path: "test-results/discovery-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(async () =>
      page.locator(".hospital-map").evaluate((element) => {
        const box = element.getBoundingClientRect();
        const markers = Array.from(
          element.querySelectorAll(".leaflet-marker-icon"),
        );
        return (
          markers.length === 2 &&
          markers.every((marker) => {
            const pin = marker.getBoundingClientRect();
            return (
              pin.left >= box.left &&
              pin.right <= box.right &&
              pin.top >= box.top &&
              pin.bottom <= box.bottom
            );
          })
        );
      }),
    )
    .toBe(true);
  await page.screenshot({
    path: "test-results/discovery-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("location denial and tile failure leave hospital selection available", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: (_ok: unknown, failure: (error: object) => void) =>
          failure({ code: 1 }),
      },
    });
  });
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.abort(),
  );
  await page.route("**/api/backend/patient/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/centers")) return route.fulfill({ json: centers });
    if (path.endsWith("/overview"))
      return route.fulfill({
        json: { profiles: [], appointments: [], records: [] },
      });
    return route.fulfill({ json: [] });
  });
  await page.goto("/patient");
  await page.getByRole("button", { name: "Use my location" }).click();
  await expect(
    page.getByText(
      "Location is unavailable. Allow location access or search by name/address.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Map tiles are unavailable. You can still choose a hospital from the list.",
    ),
  ).toBeVisible();
  await page.getByLabel("Search hospitals or address").fill("Colombo");
  await expect(page.locator(".hospital-result")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Choose hospital", exact: true })
    .click();
  await expect(page.getByLabel("Hospital / medical center")).toHaveValue(
    "colombo",
  );
});

test("hospital admin saves the selected map pin through branch settings", async ({
  page,
}) => {
  let saved = false;
  const branch = {
    id: "branch",
    name: "Colombo branch",
    tenant_id: "hospital",
    timezone: "Asia/Colombo",
    address: "",
    phone: "",
    latitude: null,
    longitude: null,
  };
  await page.route("**/api/backend/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (
      path.endsWith("/branches/branch") &&
      route.request().method() === "PUT"
    ) {
      const body = route.request().postDataJSON();
      expect(body.tenant_id).toBeUndefined();
      expect(body.address).toBe("10 Hospital Road");
      expect(typeof body.latitude).toBe("number");
      expect(typeof body.longitude).toBe("number");
      expect(body.latitude).toBeGreaterThan(-90);
      expect(body.longitude).toBeLessThan(180);
      saved = true;
      return route.fulfill({ json: { ...branch, ...body } });
    }
    if (path.endsWith("/branches")) return route.fulfill({ json: [branch] });
    if (path.endsWith("/hospitals"))
      return route.fulfill({
        json: [{ id: "hospital", name: "Central Hospital" }],
      });
    return route.fulfill({ json: [] });
  });
  await page.goto("/dashboard?resource=branches");
  await page.getByRole("row").filter({ hasText: "Colombo branch" }).hover();
  await page.getByTitle("Edit", { exact: true }).click();
  await expect(
    page.getByText("Pin the exact hospital location", { exact: true }),
  ).toBeVisible();
  await page.locator("#branches-address").fill("10 Hospital Road");
  await expect(
    page.locator(".branch-location-map .leaflet-tile-loaded").first(),
  ).toBeVisible();
  await page
    .locator(".branch-location-map")
    .click({ position: { x: 150, y: 100 } });
  await expect(page.locator("#branches-latitude")).not.toHaveValue("");
  await expect(page.locator("#branches-longitude")).not.toHaveValue("");
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await expect.poll(() => saved).toBe(true);
  await expect(
    page.getByText("Pin the exact hospital location", { exact: true }),
  ).toHaveCount(0);
});
