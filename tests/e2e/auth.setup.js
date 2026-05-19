/* global process */
import { test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { loginThroughUi } from "./support/auth.js";

const authDir = path.join(process.cwd(), "tests", ".auth");

async function saveStorageState(browser, filename, credentials) {
  const context = await browser.newContext();
  const page = await context.newPage();

  if (credentials.email && credentials.password) {
    await loginThroughUi(page, credentials);
  }

  await context.storageState({ path: path.join(authDir, filename) });
  await context.close();
}

test("create reusable authenticated browser states", async ({ browser }) => {
  await fs.mkdir(authDir, { recursive: true });

  await saveStorageState(browser, "customer.json", {
    email: process.env.E2E_CUSTOMER_EMAIL,
    password: process.env.E2E_CUSTOMER_PASSWORD,
  });

  await saveStorageState(browser, "merchant.json", {
    email: process.env.E2E_MERCHANT_EMAIL,
    password: process.env.E2E_MERCHANT_PASSWORD,
  });
});
