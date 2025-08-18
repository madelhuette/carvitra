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
- **Dictionary Tables**: Wiederverwendbare Stammdaten
- **Referential Integrity**: Vollständige FK-Constraints

### 🏢 Hauptentitäten

#### Organizations & Users
```sql
organizations  # Autohäuser/Händler
├── users         # Verkäufer/Admins (role-based)
└── invitations   # Team-Einladungssystem
```

#### Core Business Objects  
```sql
offer              # Hauptangebot (Fahrzeug + Finanzierung)
├── credit_offer      # 1:n Finanzierungsoptionen
└── offer_equipment   # n:m Ausstattungsmerkmale
```

#### Dictionary/Lookup Tables
```sql
# Fahrzeug-Klassifizierung
offer_type, vehicle_category, vehicle_type, make
fuel_type, transmission_type, availability_type

# Business Data
equipment, credit_offer_type, credit_institution
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
```bash
# Development (mit Turbopack)
npm run dev

# Production
npm run build && npm run start

# Code-Formatierung
npx prettier --write .
```

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

*Letzte Aktualisierung: Januar 2025*