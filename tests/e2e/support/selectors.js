export const evidencePath = (name) =>
  `test-results/evidence/${name.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase()}.png`;

export async function screenshotEvidence(page, name) {
  await page.screenshot({ path: evidencePath(name), fullPage: true });
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
