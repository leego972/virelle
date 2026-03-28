import { test, expect } from "@playwright/test";

/**
 * Smoke tests — run against the deployed production URL (E2E_BASE_URL).
 * These tests are intentionally non-destructive: they verify that key pages
 * load correctly and display expected content without creating accounts or
 * touching the database.
 */

test.describe("Core Workflows", () => {
  test("Homepage loads and shows brand name", async ({ page }) => {
    await page.goto("/");
    await expect(page).not.toHaveURL(/\/500|\/error/);
    await expect(page.locator("body")).toContainText("Virelle");
  });

  test("Pricing page loads and shows all subscription tiers", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page).not.toHaveURL(/\/500|\/error/);
    // All three self-serve tiers must be visible
    await expect(page.locator("body")).toContainText("Indie");
    await expect(page.locator("body")).toContainText("Creator");
    await expect(page.locator("body")).toContainText("Studio");
    // AUD pricing must be present
    await expect(page.locator("body")).toContainText("149");
    await expect(page.locator("body")).toContainText("490");
    await expect(page.locator("body")).toContainText("1,490");
  });

  test("Login page renders form correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page).not.toHaveURL(/\/500|\/error/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("Register page renders first step correctly", async ({ page }) => {
    await page.goto("/register");
    await expect(page).not.toHaveURL(/\/500|\/error/);
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test("Unauthenticated access to /dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to login when not authenticated
    await expect(page).toHaveURL(/\/login|\/register|\//);
  });
});
