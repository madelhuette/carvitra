# TEST_AGENT_BRIEFING.md

## 🎯 Purpose
This document defines the automated testing strategy and workflows for the `test-automation-checker` agent, which ensures comprehensive quality assurance for the CARVITRA platform through automated end-to-end testing with Playwright.

---

## 🚨 KRITISCHE ENTWICKLUNGSREGELN

### 🌐 Playwright Isolation Policy

**IMMER isolierten Modus verwenden!**

```bash
# ✅ RICHTIG - Isolierter Modus
npx playwright test --isolated

# ❌ FALSCH - Standard-Modus (führt zu Konflikten)
npx playwright test
```

**Konflikt-Vermeidung:**
- Browser-Instanzen IMMER isoliert starten
- Bei "Browser already in use" Fehler → Sofort auf isolierten Modus wechseln
- Alte Browser-Prozesse vor Test-Start beenden

### 🖥️ Dev-Server Management

**PFLICHT vor jedem Test:**

1. 🔍 **Prüfe laufende Server**
   ```bash
   lsof -i :3000-3010  # Prüfe Ports
   ps aux | grep "npm run dev"  # Prüfe Prozesse
   ```

2. 🚀 **Server im Hintergrund starten**
   ```bash
   npm run dev &  # IMMER als Background-Prozess
   ```

3. ⏱️ **Warte auf Server-Bereitschaft**
   ```typescript
   await page.waitForURL('http://localhost:3000', { timeout: 30000 });
   ```

### 🔐 Test-User Management

**Existierender Test-Account (bereits in Datenbank):**
```typescript
const EXISTING_TEST_USER = {
  email: "testuser123@gmail.com",
  password: "SuperStrong#2025!Password",
  firstName: "Test",
  lastName: "User",
  companyName: "Test GmbH",
  role: "user"
};
```

**Standard Test-Accounts (für neue Tests):**
```typescript
const TEST_USERS = {
  existing: EXISTING_TEST_USER, // Verwende diesen für sofortige Tests!
  admin: {
    email: "testadmin@autohaus-test.de",
    password: "TestAdmin#2025!Secure",
    role: "admin"
  },
  user: {
    email: "testuser@autohaus-test.de", 
    password: "TestUser#2025!Secure",
    role: "user"
  },
  viewer: {
    email: "testviewer@autohaus-test.de",
    password: "TestViewer#2025!Secure",
    role: "viewer"
  }
};
```

⚠️ **WICHTIG**: Der Account `testuser123@gmail.com` existiert bereits in der Datenbank und kann sofort für Tests verwendet werden!

---

## 📋 MANDATORY TRIGGER EVENTS

Der test-automation-checker MUSS automatisch ausgeführt werden bei:

### 1. **Feature-Implementierung**
- ✅ Nach Abschluss jeder User Story
- ✅ Nach UI-Komponenten-Entwicklung
- ✅ Nach Backend-API-Änderungen
- ✅ Nach Authentifizierungs-Updates

### 2. **Datenbankänderungen**
- ✅ Nach Migrations
- ✅ Nach Schema-Updates
- ✅ Nach RLS-Policy-Änderungen
- ✅ Nach Trigger/Function-Updates

### 3. **Pre-Deployment**
- ✅ Vor Production-Releases
- ✅ Nach Branch-Merges
- ✅ Bei CI/CD-Pipeline-Runs

### 4. **Regressions-Checks**
- ✅ Nach Bug-Fixes
- ✅ Nach Refactoring
- ✅ Nach Dependency-Updates

---

## 🔄 TEST WORKFLOWS

### **1. Login & Authentication Tests**

```typescript
// Vollständiger Login-Test
async function testCompleteLoginFlow() {
  // 1. Navigation zur Login-Seite
  await page.goto('/auth/login');
  
  // 2. Formular ausfüllen
  await page.fill('[name="email"]', TEST_USERS.user.email);
  await page.fill('[name="password"]', TEST_USERS.user.password);
  
  // 3. Submit & Redirect prüfen
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
  
  // 4. User-Daten verifizieren
  await expect(page.locator('[data-testid="user-name"]')).toContainText('Test User');
}
```

### **2. Component Visual Testing**

```typescript
// Screenshot-basierte Komponenten-Tests
async function testComponentVisuals() {
  // 1. Komponente rendern
  await page.goto('/dashboard');
  
  // 2. Vollständiger Screenshot
  await page.screenshot({
    path: 'test-results/dashboard-full.png',
    fullPage: true
  });
  
  // 3. Komponenten-spezifische Screenshots
  const statsCard = page.locator('[data-testid="stats-card"]');
  await statsCard.screenshot({
    path: 'test-results/stats-card.png'
  });
  
  // 4. Dark/Light Mode Tests
  await page.click('[data-testid="theme-toggle"]');
  await page.screenshot({
    path: 'test-results/dashboard-dark.png'
  });
}
```

### **3. User Journey Tests**

```typescript
// End-to-End User Flow
async function testCompleteUserJourney() {
  // 1. Login
  await loginAsUser(TEST_USERS.admin);
  
  // 2. Navigate to Offers
  await page.click('nav >> text=Angebote');
  
  // 3. Create New Offer
  await page.click('button >> text=Neues Angebot');
  await fillOfferForm(testOfferData);
  
  // 4. Verify Creation
  await expect(page.locator('.success-message')).toBeVisible();
  
  // 5. Check in List
  await page.goto('/dashboard/offers');
  await expect(page.locator(`text=${testOfferData.title}`)).toBeVisible();
}
```

### **4. Form Validation Tests**

```typescript
// Formular-Validierung
async function testFormValidation() {
  await page.goto('/auth/register');
  
  // Test required fields
  await page.click('button[type="submit"]');
  await expect(page.locator('.error-message')).toHaveCount(4);
  
  // Test email format
  await page.fill('[name="email"]', 'invalid-email');
  await expect(page.locator('[data-testid="email-error"]')).toContainText('ungültig');
  
  // Test password strength
  await page.fill('[name="password"]', '123');
  await expect(page.locator('[data-testid="password-error"]')).toContainText('zu schwach');
}
```

---

## 🤝 AGENT COLLABORATION

### **Integration mit design-compliance-checker**

```typescript
// Nach visuellen Tests → Design-Compliance prüfen
async function collaborateWithDesignAgent() {
  // 1. Führe visuelle Tests durch
  const testResults = await runVisualTests();
  
  // 2. Trigger Design-Agent
  await Task.invoke({
    subagent_type: "design-compliance-checker",
    description: "Verify test screenshots compliance",
    prompt: `Check visual test results: ${testResults}`
  });
  
  // 3. Warte auf Design-Feedback
  const designFeedback = await waitForAgentResponse();
  
  // 4. Integriere Feedback in Test-Report
  testReport.addDesignCompliance(designFeedback);
}
```

### **Integration mit database-integrity-checker**

```typescript
// Nach Datenbank-Tests → Integrity prüfen
async function collaborateWithDatabaseAgent() {
  // 1. Führe CRUD-Tests durch
  await runDatabaseTests();
  
  // 2. Trigger Database-Agent
  await Task.invoke({
    subagent_type: "database-integrity-checker",
    description: "Verify database state after tests",
    prompt: "Check for orphaned test data and constraint violations"
  });
  
  // 3. Cleanup basierend auf Feedback
  const dbFeedback = await waitForAgentResponse();
  if (dbFeedback.hasOrphanedData) {
    await cleanupTestData();
  }
}
```

---

## 🛠️ TECHNISCHE KONFIGURATION

### **Playwright Setup**

```javascript
// playwright.config.js Essentials
export default {
  use: {
    // KRITISCH: Isolierter Modus
    launchOptions: {
      args: ['--isolated']
    },
    
    // Test-Daten
    baseURL: process.env.TEST_URL || 'http://localhost:3000',
    
    // Screenshots bei Fehlern
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  
  // Parallel-Tests deaktivieren für Stabilität
  workers: 1,
  
  // Retries für flaky tests
  retries: 2,
};
```

### **Test-Daten Management**

```typescript
// Test-Daten Setup & Cleanup
class TestDataManager {
  async setup() {
    // Erstelle Test-Organization
    await supabase.from('organizations').insert({
      id: TEST_ORG_ID,
      name: 'Test Autohaus GmbH',
      slug: 'test-autohaus'
    });
    
    // Erstelle Test-Users
    for (const user of Object.values(TEST_USERS)) {
      await createTestUser(user);
    }
  }
  
  async cleanup() {
    // Lösche alle Test-Daten
    await supabase.from('organizations')
      .delete()
      .eq('id', TEST_ORG_ID);
  }
}
```

---

## 📊 TEST REPORTING

### **Report-Struktur**

```typescript
interface TestReport {
  // Meta-Informationen
  timestamp: Date;
  environment: 'local' | 'staging' | 'production';
  branch: string;
  commit: string;
  
  // Test-Ergebnisse
  results: {
    passed: number;
    failed: number;
    skipped: number;
    flaky: number;
  };
  
  // Visuelle Artefakte
  screenshots: {
    path: string;
    component: string;
    theme: 'light' | 'dark';
  }[];
  
  // Agent-Kollaboration
  agentFeedback: {
    design: DesignComplianceResult;
    database: DatabaseIntegrityResult;
  };
  
  // Performance-Metriken
  performance: {
    averageLoadTime: number;
    slowestComponent: string;
    memoryUsage: number;
  };
}
```

### **Fehler-Dokumentation**

```typescript
// Automatische Fehler-Kategorisierung
enum TestFailureCategory {
  NETWORK = 'network_error',
  TIMEOUT = 'timeout',
  ASSERTION = 'assertion_failed',
  BROWSER = 'browser_crash',
  SERVER = 'server_error',
  DATABASE = 'database_error'
}

// Fehler mit Kontext speichern
function documentTestFailure(error: Error, context: TestContext) {
  return {
    category: categorizeError(error),
    message: error.message,
    stack: error.stack,
    screenshot: context.screenshot,
    url: context.currentURL,
    timestamp: new Date(),
    suggestion: generateFixSuggestion(error)
  };
}
```

---

## 🧠 SELBSTLERN-MECHANISMUS

### **Automatische Pattern-Erkennung**

Wenn der Agent während Tests **neue Pattern, Fehler oder Workarounds** entdeckt:

1. **Erkenne wiederkehrende Muster**
   ```typescript
   if (errorCount[errorType] > 3) {
     // Dokumentiere als bekanntes Problem
     addToKnownIssues({
       type: errorType,
       solution: discoveredWorkaround,
       frequency: errorCount[errorType]
     });
   }
   ```

2. **Erweitere Test-Strategien**
   ```typescript
   // Neuer flaky test entdeckt
   if (testFailedIntermittently) {
     // Füge zu Retry-Liste hinzu
     updateTestConfig({
       test: testName,
       retries: 3,
       waitBeforeRetry: 2000
     });
   }
   ```

3. **Update diese Datei**
   - Neue Test-Pattern hinzufügen
   - Workarounds dokumentieren
   - Best Practices erweitern

### **Beispiele für Auto-Learning**

```typescript
// Problem: Login-Form reagiert zu langsam
// Entdeckte Lösung: Warte auf spezifisches Element
// Automatisch dokumentiert als:

### Known Issues & Solutions

#### Slow Login Form Response
**Problem**: Login button nicht sofort klickbar
**Lösung**: 
```typescript
await page.waitForSelector('button[type="submit"]:not([disabled])');
```
**Frequency**: 12 occurrences
**Added**: 2025-01-20
```

---

## 🚀 QUICK REFERENCE

### **Häufige Playwright-Befehle**

```bash
# Test einzelne Datei
npx playwright test tests/login.spec.ts --isolated

# Test mit UI-Mode
npx playwright test --ui --isolated

# Debug-Mode
npx playwright test --debug --isolated

# Generiere Report
npx playwright show-report
```

### **Test-Selektoren Best Practices**

```typescript
// ✅ GUT - Stabile Selektoren
page.locator('[data-testid="submit-button"]')
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email')

// ❌ SCHLECHT - Fragile Selektoren
page.locator('.btn-primary')
page.locator('#submit')
page.locator('div > button:nth-child(2)')
```

---

## ⚠️ KRITISCHE WARNUNGEN

1. **NIEMALS Tests auf Production-Datenbank**
2. **IMMER Test-Daten nach Tests aufräumen**
3. **KEINE echten Nutzer-Credentials in Tests**
4. **IMMER isolierten Browser-Modus verwenden**
5. **Dev-Server VOR Tests starten**

---

## 📝 REVISION HISTORY

- **2025-01-20**: Initial briefing erstellt
- **2025-01-20**: Playwright-Isolation-Policy hinzugefügt
- **2025-01-20**: Agent-Kollaboration definiert
- **2025-01-20**: Selbstlern-Mechanismus integriert
- **2025-01-20**: Test-User-Management & Dev-Server-Workflows spezifiziert

---

*Dieses Dokument stellt sicher, dass alle Tests konsistent, zuverlässig und automatisiert durchgeführt werden und lernt kontinuierlich aus neuen Test-Pattern.*