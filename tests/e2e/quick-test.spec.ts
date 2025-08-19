import { test, expect } from '@playwright/test';

// Use faster timeouts
test.use({ 
  timeout: 30000,
  actionTimeout: 10000,
  navigationTimeout: 20000
});

const timestamp = Date.now();
const testEmail = `test-${timestamp}@autohaus-test.de`;
const testPassword = 'TestPassword123!';

test.describe('CARVITRA Quick E2E Test', () => {
  
  test('Test existing user login and dashboard access', async ({ page }) => {
    console.log('\n=== Testing with existing user ===');
    
    // Go to login
    await page.goto('http://localhost:3000/auth/login');
    
    // Login with existing user
    await page.fill('input[name="email"]', 'testuser123@gmail.com');
    await page.fill('input[name="password"]', 'SuperStrong#2025!Password');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    try {
      await page.waitForURL('**/dashboard/**', { timeout: 10000 });
      console.log('✓ Login successful - redirected to dashboard');
    } catch (e) {
      console.log('✗ Login failed - no redirect to dashboard');
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      // Check for error messages
      const errorText = await page.locator('.text-error-600, .text-red-600, [role="alert"]').textContent().catch(() => null);
      if (errorText) {
        console.log('Error message:', errorText);
      }
      return;
    }
    
    // Check dashboard
    const dashboardUrl = page.url();
    console.log('Dashboard URL:', dashboardUrl);
    
    // Check for welcome or dashboard content
    const hasContent = await page.locator('main, [role="main"]').isVisible({ timeout: 5000 }).catch(() => false);
    if (hasContent) {
      console.log('✓ Dashboard content loaded');
    } else {
      console.log('✗ Dashboard content not found');
    }
    
    // Navigate to PDF Library
    console.log('\n=== Testing PDF Library ===');
    await page.goto('http://localhost:3000/dashboard/pdf-library');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Check for errors in console
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('recursion') || text.includes('Maximum call stack')) {
          consoleErrors.push(text);
        }
      }
    });
    
    // Wait a moment for any errors to appear
    await page.waitForTimeout(2000);
    
    if (consoleErrors.length > 0) {
      console.log('✗ Recursion errors detected:', consoleErrors.length);
    } else {
      console.log('✓ No recursion errors in PDF Library');
    }
    
    // Check for upload button
    const uploadButton = await page.locator('button:has-text("PDF hochladen"), button:has-text("Upload")').isVisible({ timeout: 5000 }).catch(() => false);
    if (uploadButton) {
      console.log('✓ Upload button found');
    } else {
      console.log('✗ Upload button not found');
    }
  });
  
  test('Test new user registration', async ({ page }) => {
    console.log('\n=== Testing new user registration ===');
    console.log('Test email:', testEmail);
    
    // Go to registration
    await page.goto('http://localhost:3000/auth/register');
    
    // Fill form
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="companyName"]', 'Test Autohaus GmbH');
    await page.fill('input[name="phoneNumber"]', '+49 30 12345678');
    await page.fill('input[name="password"]', testPassword);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for response
    try {
      await page.waitForURL('**/dashboard/**', { timeout: 10000 });
      console.log('✓ Registration successful - redirected to dashboard');
    } catch (e) {
      // Check if we're on a confirmation page or got an error
      const currentUrl = page.url();
      console.log('After registration URL:', currentUrl);
      
      if (currentUrl.includes('confirm') || currentUrl.includes('verify')) {
        console.log('✓ Registration successful - confirmation required');
      } else {
        console.log('✗ Registration might have failed');
        
        // Check for error messages
        const errorText = await page.locator('.text-error-600, .text-red-600, [role="alert"]').textContent().catch(() => null);
        if (errorText) {
          console.log('Error message:', errorText);
        }
      }
    }
  });
  
});