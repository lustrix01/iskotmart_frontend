/* global process */
import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";

export function hasCredentials(role) {
  const prefix = role.toUpperCase();
  return Boolean(
    process.env[`E2E_${prefix}_EMAIL`] &&
      process.env[`E2E_${prefix}_PASSWORD`],
  );
}

export function skipWithoutCredentials(role) {
  test.skip(
    !hasCredentials(role),
    `Set E2E_${role.toUpperCase()}_EMAIL and E2E_${role.toUpperCase()}_PASSWORD to run this test.`,
  );
}

export async function loginThroughUi(page, { email, password }) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="remember"]').check();
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

export async function loginAsRole(page, role, targetPath = "/") {
  skipWithoutCredentials(role);

  const prefix = role.toUpperCase();
  await loginThroughUi(page, {
    email: process.env[`E2E_${prefix}_EMAIL`],
    password: process.env[`E2E_${prefix}_PASSWORD`],
  });

  const activeRole = await page
    .evaluate(async () => {
      const response = await fetch("/api/me.php", { credentials: "include" });
      if (!response.ok) {
        return "";
      }
      const payload = await response.json().catch(() => ({}));
      return payload.user?.role || "";
    })
    .catch(() => "");

  test.skip(
    activeRole !== role,
    `Configured ${role} credentials signed in as "${activeRole || "unknown"}".`,
  );

  await page.goto(targetPath);
  await expect(page).not.toHaveURL(/\/login/);
}

export async function useStoredAuth(page, role) {
  const statePath = `tests/.auth/${role}.json`;
  const context = page.context();
  const state = JSON.parse(await fs.readFile(statePath, "utf8"));

  await context.addCookies(state.cookies || []);
  for (const origin of state.origins || []) {
    if (!origin.localStorage?.length) {
      continue;
    }
    await page.addInitScript((entries) => {
      for (const entry of entries) {
        localStorage.setItem(entry.name, entry.value);
      }
    }, origin.localStorage);
  }
}

export async function skipIfLoginScreen(page, message) {
  const signInButton = page.getByRole("button", { name: "Sign In" });
  const loginScreenVisible = await signInButton
    .waitFor({ state: "visible", timeout: 1500 })
    .then(() => true)
    .catch(() => false);
  test.skip(loginScreenVisible, message);
}
