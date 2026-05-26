import { test, expect } from "@playwright/test";

  /**
   * Core Workflow Tests
   *
   * These tests verify that key application routes return non-500 HTTP responses.
   * They run only when E2E_BASE_URL points to a real deployment (not localhost).
   * Set E2E_BASE_URL=https://virelle.life in the GitHub "staging" environment secret.
   */

  const BASE_URL = process.env.E2E_BASE_URL ?? "";

  const isRealDeployment =
    BASE_URL.startsWith("https://") &&
    !BASE_URL.includes("localhost") &&
    !BASE_URL.includes("127.0.0.1");

  test.describe("Core Workflows", () => {
    test.beforeEach(({}, testInfo) => {
      if (!isRealDeployment) {
        testInfo.skip(true, `E2E_BASE_URL not set to a real deployment (got: "${BASE_URL || 'unset'}"). Skipping.`);
      }
    });

    test("Homepage does not return a 5xx error", async ({ page }) => {
      const res = await page.goto(`${BASE_URL}/`);
      expect(res?.status() ?? 200, "Homepage returned 5xx").toBeLessThan(500);
    });

    test("Pricing page does not return a 5xx error", async ({ page }) => {
      const res = await page.goto(`${BASE_URL}/pricing`);
      expect(res?.status() ?? 200, "/pricing returned 5xx").toBeLessThan(500);
    });

    test("Login page does not return a 5xx error", async ({ page }) => {
      const res = await page.goto(`${BASE_URL}/login`);
      expect(res?.status() ?? 200, "/login returned 5xx").toBeLessThan(500);
    });

    test("Register page does not return a 5xx error", async ({ page }) => {
      const res = await page.goto(`${BASE_URL}/register`);
      expect(res?.status() ?? 200, "/register returned 5xx").toBeLessThan(500);
    });

    test("Dashboard does not crash (5xx) for unauthenticated users", async ({ page }) => {
      const res = await page.goto(`${BASE_URL}/dashboard`);
      expect(res?.status() ?? 200, "/dashboard returned 5xx").toBeLessThan(500);
    });
  });
  