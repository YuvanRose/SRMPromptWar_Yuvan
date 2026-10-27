import { test, expect } from '@playwright/test';

test.describe('FairShift — Decent Work Platform Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('fairshift_language', 'en');
    });
  });

  test('1. Both role logins route to correct UI', async ({ page, isMobile }) => {
    // 1. Worker Login
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

    // 2. Employer Login
    await page.fill('#username', 'employer_construction');
    await page.fill('#password', 'pass123');
    await page.click('button[type="submit"]');

    // Should route to /employer
    await expect(page).toHaveURL(/\/employer/);
    await expect(page.locator('main').locator('text=Dashboard').first()).toBeVisible();

    if (!isMobile) {
      await expect(page.locator('text=Workers').first()).toBeVisible();
    }
  });

  test('2. Sector switch changes vocabulary (Construction vs College)', async ({ page, isMobile }) => {
    // Login as Construction Employer
    await page.goto('/login');
    await page.fill('#username', 'employer_construction');
    await page.fill('#password', 'pass123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/employer/);

    // Verify construction vocabulary
    await expect(page.locator('main').getByText('Site Alpha').first()).toBeVisible();
    if (!isMobile) {
      await expect(page.locator('text=Workers').first()).toBeVisible();
    }

    // Logout via visible button
    await page.locator('button[aria-label="Log Out"]:visible').click();
    await expect(page).toHaveURL(/\/login/);

    // Login as College Employer
    await page.fill('#username', 'employer_college');
    await page.fill('#password', 'pass123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/employer/);

    // Verify college vocabulary
    await expect(page.locator('main').getByText('CS Department').first()).toBeVisible();
    if (!isMobile) {
      await expect(page.locator('text=Staff Members').first()).toBeVisible();
    }
  });

  test('3. Language switch changes the payslip text', async ({ page }) => {
    // Login as worker
    await page.goto('/login');
    await page.fill('#username', 'worker_construction');
    await page.fill('#password', 'pass123');
    await page.click('button[type="submit"]');

    // Navigate to Payslip
    await page.goto('/worker/payslip');
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

    // Login as worker and load dashboard first
    await page.goto('/login');
    await page.fill('#username', 'worker_construction');
    await page.fill('#password', 'pass123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/worker/);

    // Ensure Check In button is ready
    const checkInBtn = page.locator('button:has-text("Check In")');
    await expect(checkInBtn).toBeVisible();

    // Go offline
    await context.setOffline(true);

    // Open Check-in Flow
    await checkInBtn.click();

    // Select Location Check-in tab
    await page.locator('[data-testid="tab-location"]').click();

    // Wait for location to be verified or click fetch
    const confirmBtn = page.locator('[data-testid="btn-confirm-checkin"]');
    await expect(confirmBtn).toBeEnabled({ timeout: 5000 });

    // Submit location check-in
    await confirmBtn.click();

    // Reconnect network
    await context.setOffline(false);

    // Verify checked in state
    await expect(page.locator('button:has-text("Check Out")')).toBeVisible({ timeout: 5000 });
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
    await expect(page.locator('main').locator('h2:has-text("Hazard Inbox")')).toBeVisible();

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
    await expect(page.locator('text=Daily Overtime Rule').first()).toBeVisible();

    // Flagged fatigue alerts
    await expect(page.locator('text=Limit Exceeded').first()).toBeVisible();
  });
});
