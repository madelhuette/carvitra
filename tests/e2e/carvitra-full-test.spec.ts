import { test, expect } from '@playwright/test';

// Generate unique test data
const timestamp = Date.now();
const testEmail = `testuser-${timestamp}@autohaus-test.de`;
const testPassword = 'TestPassword123!';

test.describe('CARVITRA Platform - Comprehensive E2E Test', () => {
  test.setTimeout(60000); // 60 seconds timeout for entire test

  test('Complete user journey: Registration → Login → Dashboard → PDF Library', async ({ page }) => {
    console.log('Starting comprehensive E2E test...');
    console.log(`Test email: ${testEmail}`);

    // Test 1: Registration
    await test.step('1. User Registration', async () => {
      await page.goto('http://localhost:3000/auth/register');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of registration page
      await page.screenshot({ path: 'test-screenshots/1-registration-page.png', fullPage: true });
      
      // Fill registration form
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="companyName"]', 'Test Autohaus GmbH');
      await page.fill('input[name="phoneNumber"]', '+49 30 12345678');
      await page.fill('input[name="password"]', testPassword);
      
      // Take screenshot before submission
      await page.screenshot({ path: 'test-screenshots/2-registration-filled.png', fullPage: true });
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for navigation or error
      await page.waitForTimeout(3000);
      
      // Check for success or error
      const currentUrl = page.url();
      console.log(`After registration - Current URL: ${currentUrl}`);
      
      // Take screenshot after submission
      await page.screenshot({ path: 'test-screenshots/3-after-registration.png', fullPage: true });
      
      // Check for any error messages
      const errorMessages = await page.$$('text=/error|fehler|failed/i');
      if (errorMessages.length > 0) {
        console.log('Registration might have failed - error messages found');
        const errorText = await page.textContent('body');
        console.log('Page content:', errorText?.substring(0, 500));
      }
    });

    // Test 2: Login
    await test.step('2. User Login', async () => {
      // Navigate to login page if not already there
      await page.goto('http://localhost:3000/auth/login');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of login page
      await page.screenshot({ path: 'test-screenshots/4-login-page.png', fullPage: true });
      
      // Fill login form
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      
      // Take screenshot before login
      await page.screenshot({ path: 'test-screenshots/5-login-filled.png', fullPage: true });
      
      // Submit login
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log(`After login - Current URL: ${currentUrl}`);
      
      // Take screenshot after login
      await page.screenshot({ path: 'test-screenshots/6-after-login.png', fullPage: true });
      
      // Check if we're on dashboard
      if (currentUrl.includes('/dashboard')) {
        console.log('✓ Successfully logged in and redirected to dashboard');
      } else {
        console.log('✗ Login might have failed - not on dashboard');
      }
    });

    // Test 3: Dashboard Access
    await test.step('3. Dashboard Access', async () => {
      // Navigate to dashboard directly
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of dashboard
      await page.screenshot({ path: 'test-screenshots/7-dashboard.png', fullPage: true });
      
      // Check for welcome message
      const welcomeMessage = await page.locator('text=/willkommen|welcome|hallo/i').first();
      const hasWelcome = await welcomeMessage.isVisible().catch(() => false);
      
      if (hasWelcome) {
        console.log('✓ Welcome message found on dashboard');
      } else {
        console.log('✗ No welcome message found');
      }
      
      // Check for dashboard elements
      const dashboardContent = await page.textContent('body');
      console.log('Dashboard loaded, content length:', dashboardContent?.length);
      
      // Check for any error messages
      const hasErrors = await page.locator('text=/error|fehler|failed/i').count();
      if (hasErrors > 0) {
        console.log(`✗ Found ${hasErrors} error message(s) on dashboard`);
      } else {
        console.log('✓ No error messages on dashboard');
      }
    });

    // Test 4: PDF Library
    await test.step('4. PDF Library Access', async () => {
      // Navigate to PDF library
      await page.goto('http://localhost:3000/dashboard/pdf-library');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of PDF library
      await page.screenshot({ path: 'test-screenshots/8-pdf-library.png', fullPage: true });
      
      // Check for infinite recursion errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Wait a bit to catch any delayed errors
      await page.waitForTimeout(2000);
      
      // Check for recursion errors
      const hasRecursionError = consoleErrors.some(err => 
        err.includes('recursion') || err.includes('Maximum call stack')
      );
      
      if (hasRecursionError) {
        console.log('✗ Infinite recursion error detected in PDF library');
        console.log('Console errors:', consoleErrors);
      } else {
        console.log('✓ No infinite recursion errors in PDF library');
      }
      
      // Check for upload button
      const uploadButton = await page.locator('button:has-text("PDF hochladen"), button:has-text("Upload PDF")').first();
      const hasUploadButton = await uploadButton.isVisible().catch(() => false);
      
      if (hasUploadButton) {
        console.log('✓ PDF upload button found');
      } else {
        console.log('✗ PDF upload button not found');
      }
      
      // Check page structure
      const pageContent = await page.textContent('body');
      console.log('PDF Library loaded, content length:', pageContent?.length);
      
      // Take final screenshot
      await page.screenshot({ path: 'test-screenshots/9-pdf-library-final.png', fullPage: true });
    });

    // Final Summary
    await test.step('5. Test Summary', async () => {
      console.log('\n========== TEST SUMMARY ==========');
      console.log(`Test User: ${testEmail}`);
      console.log('Screenshots saved in: test-screenshots/');
      
      // Check final URL
      const finalUrl = page.url();
      console.log(`Final URL: ${finalUrl}`);
      
      // Get all console errors from the entire session
      const allErrors = await page.evaluate(() => {
        return window.console.error ? 'Console errors detected' : 'No console errors';
      });
      console.log(`Console status: ${allErrors}`);
    });
  });

  // Additional test with existing user
  test('Login with existing test user', async ({ page }) => {
    console.log('Testing with existing user: testuser123@gmail.com');
    
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Login with existing test user
    await page.fill('input[name="email"]', 'testuser123@gmail.com');
    await page.fill('input[name="password"]', 'SuperStrong#2025!Password');
    
    await page.screenshot({ path: 'test-screenshots/existing-user-login.png', fullPage: true });
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`Existing user login - Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✓ Existing user login successful');
      
      // Test PDF library with existing user
      await page.goto('http://localhost:3000/dashboard/pdf-library');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-screenshots/existing-user-pdf-library.png', fullPage: true });
      
      console.log('✓ PDF library accessed with existing user');
    } else {
      console.log('✗ Existing user login failed');
    }
  });
});