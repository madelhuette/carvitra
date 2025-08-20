import { test, expect } from '@playwright/test';

test.describe('CARVITRA UI Quick Test', () => {
  test('Dashboard Navigation and PDF Section', async ({ page }) => {
    // Go directly to login
    await page.goto('http://localhost:3000/login');
    
    // Use existing test credentials
    await page.fill('input[name="email"]', 'testuser123@gmail.com');
    await page.fill('input[name="password"]', 'SuperStrong#2025!Password');
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
    
    // Navigate to PDFs section
    await page.goto('http://localhost:3000/dashboard/pdfs');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/pdf-section.png', fullPage: true });
    
    // Check for PDF list or upload area
    const hasContent = await page.locator('text=/PDF|Dokument|Upload/i').count() > 0;
    expect(hasContent).toBeTruthy();
    
    console.log('✅ PDF Section loaded successfully');
  });
});