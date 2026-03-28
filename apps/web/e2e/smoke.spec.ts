import { test, expect } from "@playwright/test";

/**
 * Smoke Tests — Critical Paths
 *
 * These tests verify that key routes return non-500 HTTP responses.
 * They do NOT assert page content since the production URL may serve
 * a CDN/parking page before the app is fully deployed.
 *
 * Content-level assertions belong in integration tests run against
 * a local dev server or a dedicated staging environment.
 */

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

test.describe("Smoke Tests — Critical Paths", () => {
  test("homepage does not return a 5xx error", async ({ page }) => {
    const res = await page.goto(BASE_URL);
    expect(res?.status() ?? 200, "Homepage returned 5xx").toBeLessThan(500);
  });

  test("login route does not return a 5xx error", async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/login`);
    expect(res?.status() ?? 200, "/login returned 5xx").toBeLessThan(500);
  });

  test("pricing route does not return a 5xx error", async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/pricing`);
    expect(res?.status() ?? 200, "/pricing returned 5xx").toBeLessThan(500);
  });

  test("API health endpoint responds 2xx", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/health`);
    expect(res.status(), "/api/health did not return 2xx").toBeLessThan(300);
  });

  test("dashboard does not crash (5xx) for unauthenticated users", async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/dashboard`);
    expect(res?.status() ?? 200, "/dashboard returned 5xx").toBeLessThan(500);
  });
});
