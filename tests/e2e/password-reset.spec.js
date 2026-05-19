import { expect, test } from "@playwright/test";
import { screenshotEvidence } from "./support/selectors.js";

test.describe("password reset validation", () => {
  test("forgot password shows a prepared reset link from the API", async ({ page }) => {
    await page.route("**/api/forgot_password.php", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Reset instructions are ready.",
          resetLink: "http://localhost:5173/reset-password?token=e2e-token",
        }),
      });
    });

    await page.goto("/forgot-password");
    await page.getByLabel("Email Address").fill("customer@example.com");
    await page.getByRole("button", { name: /prepare reset link/i }).click();

    await expect(page.getByText(/reset instructions are ready/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /reset-password\?token=e2e-token/i })).toBeVisible();
    await screenshotEvidence(page, "forgot-password-reset-link");
  });

  test("reset password blocks missing token and weak password inputs", async ({ page }) => {
    await page.goto("/reset-password");

    await expect(page.getByRole("button", { name: /reset password/i })).toBeDisabled();

    await page.goto("/reset-password?token=e2e-token");
    await page.getByLabel("New Password").fill("weak");
    await page.locator("#confirmPassword").fill("weak");
    await page.getByRole("button", { name: /reset password/i }).click();

    await expect(page.locator(".text-red-600").filter({ hasText: /password must be at least 10 characters/i })).toBeVisible();
    await screenshotEvidence(page, "reset-password-validation");
  });
});
