export const evidencePath = (name) =>
  `test-results/evidence/${name.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase()}.png`;

export async function screenshotEvidence(page, name) {
  await page.screenshot({ path: evidencePath(name), fullPage: true });
}

export async function waitForNoLoadingText(page) {
  await page.waitForFunction(() => {
    const text = document.body?.innerText || "";
    return !/\bLoading\b/i.test(text);
  });
}

export async function waitForLoginPage(page) {
  await page.getByRole("button", { name: "Sign In" }).waitFor({
    state: "visible",
  });
}

export async function waitForStorefrontReady(page) {
  await page.getByRole("link", { name: /iskomart/i }).waitFor({
    state: "visible",
  });
  await waitForNoLoadingText(page);
}

export async function dismissOptionalDialogs(page) {
  const closeButtons = [
    page.getByRole("button", { name: /close/i }),
    page.getByRole("button", { name: /cancel/i }),
  ];

  for (const button of closeButtons) {
    if (await button.first().isVisible().catch(() => false)) {
      await button.first().click();
    }
  }
}
