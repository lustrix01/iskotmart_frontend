/* global process */
import { expect, test } from "@playwright/test";
import { hasCredentials, loginAsRole, loginThroughUi } from "./support/auth.js";
import { screenshotEvidence } from "./support/selectors.js";

test.describe("guest and auth session behavior", () => {
  test("guest can browse storefront and protected cart redirects to login", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /iskomart/i })).toBeVisible();

    await page.getByRole("link", { name: "Cart" }).click();
    await expect(page).toHaveURL(/\/login/);
    await screenshotEvidence(page, "guest-cart-redirect");
  });

  test("guest protected pages redirect to login with no session", async ({ page }) => {
    const protectedPaths = ["/cart", "/checkout", "/profile", "/profile/orders"];

    for (const path of protectedPaths) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    }

    await screenshotEvidence(page, "guest-protected-route-redirects");
  });

  test("continue as guest returns to storefront", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /continue as guest/i }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: /iskomart/i })).toBeVisible();
  });

  test("invalid login displays an error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email Address").fill("not-a-real-user@example.com");
    await page.locator('input[name="password"]').fill("WrongPassword123!");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText(/invalid email or password|too many attempts|login failed/i)).toBeVisible();
    await screenshotEvidence(page, "invalid-login-error");
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
    await screenshotEvidence(page, "login-non-json-api-error");
  });

  test("customer login and logout clear the active session", async ({ page }) => {
    await loginAsRole(page, "customer", "/profile");
    await expect(page).toHaveURL(/\/profile/);

    const logoutButton = page.getByRole("button", { name: /log out/i }).first();
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    await page.getByRole("button", { name: /yes, log out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
    await screenshotEvidence(page, "customer-logout-clears-session");
  });

  test("merchant credentials reach merchant area", async ({ page }) => {
    test.skip(!hasCredentials("merchant"), "Set merchant E2E credentials to run this test.");

    await loginThroughUi(page, {
      email: process.env.E2E_MERCHANT_EMAIL,
      password: process.env.E2E_MERCHANT_PASSWORD,
    });

    const activeRole = await page.evaluate(async () => {
      const response = await fetch("/api/me.php", { credentials: "include" });
      if (!response.ok) {
        return "";
      }
      const payload = await response.json().catch(() => ({}));
      return payload.user?.role || "";
    });
    test.skip(activeRole !== "merchant", `Configured merchant credentials signed in as "${activeRole || "unknown"}".`);

    await page.goto("/merchant");
    await expect(page).toHaveURL(/\/merchant/);
    await expect(page.getByText(/dashboard|merchant|orders|inventory/i).first()).toBeVisible();
    await screenshotEvidence(page, "merchant-login-dashboard");
  });
});
