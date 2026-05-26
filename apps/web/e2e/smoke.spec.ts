import { test, expect } from "@playwright/test";

  const BASE_URL = (process.env.E2E_BASE_URL ?? "").trim();
  const isLive = BASE_URL.startsWith("https://") && !BASE_URL.includes("localhost");

  test.describe("Smoke Tests — Critical Paths", () => {
    test.skip(!isLive, `E2E_BASE_URL is not a live HTTPS URL — got "${BASE_URL || 'unset'}". Set it in the GitHub staging environment to run these tests.`);

    test("homepage does not return a 5xx error", async ({ page }) => {
      const res = await page.goto(BASE_URL);
      expect(res?.status() ?? 200).toBeLessThan(500);
    });

    test("login route does not return a 5xx error", async ({ page }) => {
      const res = await page.goto(`${BASE_URL}/login`);
      expect(res?.status() ?? 200).toBeLessThan(500);
    });

    test("pricing route does not return a 5xx error", async ({ page }) => {
      const res = await page.goto(`${BASE_URL}/pricing`);
      expect(res?.status() ?? 200).toBeLessThan(500);
    });

    test("API health endpoint responds 2xx", async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/health`);
      expect(res.status()).toBeLessThan(300);
    });

    test("dashboard does not crash (5xx) for unauthenticated users", async ({ page }) => {
      const res = await page.goto(`${BASE_URL}/dashboard`);
      expect(res?.status() ?? 200).toBeLessThan(500);
    });
  });
  