import { test, expect } from '@playwright/test';

// Basic end-to-end auth + dashboard smoke
// Registers a new user with unique email then verifies dashboard renders.

function uniqueEmail(): string {
  const ts = String(Date.now());
  const rand = String(Math.floor(Math.random() * 1000));
  return 'user_' + ts + '_' + rand + '@example.com';
}

const strongPassword = 'StrongerPass123!';

test('register and reach dashboard', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel(/Email/i).fill(uniqueEmail());
  await page.getByLabel(/Password/i).fill(strongPassword);
  await page.getByRole('button', { name: /Create Account/i }).click();
  // Wait for redirect to root
  await page.waitForURL((url) => /\/($|\?)/.test(url.pathname));
  await expect(async () => {
    const hasToken = await page.evaluate(() => !!localStorage.getItem('refreshToken'));
    expect(hasToken).toBeTruthy();
  }).toPass();
  await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Budget/i })).toBeVisible();
});
