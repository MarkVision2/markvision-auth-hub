import { test, expect } from "@playwright/test";

test.describe("Auth Page", () => {
  test("login page loads and shows auth form", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/MarkVision/);
    // Auth form has email and password inputs
    await expect(page.getByPlaceholder("you@agency.com")).toBeVisible();
    await expect(page.getByRole("button", { name: /войти/i })).toBeVisible();
  });

  test("auth page shows login and registration tabs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Вход")).toBeVisible();
    await expect(page.getByText("Регистрация")).toBeVisible();
  });
});
