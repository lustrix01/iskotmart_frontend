import { expect, test } from "@playwright/test";
import { mockAuthenticatedUser } from "./support/mock-session.js";
import { screenshotEvidence } from "./support/selectors.js";

test.describe("merchant product and service CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page, "merchant");
  });

  test("merchant validates and creates an item, then opens retire confirmation", async ({ page }) => {
    const itemName = `E2E Product ${Date.now()}`;
    const offerings = [
      {
        id: 501,
        type: "product",
        name: "Existing Mock Product",
        category: "Books & Media",
        price: 120,
        stock: 8,
        status: "Active",
        description: "Seed product",
        images: [],
      },
    ];

    await page.route("**/api/merchant_offerings.php", async (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        offerings.push({
          id: 999,
          type: "product",
          name: itemName,
          category: "Electronics & Technology",
          price: 99,
          stock: 5,
          status: "Active",
          description: "Automated test product created by Playwright.",
          images: [],
        });
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ offerings }),
      });
    });

    await page.goto("/merchant/products");
    await expect(page.getByText("Inventory Management")).toBeVisible();

    await page.getByRole("button", { name: /add new product/i }).click();
    await page.getByRole("button", { name: /create item/i }).click();
    await expect(page.getByText(/name is required/i)).toBeVisible();

    const modal = page.locator(".fixed").filter({ hasText: /add new product/i }).last();
    await modal.locator('input[type="text"]').first().fill(itemName);
    await modal.locator("textarea").fill("Automated test product created by Playwright.");
    await modal.locator('input[type="number"]').first().fill("99");
    await modal.locator('input[type="number"]').nth(1).fill("5");
    await page.getByRole("button", { name: /create item/i }).click();

    await expect(page.getByText(itemName)).toBeVisible({ timeout: 15_000 });
    await screenshotEvidence(page, "16-merchant-product-created");

    const row = page.getByRole("row", { name: new RegExp(itemName) });
    await row.locator("button").last().click();
    await expect(page.getByRole("heading", { name: /delete item/i })).toBeVisible();
    await screenshotEvidence(page, "17-merchant-retire-confirmation");
  });

  test("merchant product form rejects negative price and stock edge cases", async ({ page }) => {
    await page.route("**/api/merchant_offerings.php", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ offerings: [] }),
      });
    });

    await page.goto("/merchant/products");
    await expect(page.getByText("Inventory Management")).toBeVisible();

    await page.getByRole("button", { name: /add new product/i }).click();
    const modal = page.locator(".fixed").filter({ hasText: /add new product/i }).last();

    await modal.locator('input[type="text"]').first().fill("Invalid Edge Product");
    await modal.locator('input[type="number"]').first().fill("-1");
    await page.getByRole("button", { name: /create item/i }).click();
    await expect(page.getByText(/price must be a whole number/i)).toBeVisible();

    await modal.locator('input[type="number"]').first().fill("10");
    await modal.locator('input[type="number"]').nth(1).fill("-5");
    await page.getByRole("button", { name: /create item/i }).click();
    await expect(page.getByText(/stock must be zero or greater/i)).toBeVisible();
    await screenshotEvidence(page, "18-merchant-product-negative-values");
  });

  test("merchant service form rejects zero slots", async ({ page }) => {
    await page.route("**/api/merchant_offerings.php", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ offerings: [] }),
      });
    });

    await page.goto("/merchant/products");
    await page.getByRole("button", { name: "Services", exact: true }).click();
    await page.getByRole("button", { name: /add new service/i }).click();

    const modal = page.locator(".fixed").filter({ hasText: /add new service/i }).last();
    await modal.locator('input[type="text"]').first().fill("Invalid Slot Service");
    await modal.locator('input[type="number"]').first().fill("100");
    await modal.locator('input[type="number"]').nth(1).fill("0");
    await page.getByRole("button", { name: /create item/i }).click();

    await expect(page.getByText(/service slots must be at least 1/i)).toBeVisible();
    await screenshotEvidence(page, "19-merchant-service-slots-validation");
  });
});
