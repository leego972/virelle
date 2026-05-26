import { test, expect } from "@playwright/test";

  const BASE_URL = (process.env.E2E_BASE_URL ?? "").trim();
  const isLive = BASE_URL.startsWith("https://") && !BASE_URL.includes("localhost");

  test.describe("Core Workflows", () => {
    test.skip(!isLive, `E2E_BASE_URL is not a live HTTPS URL — got "${BASE_URL || 'unset'}". Set it in the GitHub staging environment to run these tests.`);

    test("Homepage does not return a 5xx error", async ({ page }) => {
      const res = await page.goto(`${BASE_URL}/`);
      expect(res?.status() ?? 200).toBeLessThan(500);
    });

    test("Pricing page does not return a 5xx error", async ({ page }) => {
      const res = await page.goto(`${BASE_URL}/pricing`);
      expect(res?.status() ?? 200).toBeLessThan(500);
    });

    test("Login page does not return a 5xx error", async ({ page }) => {
      const res = await page.goto(`${BASE_URL}/login`);
      expect(res?.status() ?? 200).toBeLessThan(500);
    });

    test("Register page does not return a 5xx error", async ({ page }) => {
      const res = await page.goto(`${BASE_URL}/register`);
      expect(res?.status() ?? 200).toBeLessThan(500);
    });

    test("Dashboard does not crash (5xx) for unauthenticated users", async ({ page }) => {
      const res = await page.goto(`${BASE_URL}/dashboard`);
      expect(res?.status() ?? 200).toBeLessThan(500);
    });
  });
  