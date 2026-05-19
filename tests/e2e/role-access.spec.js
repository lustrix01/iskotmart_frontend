import { expect, test } from "@playwright/test";
import { mockAuthenticatedUser } from "./support/mock-session.js";
import { screenshotEvidence, waitForStorefrontReady } from "./support/selectors.js";

test.describe("role-based access control", () => {
  test("customer session cannot access merchant command center", async ({ page }) => {
    await mockAuthenticatedUser(page, "customer");

    await page.goto("/merchant/products");

    await expect(page).toHaveURL(/\/$/);
    await waitForStorefrontReady(page);
    await screenshotEvidence(page, "26-customer-blocked-from-merchant");
  });

  test("merchant session cannot access customer profile pages", async ({ page }) => {
    await mockAuthenticatedUser(page, "merchant");

    await page.goto("/profile/orders");

    await expect(page).toHaveURL(/\/$/);
    await waitForStorefrontReady(page);
    await screenshotEvidence(page, "27-merchant-blocked-from-customer-profile");
  });
});
