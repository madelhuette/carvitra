# CLAUDE.md

Dieses Dokument enthält wichtige Richtlinien für Claude Code bei der Arbeit mit diesem Repository.

# 🚗 CARVITRA - Automotive Leasing & Marketing Platform

> **Innovative Plattform für Autohändler zur digitalen Vermarktung von Leasing- und Kaufangeboten**

---

## 🚨 KRITISCHE ENTWICKLUNGSREGELN

### 🎨 UI-Komponenten-Policy

**AUSSCHLIESSLICH Untitled UI Komponenten verwenden!**

- ✅ **NUR** Komponenten aus der Untitled UI React-Bibliothek ([untitledui.com](https://untitledui.com))
- ❌ **KEINE** Eigenentwicklung von UI-Komponenten
- ❌ **KEINE** Custom-Komponenten ohne explizite Zustimmung
- ❌ **KEINE** Forks, Kopien oder Nachbauten von Untitled UI Komponenten
- 🎯 **Icons**: AUSSCHLIESSLICH aus `@untitledui/icons`

**Korrekte Verwendung:**
```tsx
// ✅ Original-Komponente mit Props anpassen
import { Header } from "@/components/marketing/header-navigation/components/header";
<Header items={customItems} />

// ❌ NIEMALS eigene UI-Komponenten erstellen
<CarvtraHeader /> // FALSCH!
```

### 🗄️ Datenbank-Policy (Supabase MCP)

**PFLICHT vor jeder datenbankbezogenen Entwicklung:**

1. 🔍 **IMMER zuerst Supabase-Schema über MCP abrufen**
2. 📊 **Datenmodell-Synchronisation prüfen** mit CLAUDE.md
3. 🛑 **Bei Abweichungen**: STOPPEN und Dokumentation aktualisieren
4. 🎯 **Single Source of Truth**: Supabase ist alleinige Quelle der Wahrheit

**MCP-Workflow:**
```
SCHRITT 1: Schema-Check via MCP
├── Aktuelle Tabellen und Schema abrufen
└── Mit dokumentiertem Datenmodell vergleichen

SCHRITT 2: Bei Abweichungen → STOPPEN
└── Dokumentation updaten, dann fortsetzen

SCHRITT 3: Implementierung
└── Code basierend auf aktuellem Schema entwickeln
```

---

## 📋 PROJEKT-ÜBERSICHT

### 🎯 Mission
CARVITRA ermöglicht Autohändlern und Verkäufern die **einfache Erstellung professioneller Landing Pages** für Fahrzeugangebote - ohne technisches Know-how oder externe Dienstleister.

### ⚡ Kernfunktionen

#### 🤖 KI-gestützte Automatisierung
- **PDF-Analyse**: Automatische Extraktion aller Fahrzeug- und Angebotsdaten
- **Smart Fields**: Intelligente Feldbefüllung aus unstrukturierten Daten
- **Schnelle Veröffentlichung**: Von PDF zu fertiger Landing Page in Minuten

#### 🎯 Lead-Management
- **Strukturierte Erfassung**: Einheitliche, qualifizierte Leads
- **Flexible Zielsteuerung**: Leads an Einzelpersonen, Teams oder CRM-Systeme

#### 📈 Marketing-Automatisierung
- **Google Ads Integration**: Automatisierte Display Network Kampagnen
- **KI-Content**: Automatische Generierung von Werbetexten und Anzeigen
- **SEO-Optimierung**: Für maximale organische Sichtbarkeit

---

## 🔧 TECHNISCHE ARCHITEKTUR

### 🖥️ Frontend Stack
- **Framework**: Next.js 15.4.6 + React 19.1.1
- **UI-System**: Untitled UI React (AUSSCHLIESSLICH!)
- **Styling**: Tailwind CSS v4.1 + Untitled UI Theming
- **Rendering**: SSR für maximale SEO-Performance

### ⚙️ Backend Services
- **Datenbank**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (Multi-Tenant)
- **Storage**: Supabase Storage (PDFs, Bilder)
- **Realtime**: Live-Updates über Supabase Realtime

### 🤖 KI-Integration
- **Provider**: OpenAI API / Anthropic Claude API
- **PDF-Analyse**: Strukturierte Datenextraktion
- **Content-Generierung**: SEO-optimierte Beschreibungen
- **Smart Validation**: Automatische Datenvalidierung

### 💳 Business Model
- **Token-System**: Pay-per-Use Abrechnung
- **Payment**: Stripe/Paddle Integration
- **Google Ads**: Automatisierte Kampagnen mit Margin

---

## 🗄️ DATENMODELL (PostgreSQL)

### 📊 Struktur-Übersicht
- **UUID-basiert**: Alle Primärschlüssel als UUID
- **Multi-Tenant**: Organisationsbasierte Datentrennung
- **Dictionary Tables**: Wiederverwendbare Stammdaten (11 Lookup-Tabellen)
- **Referential Integrity**: Vollständige FK-Constraints
- **30+ Tabellen**: Vollständig implementiert mit RLS-Policies

### 🏢 Hauptentitäten

#### Organizations & Users
```sql
organizations      # Autohäuser/Händler
├── users         # Verkäufer/Admins (role-based)
└── invitations   # Team-Einladungssystem
```

#### Core Business Objects (45+ Felder)
```sql
pdf_documents      # PDF-Speicher mit OCR-Text
└── offer         # Hauptangebot (45+ Felder)
    ├── dealers              # Händlerinformationen
    ├── sales_persons        # Ansprechpartner
    ├── credit_offers        # 1:n Finanzierungsoptionen (30+ Felder)
    └── offer_equipment      # n:m Ausstattungsmerkmale
```

#### Dictionary/Lookup Tables (Alle befüllt!)
```sql
# Fahrzeug-Klassifizierung
makes (25), vehicle_categories (14), vehicle_types, 
fuel_types (9), transmission_types (7), availability_types (7)
offer_types (8)

# Business Data  
equipment, equipment_categories (9)
credit_offer_types (6), credit_institutions (5)
```

### 🚀 Hybrid PDF-First Ansatz (NEU!)
```typescript
// Workflow: PDF → Text → On-Demand Extraction
1. PDF Upload → Supabase Storage
2. OCR via PDF.co → raw_text in pdf_documents
3. KI-Extraktion (Claude) → ai_extracted fields
4. On-Demand via FieldExtractorService → offer table
```

### 🔗 Supabase MCP-Server Setup

**Konfiguration** (`.mcp.json` im App-Verzeichnis):
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest", 
               "--read-only", "--project-ref=kigcdrahcvyddxrkaeog"],
      "env": {"SUPABASE_ACCESS_TOKEN": "$SUPABASE_ACCESS_TOKEN"}
    }
  }
}
```

**Häufige MCP-Queries:**
```sql
-- Schema-Übersicht
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- FK-Beziehungen prüfen
SELECT tc.table_name, kcu.column_name, 
       ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

---

## ⚙️ ENTWICKLUNGSUMGEBUNG

### 🛠️ Tech Stack (Final)
- **IDE**: Cursor mit Claude Code
- **Deployment**: Vercel (Next.js optimiert)
- **Package Manager**: npm
- **Development**: Turbopack für schnelle Builds

### 📦 Untitled UI Integration
```bash
# Setup (bereits ausgeführt)
npx untitledui@latest init untitled-ui --nextjs

# Neue Komponenten hinzufügen
npx untitledui@latest add

# Struktur:
# src/components/base/        # Basis UI-Komponenten
# src/components/application/ # App-spezifische Komponenten  
# src/components/marketing/   # Marketing-Komponenten
# src/components/foundations/ # Icons, Logos
```

### 🔧 Entwicklungsbefehle

#### Server-Management (NEU! Jan 2025)
```bash
# Smart Dev Server (verhindert Mehrfach-Instanzen)
npm run dev           # Startet oder nutzt bestehenden Server
npm run dev:status    # Zeigt Server-Status und Port-Nutzung
npm run dev:clean     # Räumt ALLE Prozesse auf und startet neu
npm run dev:force     # Erzwingt neuen Server (beendet alten)

# Legacy/Direct
npm run dev:direct    # Original Next.js dev (ohne Management)

# Production
npm run build && npm run start

# Code-Formatierung
npx prettier --write .
```

**🚨 WICHTIG: Server-Management Best Practices**
- **IMMER** `npm run dev` statt `npm run dev:direct` nutzen
- Bei Problemen: `npm run dev:status` für Diagnose
- Bei vielen Prozessen: `npm run dev:clean` zum Aufräumen
- Lock-File `.server-lock.json` zeigt aktiven Server
- Playwright nutzt automatisch Port 3000 (siehe `.playwright-config.json`)

---

## 🚀 ENTWICKLUNGS-WORKFLOWS

### 🎨 UI-Development
1. **Nur Untitled UI verwenden**: Keine Custom-Komponenten
2. **Theme-System nutzen**: Dark/Light Mode über next-themes
3. **Props-basierte Anpassung**: Komponenten über Props konfigurieren
4. **Icon-Konsistenz**: Ausschließlich `@untitledui/icons`

### 🗄️ Datenbank-Development
1. **MCP-Schema Check**: Vor jeder DB-Arbeit aktuelles Schema abrufen
2. **Dokumentation sync**: Bei Abweichungen Dokumentation updaten
3. **Read-Only Default**: MCP-Server standardmäßig auf read-only
4. **Environment-Trennung**: Nur Development-DB verwenden

### 🔄 Feature-Development
1. **TodoWrite für Planung**: Komplexe Tasks strukturiert planen
2. **Schritt-für-Schritt**: Systematische Implementierung
3. **Testing**: Kontinuierlich testen während Entwicklung
4. **Code-Review**: Finale Prüfung vor Commit

### 📚 Agent-Briefings
Alle automatisierten Agents befinden sich in `/agent-briefings/`:
- **`database-integrity-agent.md`** - DB-Konsistenz & RLS-Checks
- **`design-compliance-agent.md`** - UI/UX Compliance mit Untitled UI
- **`test-automation-agent.md`** - E2E Testing mit Playwright
- **`.claude/`** - Claude-spezifische Agent-Konfigurationen

Agents werden automatisch bei relevanten Code-Änderungen getriggert.

---

## 📚 ENTWICKLUNGS-LEARNINGS & BEST PRACTICES

### 🎯 Icon-Management
**Problem**: Viele Icon-Namen aus anderen Libraries existieren nicht in @untitledui/icons

**Lösung - Häufige Mappings**:
```tsx
// ❌ Existiert nicht → ✅ Korrekte Namen:
Brain → Lightbulb04        // KI/Intelligenz
FileText → File02          // Dokumente
CheckCircle2 → CheckCircle // Success States
Linkedin → LinkedIn        // Social (Case-sensitive!)
```

### 🎨 Theme-System
**Erfolgspattern**:
```tsx
// ✅ Semantische Farben verwenden
<div className="bg-primary text-primary">
  // Reagiert automatisch auf Theme-Wechsel
</div>

// ✅ Theme Toggle richtig implementieren
const { theme, setTheme } = useTheme();
<Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} iconOnly>
  {theme === 'dark' ? <Sun /> : <Moon01 />}
</Button>
```

### 🔘 Button Icon-Positionierung
**Kritisches Learning**:
```tsx
// ❌ FALSCH - Icons als children
<Button><LogIn01 />Anmelden</Button>

// ✅ RICHTIG - Icons als Props
<Button iconLeading={LogIn01}>Anmelden</Button>
<Button iconTrailing={ArrowRight}>Weiter</Button>
```

### 🏗️ Komponenten-Architektur
**Best Practices**:
- **Modulare Sektionen**: Jede Page-Sektion als eigene Komponente
- **Props-Konfiguration**: Anpassung nur über Props, nie durch Kopieren
- **Wrapper-Pattern**: Bei Bedarf Wrapper um Original-Komponenten
- **Type-Safety**: Strikte TypeScript-Typisierung

### 📊 Performance-Optimierungen
**Implementiert**:
- **SSR** für Landing Pages (SEO)
- **Code-Splitting** durch modulare Utilities
- **Icon-Optimierung** via Package-Optimierung
- **Responsive Design** mit Mobile-first Ansatz

---

## 📖 REFERENZEN & KOMMANDOS

### 🔗 Wichtige Links
- **Untitled UI**: [untitledui.com/react](https://untitledui.com/react)
- **Next.js Integration**: [untitledui.com/react/integrations/nextjs](https://untitledui.com/react/integrations/nextjs)
- **Supabase**: [supabase.com](https://supabase.com)

### ⚡ Schnell-Referenz
```bash
# MCP-Server Neustart (bei Problemen)
# 1. Claude Code schließen
# 2. Neu starten  
# 3. Zurück zum Projekt navigieren

# Environment Check
cat .env.local | grep SUPABASE_ACCESS_TOKEN

# Untitled UI Komponenten hinzufügen
npx untitledui@latest add
```

### 🎯 Code-Konventionen
- **TypeScript Strict Mode**: Aktiviert
- **Import-Sortierung**: Prettier automatisch
- **Path-Aliasing**: `@/*` zeigt auf `./src/*`
- **Naming**: PascalCase für Komponenten, camelCase für Funktionen

---

## 🏁 NÄCHSTE SCHRITTE

### Phase 1 - MVP
1. ✅ Next.js + Untitled UI Setup
2. 🔄 Supabase Integration & Schema-Migration
3. 📝 Basis-Anlagestrecke (Multi-Step Form)
4. 📄 Landing Page Generator

### Phase 2 - Erweiterung  
1. 🤖 KI-PDF-Analyse Integration
2. 📊 Lead-Management System
3. 🎨 Erweiterte Customization

### Phase 3 - Marketing
1. 📈 Google Ads API Integration
2. 🎯 Automated Campaign Management
3. 📊 Analytics & Reporting

---

## 🔑 KRITISCHE LEARNINGS

### Event Handler Kompatibilität
**Problem**: TypeError bei Form-Inputs durch falsche Event-Handler  
**Lösung**: Untitled UI übergibt Werte direkt, nicht Events
```tsx
// ✅ RICHTIG
<Input onChange={(value: string) => setState(value)} />
<Checkbox onChange={(checked: boolean) => setState(checked)} />

// ❌ FALSCH  
<Input onChange={(e) => setState(e.target.value)} />
```

### Supabase Test-Domains
**Problem**: "Email address invalid" bei test@example.com  
**Lösung**: Realistische Domains verwenden (z.B. @autohaus-test.de)

### MCP-Server Management
**Wichtig**: Nach .mcp.json Änderungen Claude Code Neustart erforderlich

### Datenbank-Migration Best Practices (Jan 2025)
**Problem**: Duplicate Tables, fehlende RLS, leere Dictionaries
**Lösung**: DATABASE_INTEGRITY_CHECKER vor Production-Deploy
```bash
# Immer prüfen vor Deploy:
- Keine doppelten Tabellen (offer vs offers)
- Alle Tabellen haben RLS-Policies
- Dictionary-Daten sind geseedet
- Indizes auf FK-Spalten existieren
```

### PDF-Extraktion Architecture (Jan 2025)
**Learning**: Store full text, extract fields on-demand
```typescript
// Hybrid-Ansatz vermeidet Re-Parsing:
pdf_documents.extracted_data = {
  raw_text: "Vollständiger OCR-Text",    // Einmal extrahiert
  ai_extracted: { /* Strukturierte Daten */ },
  metadata: { confidence: 95 }
}
// → FieldExtractorService für On-Demand-Felder
```

### Dev-Server Port-Konflikte
**Problem**: Port 3000 belegt, Server startet auf 3001
**Lösung**: Alle alten Prozesse beenden
```bash
# Alle npm dev Prozesse finden und beenden:
pkill -f "npm run dev"
# Frisch starten auf Port 3000
npm run dev
```

### Playwright MCP File-Upload
**Problem**: browser_file_upload braucht Modal-State
**Lösung**: JavaScript evaluate für programmatischen Upload
```javascript
// File-Input direkt manipulieren:
const file = new File(['content'], 'name.pdf', {type: 'application/pdf'})
fileInput.files = dataTransfer.files
```

### Landing Page Wizard Implementation (Jan 2025)
**Erfolgreicher 7-Schritte Wizard implementiert:**
1. **Fahrzeugdaten** - Marke, Modell, Variante
2. **Technische Details** - Motor, Verbrauch, Emissionen  
3. **Ausstattung** - Farben, Sitze, Equipment
4. **Verfügbarkeit** - Preise, Liefertermin
5. **Finanzierung** - Leasing/Kredit-Angebote
6. **Ansprechpartner** - Verkäufer-Auswahl
7. **Marketing** - SEO-Texte und URL

**Wichtige Learnings:**
- Auto-Save alle 30 Sekunden (nur mit offerId)
- Wizard-Context Pattern für State-Management
- Step-basierte KI-Analyse mit Anthropic Claude

### Supabase Async Client Initialization (Jan 2025)
**Problem**: Race Condition bei Service-Initialisierung
**Lösung**: Lazy Initialization Pattern
```typescript
// ✅ RICHTIG - Lazy init mit ensureInitialized()
class FieldMappingService {
  private async ensureInitialized() {
    if (!this.initialized) {
      this.supabase = await createClient()
      this.initialized = true
    }
  }
  
  async mapToId() {
    await this.ensureInitialized() // Immer zuerst!
    // ... rest of logic
  }
}
```

### Status Constraints in Offer Table (Jan 2025)  
**Problem**: Check Constraint violation bei 'published'
**Lösung**: Nur erlaubte Status-Werte verwenden
```typescript
// ✅ Erlaubte Werte
status: 'draft' | 'active' | 'sold' | 'reserved' | 'archived'

// ❌ FALSCH
status: 'published' // Führt zu Constraint-Fehler!
```

### Landing Pages Table Structure (Jan 2025)
**Neue Tabelle für Landing Pages:**
```sql
CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  offer_id UUID NOT NULL REFERENCES offer(id),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mit RLS-Policy
CREATE POLICY "landing_pages_organization_access" ON landing_pages
FOR ALL USING (
  organization_id = (SELECT organization_id FROM user_profiles WHERE user_id = auth.uid())
);
```

### Strukturiertes Logging Best Practices (Jan 2025)
**Problem**: Console.logs in Production Code
**Lösung**: Winston Logger mit strukturiertem Logging
```typescript
// ✅ RICHTIG - Modul-basierter Logger
import { createLogger } from '@/lib/logger'
const logger = createLogger('ModuleName')
logger.info('Operation successful', { userId, action })
logger.error('Operation failed', error)

// ❌ FALSCH - Console.logs
console.log('Debug info')
console.error('Error:', error)
```
**Log-Levels**: error, warn, info, debug (debug nur in Development)

### Input-Validierung mit Zod (Jan 2025)
**Pattern**: Alle API-Routes mit Zod-Schemas validieren
```typescript
// ✅ RICHTIG - Validierung vor Verarbeitung
import { pdfExtractSchema } from '@/lib/validation/schemas'

const validation = pdfExtractSchema.safeParse(body)
if (!validation.success) {
  return NextResponse.json({ 
    error: 'Invalid request', 
    details: validation.error.errors 
  }, { status: 400 })
}

// ❌ FALSCH - Direkter Zugriff ohne Validierung
const { pdf_document_id } = await request.json()
```

### Error Boundaries für Stabilität (Jan 2025)
**Kritisch**: Global Error Boundary verhindert App-Crashes
```typescript
// In Root Layout implementiert
<ErrorBoundary>
  <ThemeProvider>
    <RouterProvider>{children}</RouterProvider>
  </ThemeProvider>
</ErrorBoundary>
```
**Features**:
- Graceful Error Handling mit Fallback UI
- Error-Logging an zentraler Stelle
- Recovery-Actions (Reload, Back)
- Stack Traces nur in Development

### State Management Architecture (Jan 2025)
**Best Practice**: Klare Trennung von State-Typen
```typescript
// Client-State mit Zustand
import { useAppStore } from '@/stores/app-store'
const { user, setUser } = useAppStore()

// Server-State mit Supabase
const { data } = await supabase.from('table').select()

// Features:
- Persistierung kritischer Daten
- Global Loading States
- Notification System
- PDF Processing State Management
```

### Code-Splitting & Performance (Jan 2025)
**Pattern**: Lazy Loading für bessere Performance
```typescript
// ✅ RICHTIG - Dynamic Imports für große Komponenten
const StepVehicleBasics = lazy(() => 
  import('./steps/step-vehicle-basics')
)

// Mit Suspense Boundary
<Suspense fallback={<LoadingIndicator />}>
  <StepComponent />
</Suspense>
```

### Security & .env.local Klarstellung (Jan 2025)
**WICHTIG**: .env.local ist SICHER für lokale Entwicklung
- ✅ Datei in .gitignore = wird nicht committed
- ✅ Nur auf lokalem Rechner verfügbar
- ✅ Korrekte Verwendung für API-Keys
- ✅ Production-Secrets in Umgebungsvariablen (Vercel/Deployment)

**Missverständnis-Vermeidung**:
- Lokale Tools können .env.local lesen = NORMAL und ERWÜNSCHT
- Das bedeutet NICHT, dass die Datei öffentlich ist
- Git-Status zeigt .env.local nicht = KORREKT konfiguriert

### Perplexity API Integration & Enrichment Service (Aug 2025)
**Kritische Fixes für funktionierenden Enrichment-Workflow:**

#### 🔧 API-Konfiguration
```typescript
// ✅ KORREKT - Perplexity Service Setup
class PerplexityEnrichmentService {
  private readonly MODEL = 'sonar' // NICHT 'sonar-small-online'!
  private readonly API_URL = 'https://api.perplexity.ai/chat/completions'
  
  // Environment Variables - beide Varianten unterstützen
  const apiKey = process.env.PERPLEXITY_KEY || 
                 process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY
}
```

#### 🚨 Häufige Fehler & Lösungen

**1. Model Name Error (400 Bad Request)**
```typescript
// ❌ FALSCH - Model existiert nicht
model: 'sonar-small-online'

// ✅ RICHTIG - Korrektes Model
model: 'sonar'
```

**2. Claude Model Deprecation**
```typescript
// ❌ FALSCH - Model existiert nicht (404)
model: 'claude-3-5-sonnet-20241205'

// ✅ RICHTIG - Aktuelles Model (deprecated warning, aber funktioniert)
model: 'claude-3-5-sonnet-20241022'
```

**3. Database Constraint Violations**
```typescript
// ❌ FALSCH - Status nicht in Check Constraint
processing_status: 'needs_review'

// ✅ RICHTIG - Erlaubte Werte
processing_status: 'uploaded' | 'extracting' | 'ready' | 'failed'
```

**4. Fehlende Database-Spalten**
```sql
-- Problem: extraction_cache.processing_time_ms fehlt
-- Lösung: Migration ausführen
ALTER TABLE extraction_cache 
ADD COLUMN processing_time_ms INTEGER DEFAULT NULL;

-- Problem: extraction_cache.tokens_used fehlt (non-critical)
-- Wird in Logs gemeldet, aber stört nicht
```

#### 📊 Vollständiger Enrichment-Workflow
```typescript
// 1. PDF Upload → Supabase Storage
// 2. Text-Extraktion via PDF.co
// 3. AI-Extraktion mit Claude (Strukturdaten)
// 4. Perplexity Enrichment (Technische Specs)
// 5. Speicherung in pdf_documents.enriched_data

// Enrichment wird NUR bei PDF-Upload ausgeführt!
// Route: /api/pdf/extract/route.ts
if (vehicleData.make && vehicleData.model) {
  const enrichmentResult = await enrichmentService.enrichVehicleData(
    pdf_document_id,
    vehicleData,
    pdfText
  )
  // Speichert in: enriched_data, enrichment_model, enrichment_timestamp
}
```

#### 🎯 Test-Ergebnisse (Aug 2025)
**Erfolgreicher Test mit BMW X5 PDF:**
- ✅ Text-Extraktion: 339 Zeichen via PDF.co
- ✅ AI-Extraktion: 85% Confidence Score
- ✅ Perplexity Enrichment: Technische Daten angereichert
- ✅ Token-Verbrauch: 1344 Tokens
- ✅ Status: 'ready' (kein Constraint-Fehler)

**Extrahierte Daten-Beispiel:**
```json
{
  "vehicle": {
    "make": "BMW",
    "model": "X5",
    "variant": "xDrive40d M-Sport",
    "year": 2023,
    "fuel_type": "Diesel",
    "transmission": "Automatik",
    "power_kw": 250,
    "power_ps": 340
  },
  "leasing": {
    "monthly_rate": 899
  },
  "metadata": {
    "confidence_score": 85,
    "tokens_used": 1344
  }
}
```

#### 🔍 Debugging-Tipps
```bash
# Server-Logs für Perplexity überwachen
npm run dev
# Filter: "Perplexity|enrichment|400|error"

# Datenbank-Check für Enrichment-Daten
SELECT 
  file_name,
  enriched_data,
  enrichment_model,
  enrichment_timestamp
FROM pdf_documents 
WHERE enrichment_timestamp IS NOT NULL;

# Bei Fehlern: Status prüfen
SELECT DISTINCT processing_status 
FROM pdf_documents;
# Muss sein: uploaded, extracting, ready, failed
```

#### ⚠️ Wichtige Hinweise
1. **Perplexity ist CORE-Feature**: Niemals deaktivieren!
2. **Enrichment nur bei Upload**: Nicht im Wizard-Autofill
3. **Cache-System**: Bereits enrichte Fahrzeuge werden gecacht
4. **Rate Limiting**: Exponential Backoff implementiert (max 3 Retries)
5. **Fallback**: Bei Fehler wird leere enriched_data mit confidence: 0 gespeichert

---

## 📊 WIZARD-TESTBERICHT (Januar 2025)

### 🎯 **VOLLSTÄNDIGER DURCHLAUF ERFOLGREICH**

**Datum:** 21. Januar 2025  
**Test-Fahrzeug:** BMW X5 xDrive40d M-Sport  
**Status:** ✅ Alle 7 Schritte funktional  

#### 🏆 **ERFOLGREICH BEHOBENE KRITISCHE PROBLEME**

1. **✅ Perplexity API Integration - VOLLSTÄNDIG BEHOBEN**
   ```typescript
   // Fixed Model Name
   private readonly MODEL = 'sonar' // NOT 'sonar-small-online'!
   
   // Environment Variable Support  
   const apiKey = process.env.PERPLEXITY_KEY || process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY
   
   // Test Results: BMW X5 Enrichment
   {
     "power_ps": 340,      // ✅ Perfect from Perplexity
     "power_kw": 250,      // ✅ Perfect from Perplexity  
     "cylinders": 6,       // ✅ Perfect from Perplexity
     "fuel_type": "Diesel", // ✅ Perfect from Perplexity
     "confidence": "85-90%" // ✅ Excellent confidence
   }
   ```

2. **✅ Database Schema Errors - VOLLSTÄNDIG BEHOBEN**
   ```sql
   -- Added missing slug column
   ALTER TABLE offer ADD COLUMN slug TEXT DEFAULT NULL;
   CREATE UNIQUE INDEX idx_offer_slug_organization 
   ON offer (organization_id, slug) WHERE slug IS NOT NULL;
   
   -- Result: Auto-Save now works perfectly
   -- ✅ "Progress saved successfully for offer: c07f454d-7fe3-410e-b3f1-be8e7877fe96"
   ```

3. **✅ Claude API Model Error - BEHOBEN**
   ```typescript
   // Fixed non-existent model
   model: 'claude-3-5-sonnet-20241022', // NOT 'claude-3-5-sonnet-20241205'
   ```

#### 🎯 **WIZARD-SCHRITTE DETAILTEST**

| Schritt | Titel | Status | Features | Probleme |
|---------|-------|--------|----------|----------|
| 1/7 | **Fahrzeugdaten** | ✅ Perfekt | BMW, Modell, Typ-Auswahl | Keine |
| 2/7 | **Technische Details** | ✅ Perfekt | **Perplexity-Enrichment funktional!** | Keine |
| 3/7 | **Ausstattung** | ✅ Strukturiert | Kategorien, Custom Equipment | Checkbox-Erreichbarkeit |
| 4/7 | **Verfügbarkeit** | ✅ Vollständig | Preise, Historie, Liefertermin | Keine |
| 5/7 | **Finanzierung** | ✅ Funktional | Leasing/Kredit Toggle | Checkbox-Erreichbarkeit |
| 6/7 | **Ansprechpartner** | ⚠️ RLS-Issues | Struktur OK, Fehlende Daten | 403-Berechtigungsfehler |
| 7/7 | **Marketing** | ✅ Exzellent | SEO, KI-Texte, URL-Generation | Keine |

#### 📈 **HERAUSRAGENDE ERFOLGE**

1. **Perplexity-Enrichment perfekt integriert**
   - BMW X5: 340 PS, 250 kW, 6 Zylinder automatisch angezeigt
   - "Web-Recherche • 85% Konfidenz" UX-Indikator
   - Rate-Limiting und Fehlerbehandlung robust

2. **Auto-Save-Funktionalität komplett stabil**
   - 30-Sekunden-Intervall funktioniert einwandfrei
   - Keine PGRST204-Fehler mehr nach Slug-Fix

3. **Marketing-Suite professionell**
   - SEO-Titel/Beschreibung mit Zeichenzähler
   - KI-Vorschlag-Buttons für alle Textfelder
   - URL-Slug-Generierung: `bmw-x5-xdrive40d-m-sport-leasing`

#### ⚠️ **VERBLEIBENDE HERAUSFORDERUNGEN**

1. **ARIA-Label Warnings (200+ Instanzen)**
   ```javascript
   // Quelle: React Aria Components ohne Labels
   // Datei: node_modules_fd313a09._.js:1830
   "If you do not provide a visible label, you must specify an aria-label"
   
   // Betroffene Komponenten: Select, Checkbox, Input
   // Fix: Umfassende aria-label Implementation nötig
   ```

2. **RLS-Berechtigungsfehler (Ansprechpartner)**
   ```bash
   # 403-Fehler beim Laden von:
   - dealers table
   - sales_persons table
   
   # Lösung: RLS-Policies überprüfen/anpassen
   ```

3. **SVG Aspect-Ratio Warning**
   ```css
   /* Fix für /carvitra_colored.svg nötig */
   img { width: auto; height: auto; }
   ```

#### 🔧 **EMPFOHLENE NÄCHSTE SCHRITTE**

1. **PRIO 1**: ARIA-Label Warnings systematisch beheben
2. **PRIO 2**: RLS-Policies für Ansprechpartner-Daten korrigieren  
3. **PRIO 3**: SVG-Warning durch CSS-Anpassung lösen
4. **PRIO 4**: Landing Page Publishing-Flow vollständig testen

#### 💡 **LEARNINGS**

1. **Supabase Schema-Cache**: Nach Spalten-Hinzufügung kann Cache-Refresh nötig sein
2. **Perplexity Model-Namen**: Dokumentation vs. API können abweichen ('sonar' vs 'sonar-small-online')
3. **ARIA-Accessibility**: React Aria braucht explizite Labels für Screen Reader
4. **Auto-Save UX**: Funktioniert perfekt, gibt gutes User-Feedback

---

*Letzte Aktualisierung: 21. Januar 2025*