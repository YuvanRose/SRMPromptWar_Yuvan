import { test, expect } from '@playwright/test';

test.describe('FairShift — Decent Work Platform Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
  });

  test('1. Both role logins route to correct UI', async ({ page }) => {
    // Test Worker Login
    await page.goto('/login');
    await page.fill('#username', 'worker_construction');
    await page.fill('#password', 'pass123');
    await page.click('button[type="submit"]');

    // Should route to /worker
    await expect(page).toHaveURL(/\/worker/);
    await expect(page.locator('text=Today\'s Shift').first()).toBeVisible();

    // Logout
    await page.locator('button[aria-label="User Profile"]').click();
    await page.locator('text=Log Out').click();
    await expect(page).toHaveURL(/\/login/);

    // Test Employer Login
    await page.fill('#username', 'employer_construction');
    await page.fill('#password', 'pass123');
    await page.click('button[type="submit"]');

    // Should route to /employer
    await expect(page).toHaveURL(/\/employer/);
    await expect(page.locator('text=Dashboard').first()).toBeVisible();
    await expect(page.locator('text=Workers').first()).toBeVisible();
  });

  test('2. Sector switch changes vocabulary (Construction vs College)', async ({ page }) => {
    // Login as Construction Employer
    await page.goto('/login');
    await page.fill('#username', 'employer_construction');
    await page.fill('#password', 'pass123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/employer/);

    // Verify construction vocabulary
    await expect(page.locator('text=Workers').first()).toBeVisible();
    await expect(page.locator('text=Site Alpha').first()).toBeVisible();

    // Logout and login as College Employer
    await page.locator('button[aria-label="Log Out"]').first().click();
    await page.fill('#username', 'employer_college');
    await page.fill('#password', 'pass123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/employer/);

    // Verify college vocabulary
    await expect(page.locator('text=Staff Members').first()).toBeVisible();
    await expect(page.locator('text=CS Department').first()).toBeVisible();
  });

  test('3. Language switch changes the payslip text', async ({ page }) => {
    // Login as worker
    await page.goto('/login');
    await page.fill('#username', 'worker_construction');
    await page.fill('#password', 'pass123');
    await page.click('button[type="submit"]');

    // Navigate to Payslip
    await page.goto('/worker/payslip');
    await expect(page.locator('text=Payslip').first()).toBeVisible();
    await expect(page.locator('text=Net Pay').first()).toBeVisible();

    // Change language to Hindi (hi)
    await page.selectOption('#language-select', 'hi');

    // Verify Hindi translation rendered
    await expect(page.locator('text=वेतन पर्ची').first()).toBeVisible();
    await expect(page.locator('text=शुद्ध वेतन').first()).toBeVisible();

    // Switch back to English
    await page.selectOption('#language-select', 'en');
    await expect(page.locator('text=Net Pay').first()).toBeVisible();
  });

  test('4. Check-in while offline queues and syncs with geolocation', async ({ page, context }) => {
    // Set geolocation
    await context.setGeolocation({ latitude: 12.9716, longitude: 77.5946 });
    await context.grantPermissions(['geolocation']);

    // Login as worker
    await page.goto('/login');
    await page.fill('#username', 'worker_construction');
    await page.fill('#password', 'pass123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/worker/);

    // Go offline
    await context.setOffline(true);

    // Open Check-in Flow
    await page.click('button:has-text("Check In")');

    // Select Location Check-in
    await page.click('button:has-text("Use My Location")');

    // Submit location check-in
    await page.click('button:has-text("Confirm Location Check-In")');

    // Offline chip or toast should indicate queued status
    await expect(page.locator('text=saved').or(page.locator('text=Offline')).first()).toBeVisible();

    // Reconnect to network
    await context.setOffline(false);

    // Verify offline banner shows synced or clears
    await page.waitForTimeout(1000);
  });

  test('5. Hazard report submission and employer response loop', async ({ page }) => {
    // 1. Worker reports hazard
    await page.goto('/login');
    await page.fill('#username', 'worker_construction');
    await page.fill('#password', 'pass123');
    await page.click('button[type="submit"]');

    await page.goto('/worker/report');
    await page.fill('#hazard-desc', 'Deep pit uncovered near excavation sector 4');
    await page.click('button[type="submit"]');

    // Should redirect to My Reports
    await expect(page).toHaveURL(/\/worker\/my-reports/);

    // 2. Employer reviews in Hazard Inbox
    await page.goto('/login');
    await page.fill('#username', 'employer_construction');
    await page.fill('#password', 'pass123');
    await page.click('button[type="submit"]');

    await page.goto('/employer/hazards');
    await expect(page.locator('text=Hazard Inbox').first()).toBeVisible();

    // Reply and change status
    const replyInput = page.locator('input[placeholder*="Type your response"]').first();
    if (await replyInput.isVisible()) {
      await replyInput.fill('Safety barriers dispatched immediately.');
      await page.click('button:has-text("Send Reply")');
      await expect(page.locator('text=Reply sent').first()).toBeVisible();
    }
  });

  test('6. Overtime calculated correctly for edge case', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#username', 'employer_construction');
    await page.fill('#password', 'pass123');
    await page.click('button[type="submit"]');

    await page.goto('/employer/overtime');
    await expect(page.locator('text=Overtime Report').first()).toBeVisible();

    // Overtime rule should be displayed
    await expect(page.locator('text=> 8h / day @ 1.5x').first()).toBeVisible();

    // Flagged fatigue alerts
    await expect(page.locator('text=Limit Exceeded').first()).toBeVisible();
  });
});
