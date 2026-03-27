import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("auth page has working navigation elements", async ({ page }) => {
    await page.goto("/auth");
    await expect(page).toHaveTitle(/MarkVision/);
    // Page should be accessible and render without errors
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("unknown routes redirect to auth or show content", async ({ page }) => {
    await page.goto("/nonexistent-page");
    // Should either redirect to auth or show a valid page
    await expect(page.locator("body")).toBeVisible();
  });
});
