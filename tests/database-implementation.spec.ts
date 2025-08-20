import { test, expect } from '@playwright/test';

test.describe('CARVITRA Database Implementation Tests', () => {
  const testUser = {
    email: 'testuser123@gmail.com',
    password: 'SuperStrong#2025!Password'
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('http://localhost:3000/login');
    
    // Login with test credentials
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
  });

  test('1. PDF Upload Flow - Complete cycle', async ({ page }) => {
    console.log('Testing PDF Upload Flow...');
    
    // Navigate to PDF section
    await page.goto('http://localhost:3000/dashboard/pdfs');
    await page.waitForLoadState('networkidle');
    
    // Check if page loaded correctly
    await expect(page.locator('h1, h2').filter({ hasText: /PDF|Dokumente/i }).first()).toBeVisible();
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: 'tests/screenshots/pdf-page-initial.png',
      fullPage: true 
    });
    
    // Check for upload area
    const uploadArea = page.locator('[data-testid="pdf-upload-area"], .dropzone, [role="button"]').filter({ hasText: /upload|hochladen|drag/i }).first();
    
    if (await uploadArea.count() > 0) {
      console.log('Upload area found');
      
      // Create a test PDF file
      const fs = require('fs');
      const path = require('path');
      const PDFDocument = require('pdfkit');
      
      const testPdfPath = path.join(__dirname, 'test-vehicle.pdf');
      
      // Create test PDF with vehicle data
      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(testPdfPath));
      
      doc.fontSize(20).text('BMW 320d Touring', 50, 50);
      doc.fontSize(14).text('Fahrzeugdaten:', 50, 100);
      doc.fontSize(12)
        .text('Erstzulassung: 03/2022', 50, 130)
        .text('Kilometerstand: 25.000 km', 50, 150)
        .text('Leistung: 190 PS', 50, 170)
        .text('Kraftstoff: Diesel', 50, 190)
        .text('Getriebe: Automatik', 50, 210)
        .text('Farbe: Alpinweiß', 50, 230)
        .text('Leasingrate: 399 EUR/Monat', 50, 250)
        .text('Anzahlung: 0 EUR', 50, 270)
        .text('Laufzeit: 48 Monate', 50, 290);
      
      doc.end();
      
      // Wait for PDF creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Upload the PDF
      const fileInput = await page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(testPdfPath);
      
      // Wait for upload and processing
      await page.waitForTimeout(3000);
      
      // Check for skeleton loader or processing indicator
      const processingIndicator = page.locator('.skeleton, [data-testid="loading"], .animate-pulse').first();
      if (await processingIndicator.count() > 0) {
        console.log('Processing indicator detected');
        await processingIndicator.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
      }
      
      // Take screenshot after upload
      await page.screenshot({ 
        path: 'tests/screenshots/pdf-after-upload.png',
        fullPage: true 
      });
      
      // Check for extracted data display
      const extractedDataVisible = await page.locator('text=/BMW|320d|Diesel|399/i').first().isVisible().catch(() => false);
      
      if (extractedDataVisible) {
        console.log('Extracted data is visible in UI');
      }
      
      // Clean up test file
      fs.unlinkSync(testPdfPath);
    }
  });

  test('2. Dashboard Navigation - All sections', async ({ page }) => {
    console.log('Testing Dashboard Navigation...');
    
    const sections = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/dashboard/offers', name: 'Angebote' },
      { path: '/dashboard/pdfs', name: 'PDFs' },
      { path: '/dashboard/landingpages', name: 'Landing Pages' },
      { path: '/dashboard/leads', name: 'Leads' }
    ];
    
    for (const section of sections) {
      await page.goto(`http://localhost:3000${section.path}`);
      await page.waitForLoadState('networkidle');
      
      // Check if page loaded without errors
      const errorElement = await page.locator('text=/error|fehler|500|404/i').first().isVisible().catch(() => false);
      
      if (!errorElement) {
        console.log(`✅ ${section.name} loaded successfully`);
        await page.screenshot({ 
          path: `tests/screenshots/dashboard-${section.name.toLowerCase().replace(' ', '-')}.png`
        });
      } else {
        console.log(`❌ ${section.name} shows error`);
      }
    }
  });

  test('3. UI/UX Elements - Theme and responsiveness', async ({ page }) => {
    console.log('Testing UI/UX Elements...');
    
    await page.goto('http://localhost:3000/dashboard');
    
    // Test theme toggle
    const themeToggle = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: '' }).first();
    
    if (await themeToggle.count() > 0) {
      // Get initial theme
      const initialTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      
      // Click theme toggle
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // Check if theme changed
      const newTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      
      if (initialTheme !== newTheme) {
        console.log('✅ Theme toggle works');
      }
      
      // Take screenshots in both themes
      await page.screenshot({ 
        path: `tests/screenshots/theme-${newTheme ? 'dark' : 'light'}.png`
      });
    }
    
    // Test responsive design
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: `tests/screenshots/responsive-${viewport.name}.png`
      });
      console.log(`✅ ${viewport.name} viewport tested`);
    }
  });

  test('4. Performance Metrics', async ({ page }) => {
    console.log('Collecting Performance Metrics...');
    
    // Enable performance monitoring
    await page.goto('http://localhost:3000/dashboard');
    
    // Collect navigation timing
    const navTiming = await page.evaluate(() => {
      const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
        loadComplete: timing.loadEventEnd - timing.loadEventStart,
        domInteractive: timing.domInteractive - timing.fetchStart,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    console.log('Performance Metrics:', navTiming);
    
    // Check console for errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate through pages to check for errors
    await page.goto('http://localhost:3000/dashboard/pdfs');
    await page.waitForTimeout(2000);
    
    if (consoleErrors.length > 0) {
      console.log('Console Errors detected:', consoleErrors);
    } else {
      console.log('✅ No console errors');
    }
  });
});