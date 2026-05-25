import { expect, test } from "@playwright/test";
import { mockAuthenticatedUser, seedCustomerCart } from "./support/mock-session.js";
import { screenshotEvidence } from "./support/selectors.js";

test.describe("customer cart and checkout", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page, "customer");
  });

  test("checkout page exposes COD and GCash payment paths and required-info protection", async ({ page }) => {
    await seedCustomerCart(page, {
      product: [
        {
          id: 7001,
          name: "E2E Mock Product",
          price: 150,
          qty: 1,
          merchantId: 9201,
          merchantName: "E2E Test Shop",
          type: "product",
        },
      ],
      service: [],
    });
    await page.route("**/api/addresses.php", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ addresses: [] }),
      });
    });
    await page.route("**/api/checkout_payment_options.php", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          allowedMethods: { cod: true, gcash: true },
          deliveryOptions: { standard: true, pickup: true, deliveryFee: 50 },
          merchants: [
            {
              id: 9201,
              name: "E2E Test Shop",
              methods: [
                {
                  id: 1,
                  kind: "gcash",
                  label: "GCash",
                  accountNumber: "09171234567",
                  username: "E2E Test Shop",
                  qrImageUrl: "",
                },
              ],
            },
          ],
        }),
      });
    });

    await page.goto("/checkout");

    await expect(page.getByText(/checkout|order summary/i).first()).toBeVisible();
    await expect(page.getByText(/cod|cash on delivery/i).first()).toBeVisible();
    await expect(page.getByText(/gcash/i).first()).toBeVisible();

    const placeOrder = page.getByRole("button", { name: /place order now|proceed to gcash/i });
    await expect(placeOrder).toBeVisible();
    await screenshotEvidence(page, "20-checkout-payment-options");
  });

  test("checkout disables product order when the customer has no saved address", async ({ page }) => {
    await seedCustomerCart(page, {
      product: [
        {
          id: 7002,
          name: "Address Required Product",
          price: 250,
          qty: 1,
          merchantId: 9201,
          merchantName: "E2E Test Shop",
          type: "product",
        },
      ],
      service: [],
    });
    await page.route("**/api/addresses.php", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ addresses: [] }),
      });
    });
    await page.route("**/api/checkout_payment_options.php", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          allowedMethods: { cod: true, gcash: false },
          deliveryOptions: { standard: true, pickup: true, deliveryFee: 50 },
          merchants: [],
        }),
      });
    });

    await page.goto("/checkout");

    await expect(page.getByRole("button", { name: /place order now/i })).toBeDisabled();
    await expect(page.getByText(/add a shipping address to continue/i)).toBeVisible();
    await screenshotEvidence(page, "21-checkout-address-required");
  });
});
