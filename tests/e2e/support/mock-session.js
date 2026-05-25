export const mockUsers = {
  customer: {
    id: 9101,
    role: "customer",
    name: "E2E Customer",
    email: "e2e.customer@example.test",
  },
  merchant: {
    id: 9201,
    role: "merchant",
    name: "E2E Merchant",
    email: "e2e.merchant@bicol-u.edu.ph",
  },
};

export async function mockAuthenticatedUser(page, role) {
  const user = mockUsers[role];

  await page.route("**/api/me.php", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user }),
    });
  });

  await page.route("**/api/nav_counts.php", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ unreadMessages: 0 }),
    });
  });

  if (role === "customer") {
    await page.route("**/api/profile.php", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          profile: {
            displayName: "E2E Customer",
            name: "E2E Customer",
            avatarUrl: "",
          },
        }),
      });
    });
  }

  if (role === "merchant") {
    await page.route("**/api/merchant_dashboard.php", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          profile: {
            shopName: "E2E Test Shop",
            initials: "ET",
            avatarUrl: "",
          },
        }),
      });
    });
  }
}

export async function seedCustomerCart(page, cart) {
  await page.addInitScript(
    ({ userId, nextCart }) => {
      localStorage.setItem(
        `iskotmart_cart_v1_customer_${userId}`,
        JSON.stringify(nextCart),
      );
    },
    { userId: mockUsers.customer.id, nextCart: cart },
  );
}
