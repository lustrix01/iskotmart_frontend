import { expect, test } from "@playwright/test";
import { screenshotEvidence } from "./support/selectors.js";

test.describe("registration and validation", () => {
  test("customer signup blocks weak passwords before submission", async ({ page }) => {
    await page.goto("/signup/customer");

    await page.locator('input[type="text"]').nth(0).fill("Edge");
    await page.locator('input[type="text"]').nth(1).fill("Case");
    await page.locator('input[name="gender"][value="Other"]').check();
    await page.locator('input[type="text"]').nth(2).fill(`edge_${Date.now()}`);
    await page.locator('input[type="email"]').fill(`edge.${Date.now()}@example.com`);
    await page.locator('input[type="tel"]').fill("9123456789");
    await page.getByPlaceholder("DD").fill("01");
    await page.getByPlaceholder("MM").fill("01");
    await page.getByPlaceholder("YYYY").fill("2000");
    await page.locator('input[type="password"]').nth(0).fill("weak");
    await page.locator('input[type="password"]').nth(1).fill("weak");
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(
      page.locator("p").filter({ hasText: /use at least 10 characters/i }).last(),
    ).toBeVisible();
    await screenshotEvidence(page, "13-customer-signup-weak-password");
  });

  test("customer signup mismatch password shows a validation dialog", async ({ page }) => {
    await page.goto("/signup/customer");

    await page.locator('input[type="text"]').nth(0).fill("Mismatch");
    await page.locator('input[type="text"]').nth(1).fill("Case");
    await page.locator('input[name="gender"][value="Other"]').check();
    await page.locator('input[type="text"]').nth(2).fill(`mismatch_${Date.now()}`);
    await page.locator('input[type="email"]').fill(`mismatch.${Date.now()}@example.com`);
    await page.locator('input[type="tel"]').fill("9123456789");
    await page.getByPlaceholder("DD").fill("01");
    await page.getByPlaceholder("MM").fill("01");
    await page.getByPlaceholder("YYYY").fill("2000");
    await page.locator('input[type="password"]').nth(0).fill("StrongPass!123");
    await page.locator('input[type="password"]').nth(1).fill("DifferentPass!123");
    await page.locator('input[type="checkbox"]').check();

    let dialogMessage = "";
    page.once("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    await page.getByRole("button", { name: /create account/i }).click();
    await expect.poll(() => dialogMessage).toContain("Passwords don't match");

    await expect(page).toHaveURL(/\/signup\/customer/);
    await screenshotEvidence(page, "14-customer-signup-password-mismatch");
  });

  test("merchant signup rejects non-Bicol University email domain", async ({ page }) => {
    await page.goto("/signup/merchant");

    await page.locator('input[name="businessName"]').fill("E2E Test Shop");
    await page.locator('select[name="bizProvince"]').selectOption("Albay");
    await page.locator('select[name="bizCity"]').selectOption("Legazpi City");
    await page.locator('input[name="sameAsBiz"]').check();
    await page.getByRole("button", { name: /continue/i }).click();

    await page.locator('input[name="firstName"]').fill("Merchant");
    await page.locator('input[name="lastName"]').fill("Domain");
    await page.locator('input[name="username"]').fill(`merchant_domain_${Date.now()}`);
    await page.locator('input[name="gender"][value="Male"]').check();
    await page.locator('input[name="studentEmail"]').fill("merchant@example.com");
    await page.locator('input[name="phone"]').fill("9123456789");
    await page.locator('input[name="studentNumber"]').fill("2024-0001");
    await page.locator('input[name="dobDay"]').fill("01");
    await page.locator('input[name="dobMonth"]').fill("01");
    await page.locator('input[name="dobYear"]').fill("2000");
    await page.locator('input[name="password"]').fill("StrongPass!123");
    await page.locator('input[name="confirmPassword"]').fill("StrongPass!123");

    let dialogMessage = "";
    page.once("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    await page.getByRole("button", { name: /continue/i }).click();

    await expect(page.getByText(/only valid @bicol-u\.edu\.ph email addresses are allowed/i)).toBeVisible();
    await expect.poll(() => dialogMessage).toContain("@bicol-u.edu.ph");
    await screenshotEvidence(page, "15-merchant-signup-domain-validation");
  });
});
