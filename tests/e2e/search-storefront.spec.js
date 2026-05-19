import { expect, test } from "@playwright/test";
import { screenshotEvidence } from "./support/selectors.js";

test.describe("search and storefront browsing", () => {
  test("navbar search routes to search results with the query", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Search for products, brands and more...").fill("service");
    await page.getByPlaceholder("Search for products, brands and more...").press("Enter");

    await expect(page).toHaveURL(/\/search\?q=service/);
    await expect(page.getByText(/search|results|service/i).first()).toBeVisible();
    await screenshotEvidence(page, "search-results-service");
  });

  test("empty search opens the search page without a query string", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Search for products, brands and more...").press("Enter");

    await expect(page).toHaveURL(/\/search$/);
    await expect(page.getByText(/search|results/i).first()).toBeVisible();
  });

  test("search trims surrounding whitespace in query parameter", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Search for products, brands and more...").fill("   audio   ");
    await page.getByPlaceholder("Search for products, brands and more...").press("Enter");

    await expect(page).toHaveURL(/\/search\?q=audio$/);
  });

  test("product and service listing pages load without guest authentication", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByText(/product|shop/i).first()).toBeVisible();

    await page.goto("/services");
    await expect(page.getByText(/service|book/i).first()).toBeVisible();
  });
});
