import { test, expect } from "@playwright/test";

/**
 * Core Workflow Tests
 *
 * These tests verify that key application routes return non-500 HTTP
 * responses. They do NOT assert page content since the production URL
 * may serve a CDN/parking page before the app is fully deployed.
 *
 * Once the app is live at the production URL, these tests can be
 * expanded to assert specific UI elements and user flows.
 */

test.describe("Core Workflows", () => {
  test("Homepage does not return a 5xx error", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status() ?? 200, "Homepage returned 5xx").toBeLessThan(500);
  });

  test("Pricing page does not return a 5xx error", async ({ page }) => {
    const res = await page.goto("/pricing");
    expect(res?.status() ?? 200, "/pricing returned 5xx").toBeLessThan(500);
  });

  test("Login page does not return a 5xx error", async ({ page }) => {
    const res = await page.goto("/login");
    expect(res?.status() ?? 200, "/login returned 5xx").toBeLessThan(500);
  });

  test("Register page does not return a 5xx error", async ({ page }) => {
    const res = await page.goto("/register");
    expect(res?.status() ?? 200, "/register returned 5xx").toBeLessThan(500);
  });

  test("Dashboard does not crash (5xx) for unauthenticated users", async ({ page }) => {
    const res = await page.goto("/dashboard");
    expect(res?.status() ?? 200, "/dashboard returned 5xx").toBeLessThan(500);
  });
});
