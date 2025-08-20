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

---

*Letzte Aktualisierung: Januar 2025*