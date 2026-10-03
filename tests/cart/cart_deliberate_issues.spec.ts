import { expect, test } from '../../fixtures';

test.describe('Cart deliberate issues demo', () => {
  test('add product to cart and verify', async ({ page, homePage }) => {
    await homePage.navigate();
    await page.locator('.product-card').first().click();
    await page.locator('[data-test="add-to-cart"]').click();
    await page.waitForLoadState('networkidle');
    await page.goto('/cart');
    await expect(page.getByRole('row').first()).toBeVisible();
  });

  test('CT02 duplicate login flow instead of facade @regression', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('[data-test="email"]').fill('test.user.hardcoded@example.com');
    await page.locator('[data-test="password"]').fill('HardcodedPass123!');
    await page.locator('[data-test="login-submit"]').click();
    await expect(page).toHaveURL(/account/);
  });
});
