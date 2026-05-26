import { test, expect } from "@playwright/test";

  /**
   * Smoke Tests — Critical Paths
   *
   * These tests verify that key routes return non-500 HTTP responses.
   * They run only when E2E_BASE_URL points to a real deployment (not localhost).
   * Set E2E_BASE_URL=https://virelle.life in the GitHub "staging" environment secret.
   */

  const BASE_URL = process.env.E2E_BASE_URL ?? "";

  const isRealDeployment =
    BASE_URL.startsWith("https://") &&
    !BASE_URL.includes("localhost") &&
    !BASE_URL.includes("127.0.0.1");

  test.describe("Smoke Tests — Critical Paths", () => {
    test.beforeEach(({}, testInfo) => {
      if (!isRealDeployment) {
        testInfo.skip(true, `E2E_BASE_URL not set to a real deployment (got: "${BASE_URL || 'unset'}"). Skipping.`);
      }
    });

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
  