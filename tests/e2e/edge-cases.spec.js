import { expect, test } from "@playwright/test";
import { screenshotEvidence, waitForNoLoadingText, waitForStorefrontReady } from "./support/selectors.js";

test.describe("routing and API edge cases", () => {
  test("unknown routes fall back to the storefront", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");

    await expect(page).toHaveURL(/\/$/);
    await waitForStorefrontReady(page);
    await screenshotEvidence(page, "10-unknown-route-fallback");
  });

  test("storefront survives failed listing API response", async ({ page }) => {
    await page.route("**/api/storefront_offerings.php**", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Forced E2E storefront failure" }),
      });
    });

    await page.goto("/");
    await expect(page.getByRole("link", { name: /iskomart/i })).toBeVisible();
    await waitForNoLoadingText(page);
    await expect(page.getByText(/forced e2e storefront failure/i).first()).toBeVisible();
    await screenshotEvidence(page, "11-storefront-api-failure-survives");
  });

  test("AI help prompts guests to log in instead of calling chat API", async ({ page }) => {
    let chatApiCalled = false;
    await page.route("**/api/ai_help_chat.php", async (route) => {
      chatApiCalled = true;
      await route.continue();
    });

    await page.goto("/");
    const chatButton = page.getByRole("button", { name: "Open AI help chat" });
    await expect(chatButton).toBeVisible({ timeout: 10_000 });

    await chatButton.click();
    await expect(page.getByText(/login required|login now|sign in/i).first()).toBeVisible();
    expect(chatApiCalled).toBe(false);
    await screenshotEvidence(page, "12-ai-help-guest-login-required");
  });
});
