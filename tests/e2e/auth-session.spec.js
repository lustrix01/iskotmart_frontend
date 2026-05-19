/* global process */
import { expect, test } from "@playwright/test";
import { hasCredentials, loginThroughUi } from "./support/auth.js";
import { screenshotEvidence, waitForLoginPage, waitForStorefrontReady } from "./support/selectors.js";

test.describe("guest and auth session behavior", () => {
  test.describe.configure({ mode: "serial" });

  test("guest can browse storefront and protected cart redirects to login", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /iskomart/i })).toBeVisible();

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL(/\/login/);
    await waitForLoginPage(page);
    await screenshotEvidence(page, "01-guest-cart-redirect");
  });

  test("guest protected pages redirect to login with no session", async ({ page }) => {
    const protectedPaths = ["/cart", "/checkout", "/profile", "/profile/orders"];

    for (const path of protectedPaths) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
      await waitForLoginPage(page);
    }

    await screenshotEvidence(page, "02-guest-protected-route-redirects");
  });

  test("continue as guest returns to storefront", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /continue as guest/i }).click();

    await expect(page).toHaveURL(/\/$/);
    await waitForStorefrontReady(page);
    await screenshotEvidence(page, "03-continue-as-guest");
  });

  test("invalid login displays an error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email Address").fill("not-a-real-user@example.com");
    await page.locator('input[name="password"]').fill("WrongPassword123!");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText(/invalid email or password|too many attempts|login failed/i)).toBeVisible();
    await screenshotEvidence(page, "04-invalid-login-error");
  });

  test("login handles non-json API response without crashing", async ({ page }) => {
    await page.route("**/api/login.php", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<!doctype html><h1>Unexpected server page</h1>",
      });
    });

    await page.goto("/login");
    await page.getByLabel("Email Address").fill("customer@example.com");
    await page.locator('input[name="password"]').fill("Password123!");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText(/login api returned a non-json response/i)).toBeVisible();
    await screenshotEvidence(page, "05-login-non-json-api-error");
  });

  test("customer login and logout clear the active session", async ({ page }) => {
    test.skip(!hasCredentials("customer"), "Set customer E2E credentials to run this test.");

    await loginThroughUi(page, {
      email: process.env.E2E_CUSTOMER_EMAIL,
      password: process.env.E2E_CUSTOMER_PASSWORD,
    });
    await page.getByRole("link", { name: /my profile/i }).click();
    await expect(page).toHaveURL(/\/profile/);

    const logoutButton = page.getByRole("button", { name: /log out/i }).first();
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    await page.getByRole("button", { name: /yes, log out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
    await screenshotEvidence(page, "28-customer-logout-clears-session");
  });

  test("merchant credentials reach merchant area", async ({ page }) => {
    test.skip(!hasCredentials("merchant"), "Set merchant E2E credentials to run this test.");

    await loginThroughUi(page, {
      email: process.env.E2E_MERCHANT_EMAIL,
      password: process.env.E2E_MERCHANT_PASSWORD,
    });

    await expect(page).toHaveURL(/\/merchant/);
    await expect(page.getByText(/dashboard|merchant|orders|inventory/i).first()).toBeVisible();
    await screenshotEvidence(page, "29-merchant-login-dashboard");
  });
});
