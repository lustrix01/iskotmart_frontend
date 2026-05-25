import { test, expect } from '@playwright/test';

test.describe('E-Commerce Capstone Testing', () => {

    // OWHIE — LOGIN & AUTHENTICATION
    test('Owhie: Successful Login', async ({ page }) => {
        await page.goto('http://localhost:5173/login');
        await page.getByPlaceholder('Enter your email').fill('user@iskomart.com');
        await page.getByPlaceholder('Enter your password').fill('ValidPass123!');
        await page.getByRole('button', { name: 'Login' }).click();
        
        await page.waitForTimeout(1000); // Wait for UI
        await page.screenshot({ path: 'screenshots/owhie-successful-login.png' });
    });

    test('Owhie: Invalid Login', async ({ page }) => {
        await page.goto('http://localhost:5173/login');
        await page.getByPlaceholder('Enter your email').fill('user@iskomart.com');
        await page.getByPlaceholder('Enter your password').fill('WrongPassword');
        await page.getByRole('button', { name: 'Login' }).click();
        
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/owhie-invalid-login.png' });
    });

    test('Owhie: Empty Fields Validation', async ({ page }) => {
        await page.goto('http://localhost:5173/login');
        await page.getByRole('button', { name: 'Login' }).click();
        
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/owhie-empty-fields.png' });
    });

    // ANGELA — PRODUCT BROWSING & SEARCH
    test('Angela: Search Existing Product', async ({ page }) => {
        await page.goto('http://localhost:5173/products');
        const searchInput = page.getByPlaceholder('Search products...');
        await searchInput.fill('Laptop');
        await searchInput.press('Enter');
        
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/angela-search-existing.png' });
    });

    test('Angela: Search Invalid Product', async ({ page }) => {
        await page.goto('http://localhost:5173/products');
        const searchInput = page.getByPlaceholder('Search products...');
        await searchInput.fill('XyZ123');
        await searchInput.press('Enter');
        
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/angela-search-invalid.png' });
    });

    test('Angela: Product Filtering', async ({ page }) => {
        await page.goto('http://localhost:5173/products');
        // Assume there's a category button for electronics
        await page.getByRole('button', { name: 'Electronics' }).click();
        
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/angela-product-filtering.png' });
    });

    // JAZMIN — CART FUNCTIONALITY
    test('Jazmin: Add to Cart', async ({ page }) => {
        await page.goto('http://localhost:5173/products/1');
        await page.getByRole('button', { name: 'Add to Cart' }).click();
        
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/jazmin-add-to-cart.png' });
    });

    test('Jazmin: Remove from Cart', async ({ page }) => {
        await page.goto('http://localhost:5173/cart');
        await page.locator('.remove-item-btn').first().click();
        
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/jazmin-remove-from-cart.png' });
    });

    test('Jazmin: Quantity Update', async ({ page }) => {
        await page.goto('http://localhost:5173/cart');
        await page.getByRole('button', { name: 'Increase Quantity' }).click();
        
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/jazmin-quantity-update.png' });
    });

    // MICAIAH — CHECKOUT & ORDERS
    test('Micaiah: Checkout Process', async ({ page }) => {
        await page.goto('http://localhost:5173/checkout');
        await page.getByPlaceholder('Full Name').fill('John Doe');
        await page.getByPlaceholder('Phone Number').fill('09123456789');
        await page.getByPlaceholder('Address').fill('123 Test Street');
        await page.getByRole('button', { name: 'Place Order' }).click();
        
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/micaiah-checkout-process.png' });
    });

    test('Micaiah: Required Field Validation', async ({ page }) => {
        await page.goto('http://localhost:5173/checkout');
        await page.getByRole('button', { name: 'Place Order' }).click();
        
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/micaiah-required-validation.png' });
    });

    test('Micaiah: Order Confirmation', async ({ page }) => {
        await page.goto('http://localhost:5173/order-success');
        
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/micaiah-order-confirmation.png' });
    });

    // MICKOLE — MERCHANT CRUD / REPORTS
    test('Mickole: Add Product', async ({ page }) => {
        await page.goto('http://localhost:5173/merchant/add-product');
        await page.getByPlaceholder('Product Name').fill('New Test Item');
        await page.getByPlaceholder('Price').fill('50.00');
        await page.getByRole('button', { name: 'Save Product' }).click();
        
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/mickole-add-product.png' });
    });

    test('Mickole: Update Product', async ({ page }) => {
        await page.goto('http://localhost:5173/merchant/inventory');
        await page.locator('tr', { hasText: 'Test Item' }).getByRole('button', { name: 'Edit' }).first().click();
        await page.getByPlaceholder('Price').fill('75.00');
        await page.getByRole('button', { name: 'Save Changes' }).click();
        
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/mickole-update-product.png' });
    });

    test('Mickole: Delete Product', async ({ page }) => {
        await page.goto('http://localhost:5173/merchant/inventory');
        await page.locator('tr', { hasText: 'Test Item' }).getByRole('button', { name: 'Delete' }).first().click();
        await page.getByRole('button', { name: 'Confirm Deletion' }).click();
        
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/mickole-delete-product.png' });
    });

});
