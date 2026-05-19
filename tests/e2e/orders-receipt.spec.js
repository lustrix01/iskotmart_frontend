import { expect, test } from "@playwright/test";
import { mockAuthenticatedUser } from "./support/mock-session.js";
import { screenshotEvidence } from "./support/selectors.js";

test.describe("orders and receipt generation", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedUser(page, "customer");
  });

  test("customer orders page can expose receipt printing for an order", async ({ page }) => {
    await page.route("**/api/customer_orders.php", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          orders: [
            {
              id: "E2E-ORDER-1001",
              merchantId: 9201,
              merchant: "E2E Test Shop",
              status: "Completed",
              mode: "Standard delivery",
              payment: "Cash on Delivery",
              paymentStatus: "Paid",
              total: 200,
              items: [
                {
                  id: 7001,
                  offeringId: 7001,
                  name: "Receipt Evidence Product",
                  qty: 1,
                  price: 200,
                  img: "/placeholders/offering.svg",
                },
              ],
            },
          ],
        }),
      });
    });

    await page.goto("/profile/orders");
    await expect(page.getByText(/orders|purchase|history/i).first()).toBeVisible();

    const detailsButton = page.getByRole("button", { name: /view details|details/i }).first();
    await detailsButton.click();
    await expect(page.getByRole("button", { name: /print receipt/i })).toBeVisible();
    await screenshotEvidence(page, "22-order-receipt-dialog");
  });

  test("customer orders show API errors without crashing", async ({ page }) => {
    await page.route("**/api/customer_orders.php", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Forced orders failure" }),
      });
    });

    await page.goto("/profile/orders");

    await expect(page.getByText(/forced orders failure/i)).toBeVisible();
    await screenshotEvidence(page, "23-orders-api-error");
  });
});
