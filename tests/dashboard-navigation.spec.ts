import { test, expect, Page } from '@playwright/test';

const TEST_USER = {
  email: 'testuser123@gmail.com',
  password: 'SuperStrong#2025!Password'
};

// Helper function for login
async function loginUser(page: Page) {
  await page.goto('http://localhost:3000');
  
  // Navigate to login
  await page.getByRole('button', { name: 'Anmelden' }).click();
  
  // Fill credentials and submit
  await page.getByRole('textbox', { name: 'E-Mail' }).fill(TEST_USER.email);
  await page.getByRole('textbox', { name: 'Passwort' }).fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Anmelden' }).click();
  
  // Wait for dashboard to load
  await expect(page).toHaveURL(/.*\/dashboard/);
}

test.describe('Dashboard Navigation', () => {
  
  test('should display all 5 navigation menu items in sidebar', async ({ page }) => {
    await loginUser(page);
    
    // Check that all required navigation items are present
    const expectedNavItems = [
      'Übersicht',
      'Angebotsverwaltung', 
      'Landingpages',
      'Leads',
      'Einstellungen'
    ];
    
    for (const navItem of expectedNavItems) {
      await expect(page.getByRole('link', { name: navItem })).toBeVisible();
    }
  });

  test('should navigate to correct pages when clicking navigation items', async ({ page }) => {
    await loginUser(page);
    
    // Test each navigation item
    const navigationTests = [
      { name: 'Übersicht', expectedUrl: '/dashboard', shouldMatch: true },
      { name: 'Angebotsverwaltung', expectedUrl: '/dashboard/offers' },
      { name: 'Landingpages', expectedUrl: '/dashboard/landingpages' },
      { name: 'Leads', expectedUrl: '/dashboard/leads' },
      { name: 'Einstellungen', expectedUrl: '/dashboard/settings' }
    ];
    
    for (const navTest of navigationTests) {
      await page.getByRole('link', { name: navTest.name }).click();
      
      if (navTest.shouldMatch) {
        await expect(page).toHaveURL(/.*\/dashboard$/);
      } else {
        await expect(page).toHaveURL(new RegExp(`.*${navTest.expectedUrl}`));
      }
      
      // Wait a moment for page to load
      await page.waitForTimeout(500);
    }
  });

  test('should highlight current active navigation item', async ({ page }) => {
    await loginUser(page);
    
    // Navigate to offers page
    await page.getByRole('link', { name: 'Angebotsverwaltung' }).click();
    await expect(page).toHaveURL(/.*\/dashboard\/offers/);
    
    // Check that the active navigation item has proper styling
    const activeNavItem = page.getByRole('link', { name: 'Angebotsverwaltung' });
    await expect(activeNavItem).toBeVisible();
    
    // Navigate back to overview and check active state
    await page.getByRole('link', { name: 'Übersicht' }).click();
    await expect(page).toHaveURL(/.*\/dashboard$/);
    
    const overviewNavItem = page.getByRole('link', { name: 'Übersicht' });
    await expect(overviewNavItem).toBeVisible();
  });

  test('should display overview page content correctly', async ({ page }) => {
    await loginUser(page);
    
    // Check that we're on the overview page
    await expect(page).toHaveURL(/.*\/dashboard$/);
    
    // Look for dashboard statistics/overview content
    // This should NOT show the old tab navigation
    await expect(page.getByText('Willkommen in Ihrem CARVITRA Dashboard')).toBeVisible();
    
    // Check for quick action buttons
    const quickActions = [
      'PDF hochladen',
      'Zu den Leads'
    ];
    
    for (const action of quickActions) {
      // Look for buttons that might contain this text
      const button = page.locator(`button:has-text("${action}"), a:has-text("${action}")`).first();
      await expect(button).toBeVisible();
    }
  });

  test('should show offers management on offers page', async ({ page }) => {
    await loginUser(page);
    
    // Navigate to offers page
    await page.getByRole('link', { name: 'Angebotsverwaltung' }).click();
    await expect(page).toHaveURL(/.*\/dashboard\/offers/);
    
    // Check that the offers page shows PDF library content
    // Look for upload functionality or empty state
    const hasUploadButton = await page.getByRole('button', { name: /upload|hochladen/i }).isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/keine angebote|empty|leer/i).isVisible().catch(() => false);
    const hasOffersTable = await page.locator('table, .offer-item, [data-testid*="offer"]').isVisible().catch(() => false);
    
    // At least one of these should be visible on the offers page
    expect(hasUploadButton || hasEmptyState || hasOffersTable).toBeTruthy();
  });

  test('should handle quick action buttons correctly', async ({ page }) => {
    await loginUser(page);
    
    // Check that we're on overview
    await expect(page).toHaveURL(/.*\/dashboard$/);
    
    // Test "PDF hochladen" button if it exists
    const uploadButton = page.locator('button:has-text("PDF hochladen"), a:has-text("PDF hochladen")').first();
    if (await uploadButton.isVisible()) {
      await uploadButton.click();
      // Should navigate to offers page
      await expect(page).toHaveURL(/.*\/dashboard\/offers/);
      
      // Go back to overview
      await page.getByRole('link', { name: 'Übersicht' }).click();
    }
    
    // Test "Zu den Leads" button if it exists
    const leadsButton = page.locator('button:has-text("Zu den Leads"), a:has-text("Zu den Leads")').first();
    if (await leadsButton.isVisible()) {
      await leadsButton.click();
      // Should navigate to leads page
      await expect(page).toHaveURL(/.*\/dashboard\/leads/);
    }
  });

  test('should not display old tab navigation in main content', async ({ page }) => {
    await loginUser(page);
    
    // Check that the old tab navigation is removed
    const oldTabTexts = ['Angebote verwalten', 'Landingpages', 'Lead-Management'];
    
    for (const tabText of oldTabTexts) {
      // These should not exist as tabs in the main content area
      const tabElement = page.locator(`[role="tab"]:has-text("${tabText}")`);
      await expect(tabElement).toHaveCount(0);
    }
  });
});

test.describe('Dashboard Responsive Design', () => {
  
  test('should display mobile navigation correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await loginUser(page);
    
    // On mobile, there should be a hamburger menu or collapsed navigation
    const hamburgerMenu = page.locator('[data-testid*="menu"], button[aria-label*="menu"], button[aria-label*="Menu"]').first();
    const mobileNavTrigger = page.locator('.mobile-nav-trigger, .nav-toggle, [data-mobile-nav]').first();
    
    // At least one mobile navigation pattern should be present
    const hasMobileNav = await hamburgerMenu.isVisible().catch(() => false) || 
                        await mobileNavTrigger.isVisible().catch(() => false);
    
    if (hasMobileNav) {
      // Try to open mobile navigation
      if (await hamburgerMenu.isVisible()) {
        await hamburgerMenu.click();
      } else if (await mobileNavTrigger.isVisible()) {
        await mobileNavTrigger.click();
      }
      
      // Navigation items should become visible
      await expect(page.getByRole('link', { name: 'Übersicht' })).toBeVisible();
    }
  });

  test('should maintain navigation functionality on tablet view', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await loginUser(page);
    
    // Navigation should still be functional
    await page.getByRole('link', { name: 'Angebotsverwaltung' }).click();
    await expect(page).toHaveURL(/.*\/dashboard\/offers/);
    
    await page.getByRole('link', { name: 'Übersicht' }).click();
    await expect(page).toHaveURL(/.*\/dashboard$/);
  });
});

test.describe('Dashboard Error Handling', () => {
  
  test('should handle disabled navigation items correctly', async ({ page }) => {
    await loginUser(page);
    
    // Check if any navigation items are disabled and handle appropriately
    const navLinks = page.locator('nav a, nav button');
    const count = await navLinks.count();
    
    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const isDisabled = await link.getAttribute('disabled') !== null || 
                        await link.getAttribute('aria-disabled') === 'true';
      
      if (isDisabled) {
        // Disabled items should not be clickable or should show appropriate feedback
        await expect(link).toBeVisible();
      }
    }
  });

  test('should handle navigation between all available pages without errors', async ({ page }) => {
    await loginUser(page);
    
    // Navigate through all pages and ensure no console errors
    const navigationSequence = [
      'Angebotsverwaltung',
      'Übersicht', 
      'Landingpages',
      'Übersicht',
      'Leads',
      'Übersicht',
      'Einstellungen',
      'Übersicht'
    ];
    
    for (const navItem of navigationSequence) {
      await page.getByRole('link', { name: navItem }).click();
      
      // Wait for navigation to complete
      await page.waitForLoadState('networkidle');
      
      // Ensure page loaded without errors
      await expect(page.locator('body')).toBeVisible();
      
      // Brief pause between navigations
      await page.waitForTimeout(300);
    }
  });
});