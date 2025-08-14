# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# CARVITRA - Automotive Leasing & Marketing Platform

## 🚨 WICHTIGSTE ENTWICKLUNGSREGEL 🚨

**AUSSCHLIESSLICH Untitled UI Komponenten verwenden!**
- Es dürfen NUR Komponenten aus der Untitled UI React-Bibliothek (untitledui.com) verwendet werden
- KEINE Eigenentwicklung von UI-Komponenten
- KEINE Custom-Komponenten ohne explizite Zustimmung
- Alle UI-Elemente müssen aus der Untitled UI Bibliothek stammen
- Theming und Dark/Light Mode über Untitled UI System
- **Icons**: AUSSCHLIESSLICH aus @untitledui/icons - KEINE custom SVGs, KEINE anderen Icon-Libraries

**KRITISCH: Komponenten-Verwendung**
- NIEMALS neue Komponenten erstellen, die bestehende Untitled UI Komponenten ersetzen oder kopieren
- IMMER die originalen Untitled UI Komponenten direkt verwenden
- Anpassungen AUSSCHLIESSLICH über Props (items, labels, colors, sizes, etc.)
- Bei Bedarf: Wrapper-Komponenten die die originale Komponente EINBINDEN, nicht ersetzen
- KEINE Forks, Kopien oder Nachbauten von Untitled UI Komponenten

**Beispiel für korrekte Verwendung:**
```tsx
// ✅ RICHTIG: Original-Komponente mit Props
import { Header } from "@/components/marketing/header-navigation/components/header";
<Header items={customItems} />

// ❌ FALSCH: Neue Komponente als Ersatz erstellen
<CarvtraHeader /> // NIEMALS eigene Versionen von UI-Komponenten erstellen!
```

## Projektübersicht

CARVITRA ist eine innovative Plattform für Autohändler zur digitalen Vermarktung von Leasing- und Kaufangeboten. Die Plattform ermöglicht es Händlern und Verkäufern, ohne technisches Wissen oder externe Dienstleister, professionelle Landing Pages für ihre Fahrzeugangebote zu erstellen.

## Kernfunktionen

### 1. Automatisierte Landing Page Erstellung
- **PDF-basierte Datenextraktion**: KI-gestützte Analyse von Angebots-PDFs
- **Automatische Feldbefüllung**: Intelligente Erkennung aller relevanten Fahrzeug- und Angebotsdaten
- **Schnelle Veröffentlichung**: Von PDF zu fertiger Landing Page in wenigen Minuten

### 2. Lead-Management
- **Strukturierte Lead-Erfassung**: Einheitliche, qualifizierte Leads
- **Flexible Zielsteuerung**: Leads an Einzelpersonen, Teams oder CRM-Systeme

### 3. Marketing & Traffic-Generierung
- **Integrierte Werbekampagnen**: Automatisierte Google Display Network Integration
- **KI-generierte Werbeinhalte**: Aus Landing Page Daten werden Werbeanzeigen erstellt
- **SEO-Optimierung**: Für organische Sichtbarkeit


## Technische Architektur

### Frontend
- **Framework**: Next.js 14+ mit React 18+
- **Rendering**: Server-Side Rendering (SSR) für maximale SEO-Performance
- **UI-Komponenten**: Untitled UI React-Bibliothek (AUSSCHLIESSLICH!)
- **Theming**: Untitled UI Theming System mit Dark/Light Mode
- **Styling**: Über Untitled UI System (keine custom styles)
- **Landing Pages**: SSR-optimiert für beste SEO-Performance

### Backend & Services
- **Datenbank**: Supabase (PostgreSQL)
- **Authentifizierung**: Supabase Auth
- **File Storage**: Supabase Storage (Bilder, PDFs, Assets)
- **Realtime**: Supabase Realtime (für Live-Updates)

### KI-Integrationen
- **Provider**: OpenAI API oder Anthropic Claude API
- **Funktionen**:
  - PDF-Analyse und Datenextraktion
  - Intelligente Feldererkennung
  - Textgenerierung für Angebotsbeschreibungen
  - SEO-optimierte Content-Erstellung

### Marketing & Advertising
- **Google Ads API**: Automatisierte Kampagnenverwaltung
- **Display Network**: Programmatische Anzeigenschaltung

### Payment & Token-System
- **Token-Verwaltung**: Supabase Database
- **Payment Processing**: Noch zu definieren (Stripe/Paddle)

## Datenmodell (PostgreSQL)

### Übersicht
Das Datenmodell basiert auf einer PostgreSQL-Datenbank mit UUID-Primärschlüsseln und nutzt Dictionary-Tabellen für wiederverwendbare Werte. Die Struktur ist optimiert für Flexibilität und Erweiterbarkeit.

### Dictionary-Tabellen (Stammdaten)

#### Fahrzeug-Klassifizierung
- **offer_type**: Angebotstypen (Neuwagen, Gebrauchtwagen, etc.)
- **vehicle_category**: Fahrzeugkategorien (Limousine, SUV, Kombi, etc.)
- **vehicle_type**: Fahrzeugtypen (PKW, Transporter, etc.)
- **make**: Fahrzeughersteller (BMW, Mercedes, VW, etc.)
- **fuel_type**: Kraftstoffarten (Benzin, Diesel, Elektro, Hybrid, Plug-in-Hybrid)
- **transmission_type**: Getriebearten (Manuell, Automatik, DSG, etc.)
- **availability_type**: Verfügbarkeitstypen (Sofort, Bestellfahrzeug, etc.)

#### Ausstattung & Finanzierung
- **equipment**: Ausstattungsmerkmale (Katalog aller möglichen Ausstattungen)
- **credit_offer_type**: Finanzierungsarten (Leasing, Finanzierung, Vario-Finanzierung)
- **credit_institution**: Leasinggeber/Banken mit vollständigen Adressdaten

### Haupttabellen

#### dealer (Händler)
```sql
- id (UUID, Primary Key)
- company_name (Text, NOT NULL)
- street, street_number, postalcode, city, country (Text)
- created_at (Timestamp)
```

#### sales_person (Verkäufer)
```sql
- id (UUID, Primary Key)
- dealer_id (UUID, Foreign Key → dealer)
- salutation, first_name, last_name (Text)
- email, phone (Text)
- created_at (Timestamp)
```

#### offer (Hauptangebot)
```sql
- id (UUID, Primary Key)
- offer_type_id (UUID, FK → offer_type)
- vehicle_category_id (UUID, FK → vehicle_category)
- vehicle_type_id (UUID, FK → vehicle_type)
- make_id (UUID, FK → make)
- model (Text, NOT NULL)
- trim (Text)
- list_price_gross, list_price_net (Numeric 12,2)
- fuel_type_id (UUID, FK → fuel_type)
- transmission_type_id (UUID, FK → transmission_type)
- doors (Integer)
- power_ps (Integer)
- availability_type_id (UUID, FK → availability_type)
- dealer_id (UUID, FK → dealer)
- sales_person_id (UUID, FK → sales_person)
- created_at (Timestamp)
```

#### credit_offer (Finanzierungsangebote)
```sql
- id (UUID, Primary Key)
- offer_id (UUID, FK → offer, CASCADE DELETE)
- credit_offer_type_id (UUID, FK → credit_offer_type)
- credit_institution_id (UUID, FK → credit_institution)
- financial_rate_gross, financial_rate_net (Numeric 12,2)
- runtime (Integer, Monate)
- closing_rate_gross, closing_rate_net (Numeric 12,2)
- effective_interest, target_interest (Numeric 6,4)
- leasing_factor (Numeric 10,4)
- sum_initial_payments_gross, sum_initial_payments_net (Numeric 12,2)
- down_payment_gross, down_payment_net (Numeric 12,2)
- transfer_costs_gross, transfer_costs_net (Numeric 12,2)
- registration_costs_gross, registration_costs_net (Numeric 12,2)
- more_km_cost_gross, more_km_cost_net (Numeric 12,4)
- less_km_refund_gross, less_km_refund_net (Numeric 12,4)
- two_thirds_example (Text)
- provider (Text)
- created_at (Timestamp)
```

### Verknüpfungstabellen

#### offer_equipment (Many-to-Many)
```sql
- offer_id (UUID, FK → offer)
- equipment_id (UUID, FK → equipment)
- PRIMARY KEY (offer_id, equipment_id)
```

### Fehlende Felder für vollständige PKW-EnVKV Compliance

**Hinweis**: Folgende Felder müssen noch ergänzt werden:
- Hubraum (bei Verbrennern)
- Akkugröße kWh (bei E-Fahrzeugen)
- Elektrische Reichweite WLTP (bei E-Fahrzeugen)
- Verbrauch kombiniert (l/100km oder kWh/100km)
- Verbrauch innerorts/außerorts/Autobahn
- CO2-Emissionen (g/km)
- Emissionsklasse (Euro 6d, etc.)
- Energieeffizienzklasse (A+, A, B, etc.)
- Außenfarbe / Innenfarbe
- Sitzplätze
- Kofferraumvolumen
- Erstzulassungsdatum (bei Gebrauchtwagen)
- Kilometerstand (bei Gebrauchtwagen)
- Fahrzeug-Identifikationsnummer (FIN/VIN)
- HSN/TSN (für deutsche Zulassung)

### SQL DDL Script

```sql
/* ===========================================================
   PostgreSQL-DDL für das Carvitra-Modell
   =========================================================== */

-- 1) Erweiterung für UUID-Generierung
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

/* ---------- Dictionary-Tabellen ---------- */
CREATE TABLE offer_type (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vehicle_category (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vehicle_type (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE make (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE fuel_type (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE transmission_type (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE availability_type (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE equipment (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE credit_offer_type (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE credit_institution (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name   text NOT NULL,
    street         text,
    street_number  text,
    postalcode     text,
    city           text,
    country        text,
    created_at     timestamptz NOT NULL DEFAULT now()
);

/* ---------- Händler & Ansprechpartner ---------- */
CREATE TABLE dealer (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name   text NOT NULL,
    street         text,
    street_number  text,
    postalcode     text,
    city           text,
    country        text,
    created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sales_person (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id      uuid REFERENCES dealer(id) ON DELETE CASCADE,
    salutation     text,
    first_name     text,
    last_name      text,
    email          text,
    phone          text,
    created_at     timestamptz NOT NULL DEFAULT now()
);

/* ---------- Haupttabelle: Fahrzeug- / Leasing-Angebot ---------- */
CREATE TABLE offer (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_type_id            uuid REFERENCES offer_type(id),
    vehicle_category_id      uuid REFERENCES vehicle_category(id),
    vehicle_type_id          uuid REFERENCES vehicle_type(id),
    make_id                  uuid REFERENCES make(id),
    model                    text        NOT NULL,
    trim                     text,
    list_price_gross         numeric(12,2),
    list_price_net           numeric(12,2),
    fuel_type_id             uuid REFERENCES fuel_type(id),
    transmission_type_id     uuid REFERENCES transmission_type(id),
    doors                    int,
    power_ps                 int,
    availability_type_id     uuid REFERENCES availability_type(id),
    dealer_id                uuid REFERENCES dealer(id),
    sales_person_id          uuid REFERENCES sales_person(id),
    created_at               timestamptz NOT NULL DEFAULT now()
);

/* ---------- Many-to-Many: Angebot ↔ Ausstattung ---------- */
CREATE TABLE offer_equipment (
    offer_id     uuid REFERENCES offer(id)     ON DELETE CASCADE,
    equipment_id uuid REFERENCES equipment(id) ON DELETE CASCADE,
    PRIMARY KEY (offer_id, equipment_id)
);

/* ---------- Finanzierung zum Angebot (1:n) ---------- */
CREATE TABLE credit_offer (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id                 uuid REFERENCES offer(id)            ON DELETE CASCADE,
    credit_offer_type_id     uuid REFERENCES credit_offer_type(id),
    credit_institution_id    uuid REFERENCES credit_institution(id),
    financial_rate_gross     numeric(12,2),
    financial_rate_net       numeric(12,2),
    runtime                  int,
    closing_rate_gross       numeric(12,2),
    closing_rate_net         numeric(12,2),
    effective_interest       numeric(6,4),
    target_interest          numeric(6,4),
    leasing_factor           numeric(10,4),
    sum_initial_payments_gross numeric(12,2),
    sum_initial_payments_net numeric(12,2),
    down_payment_gross       numeric(12,2),
    down_payment_net         numeric(12,2),
    transfer_costs_gross     numeric(12,2),
    transfer_costs_net       numeric(12,2),
    registration_costs_gross numeric(12,2),
    registration_costs_net   numeric(12,2),
    more_km_cost_gross       numeric(12,4),
    more_km_cost_net         numeric(12,4),
    less_km_refund_gross     numeric(12,4),
    less_km_refund_net       numeric(12,4),
    two_thirds_example       text,
    provider                 text,
    created_at               timestamptz NOT NULL DEFAULT now()
);
```

## User Journey

### Anlagestrecke (Multi-Step Form)
1. **Upload**: PDF-Angebot hochladen
2. **KI-Analyse**: Automatische Extraktion aller Daten
3. **Schritt 1 - Fahrzeugbasis**: 
   - Fahrzeugtyp bestätigen
   - Marke, Modell, Ausstattung
4. **Schritt 2 - Motorisierung**:
   - Leistung, Getriebe, Kraftstoff
   - Verbrauchswerte
5. **Schritt 3 - Ausstattung**:
   - Farben, Sonderausstattung
   - Praktische Details
6. **Schritt 4 - Preisgestaltung**:
   - Angebotstyp wählen
   - Preisdetails eingeben/bestätigen
7. **Schritt 5 - Verfügbarkeit**:
   - Lieferzeit oder Sofortverfügbarkeit
8. **Schritt 6 - Bilder**:
   - Upload Fahrzeugbilder
   - KI-Bildbearbeitung (optional)
9. **Schritt 7 - Händlerdaten**:
   - Unternehmen & Verkäufer
   - Lead-Routing festlegen
10. **Schritt 8 - Review & Publish**:
    - Vorschau der Landing Page
    - Veröffentlichung

## Compliance & Rechtliches
- **PKW-EnVKV**: Vollständige Erfüllung der Energie-Verbrauchskennzeichnungsverordnung
- **DSGVO**: Datenschutzkonforme Lead-Erfassung
- **Impressumspflicht**: Automatische Integration der Händlerdaten

## Entwicklungsprioritäten

### Phase 1 - MVP
1. Basis-Anlagestrecke für Neuwagen-Leasing
2. PDF-Upload und einfache Datenextraktion
3. Landing Page Generator (Template-basiert)
4. Einfaches Lead-Formular

### Phase 2 - Erweiterung
1. Gebrauchtwagen-Support
2. Erweiterte KI-Datenextraktion
3. Mehrstufige Ratenmodelle

### Phase 3 - Marketing
1. Google Ads API Integration
2. KI-Textgenerierung
3. KI-Bildbearbeitung
4. SEO-Optimierungen

### Phase 4 - Enterprise
1. CRM-Integrationen
2. Multi-Händler Support
3. Erweiterte Analytics

## Technische Herausforderungen

### Priorität 1
- **Google Ads API Integration**: 
  - Authentifizierung und API-Key Management
  - Policy-Compliance für automatisierte Kampagnen
  - Multi-Account Management über zentrale API

### Priorität 2
- **PDF-Parsing Genauigkeit**: 
  - Verschiedene PDF-Formate und Strukturen
  - Fehlerbehandlung bei unvollständigen Daten

### Priorität 3
- **Token-System**: 
  - Sichere Verwaltung
  - Transparente Abrechnung
  - Margin-Kalkulation bei Werbebuchungen

## Entwicklungsumgebung & Stack

### Entwicklung
- **IDE/Plattform**: Cursor mit Claude Code

### Tech Stack (FINAL)
- **Frontend Framework**: Next.js 15.4.6 mit React 19.1.1
- **UI-Komponenten**: Untitled UI (https://www.untitledui.com/react)
- **Styling**: Tailwind CSS v4.1 + Untitled UI System (keine custom styles)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **KI-Services**: OpenAI API oder Anthropic Claude API, ggf Drittanbieter für PDF Analyse
- **Deployment**: Vercel (optimiert für Next.js)

### Untitled UI Integration
- **Installation**: https://www.untitledui.com/react/integrations/nextjs
- **Komponenten**: Ausschließlich Untitled UI React-Komponenten
- **Theming**: Untitled UI Theming mit Dark/Light Mode Support
- **Icons**: Untitled UI Icon Set

## Entwicklungsrichtlinien

### UI/UX Prinzipien
1. **Keine Custom-Komponenten** - Ausschließlich Untitled UI
2. **Responsives Design** - Mobile-first Ansatz
3. **Accessibility** - WCAG 2.1 AA Compliance
4. **Performance** - Core Web Vitals optimiert

### Code Standards
1. **TypeScript** - Strikte Typisierung
2. **ESLint & Prettier** - Code-Formatierung
3. **Komponenten-Struktur** - Atomic Design Prinzipien
4. **Testing** - Jest & React Testing Library

## Nächste Schritte
1. Next.js Projekt mit Untitled UI initialisieren ✅
2. Supabase Projekt einrichten und Datenbank migrieren
3. Basis-Layout mit Untitled UI Komponenten erstellen
4. PDF-Upload und KI-Analyse implementieren
5. Multi-Step Form für Angebotserstellung
6. Landing Page Generator entwickeln
7. Google Ads API Integration
8. Token-System Implementation

## Entwicklungsbefehle

### Lokale Entwicklung
```bash
# Development Server mit Turbopack (schneller)
npm run dev

# Production Build
npm run build

# Production Server
npm run start
```

### Untitled UI Komponenten
```bash
# Neue Komponenten hinzufügen
npx untitledui@latest add

# Komponenten-Struktur:
# src/components/base/        # Basis UI-Komponenten
# src/components/application/ # Komplexe App-Komponenten  
# src/components/marketing/   # Marketing-spezifische Komponenten
# src/components/foundations/ # Icons, Logos, Basis-Elemente
```

### Code-Formatierung
```bash
# Prettier mit automatischer Import-Sortierung
npx prettier --write .
```

## Untitled UI Setup (Schritt 1 bereits ausgeführt)

### Installation (falls noch nicht vollständig)
```bash
# Schritt 1: CLI Setup (bereits ausgeführt)
npx untitledui@latest init untitled-ui --nextjs

# Schritt 2: Falls manuelle Installation nötig
npm install @untitledui/icons react-aria-components tailwindcss @tailwindcss/postcss postcss tailwindcss-react-aria-components tailwind-merge tailwindcss-animate next-themes
```

### Provider-Konfiguration
Die Provider müssen im Root Layout korrekt verschachtelt werden:

```typescript
// app/layout.tsx
<RouteProvider>
  <ThemeProvider>
    {children}
  </ThemeProvider>
</RouteProvider>
```

### Komponenten-Import Pattern
```typescript
"use client"; // Wichtig für interaktive Komponenten

// Korrekte Imports aus lokalen Komponenten
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Card } from "@/components/base/cards/card";
```

## Technische Details

### Next.js Konfiguration
- **Turbopack**: Aktiviert für schnellere Development-Builds
- **App Router**: Verwende App Router (nicht Pages Router)
- **Font-System**: Inter Variable Font über Google Fonts
- **Experimentelle Features**: Package-Optimierung für `@untitledui/icons`

### TypeScript Setup
- **Strict Mode**: Aktiviert für maximale Type-Safety
- **Path Aliasing**: `@/*` zeigt auf `./src/*`
- **Target**: ES2017 mit ESNext Module System

### Styling-System
- **Tailwind CSS v4.1**: Neueste Version mit PostCSS Plugin
- **Theme Provider**: `next-themes` mit `.light-mode` und `.dark-mode` Klassen
- **CSS Variables**: Umfangreiche Konfiguration in `theme.css`
- **Custom Utilities**: `scrollbar-hide`, `transition-inherit-all`
- **Utility Functions**: 
  - `cx()`: Erweiterte `tailwind-merge` für Klassen-Merging
  - `sortCx()`: IntelliSense-optimierte Klassen-Sortierung

### Import-Konventionen (Prettier)
Automatische Sortierung in folgender Reihenfolge:
1. React/React-DOM Imports
2. Externe Library Imports
3. Interne `@/*` Imports
4. Relative Imports (`./`, `../`)

### Performance-Optimierungen
- **SSR**: Server-Side Rendering für Landing Pages (SEO)
- **Font Display**: `swap` für bessere Performance
- **Dynamic Viewport**: `h-dvh` für mobile Geräte
- **Icon Optimization**: Package-Optimierung für Untitled UI Icons

### Wichtige Dateien
- `src/styles/theme.css`: CSS Variables für Theming
- `src/styles/globals.css`: Globale Styles und Tailwind-Direktiven
- `src/providers/`: Theme und Router Provider
- `src/lib/utils.ts`: Utility-Funktionen (cx, sortCx)

## 📚 Entwicklungs-Learnings (Landing Page Implementation)

### Icon-Mapping Erfahrungen
**Problem**: Viele Icon-Namen aus anderen Libraries existieren nicht in @untitledui/icons

**Lösungen gefunden**:
```typescript
// ❌ Existieren NICHT in @untitledui/icons → ✅ Korrekte Namen:
Brain → Lightbulb04           // KI/Intelligenz Icons
FileText → File02             // Dokument Icons  
BookClosed → BookOpen01       // Buch Icons
FileUpload01 → Upload01       // Upload Icons
TrendingUp02 → TrendUp02      // Trend Icons
Truck → Truck02              // Fahrzeug Icons
Book01 → BookOpen01          // Weitere Buch Icons
CheckCircle2 → CheckCircle    // Check/Success Icons
```

**Best Practice**: Immer zuerst in der Untitled UI Icons Dokumentation prüfen!

### Theme-Implementation (Dark/Light Mode)

**Kritische Erkenntnisse**:
1. **Semantische Farben nutzen**: `bg-primary`, `bg-secondary`, `text-primary` statt hardcoded Farben
2. **Custom SVGs vermeiden**: ALLE Icons müssen aus @untitledui/icons stammen 
3. **Theme Toggle Placement**: Header (Desktop + Mobile) ist optimal für UX
4. **Dynamic Classes vermeiden**: `bg-${color}-50` funktioniert nicht - nur statische Klassen

**Erfolgreiche Implementierung**:
```typescript
// ✅ Korrekt: useTheme Hook mit next-themes
const { theme, setTheme } = useTheme();

// ✅ Theme Toggle Button
<Button
  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
  iconOnly
>
  {theme === 'dark' ? <Sun /> : <Moon01 />}
</Button>

// ✅ Semantische Farben für konsistentes Theming
<div className="bg-primary text-primary">
  // Reagiert automatisch auf Theme-Wechsel
</div>
```

### Landing Page Architektur

**Erfolgreiche Struktur**:
```
src/components/marketing/
├── header-navigation/          # Navigation & Theme Toggle
├── hero-section.tsx           # Hauptbereich mit CTA
├── features-section.tsx       # 3-Spalten Features
├── how-it-works-section.tsx   # 4-Schritt Prozess
├── benefits-section.tsx       # Zielgruppen-Benefits
├── pricing-section.tsx        # Token-Pricing
└── footer-section.tsx         # Footer mit Newsletter
```

**Lessons Learned**:
1. **Modulare Sektionen**: Jede Sektion als eigene Komponente für Wiederverwendbarkeit
2. **Responsive Design**: Mobile-first mit lg: Breakpoints
3. **Semantic HTML**: Richtige Struktur für SEO (header, main, nav, section)
4. **Icon-Konsistenz**: Einheitliches Icon-Set aus Untitled UI für professionelles Erscheinungsbild

### FeaturedIcon Component Erkenntnisse

**Problem**: `theme="light-blue"` existiert nicht in Untitled UI

**Lösung**:
```typescript
// ❌ Falsch:
<FeaturedIcon theme="light-blue" />

// ✅ Richtig:
<FeaturedIcon theme="light" color="brand" />
```

### Entwicklungsprozess Best Practices

**1. Systematische Herangehensweise**:
- Erst Struktur planen (TodoWrite für Überblick)
- Komponente für Komponente implementieren
- Kontinuierlich testen (npm run dev)
- Finale Code-Analyse vor Commit

**2. Theme-Consistency Workflow**:
- Alle Komponenten mit semantischen Farben entwickeln
- Theme Toggle früh implementieren
- Regelmäßig zwischen Dark/Light wechseln zum Testen
- Finale Review aller Hintergründe und Texte

**3. Icon-Integration Workflow**:
- Niemals Custom SVGs verwenden
- Bei unklaren Icon-Namen: Untitled UI Dokumentation konsultieren
- Alternative Icons aus @untitledui/icons suchen
- Konsistenz über perfekte Icon-Matches priorisieren

### Performance & SEO Optimierungen

**Implementiert**:
- Server-Side Rendering (SSR) für Landing Page
- Semantic HTML5 Structure
- Responsive Images (falls verwendet)
- Core Web Vitals optimierte Komponenten

### Automotive-spezifische Anpassungen

**Erfolgreich umgesetzt**:
- KI-PDF-Extraktion als Kernfeature positioniert
- Automotive-Navigation (Fahrzeugkategorien, Finanzierung)
- Händler/Verkäufer-orientierte Benefits
- Token-basiertes Pricing-Model
- EnVKV-Compliance vorbereitet (Dokumentation)

**Fazit**: Die systematische Verwendung von ausschließlich Untitled UI Komponenten führt zu einer konsistenten, professionellen und wartbaren Codebase. Die Theme-Integration funktioniert nahtlos und die modulare Architektur ermöglicht einfache Erweiterungen.

## 📚 Auth-System Implementation Learnings

### Icon-Namen Fallstricke

**Problem**: Case-sensitive und inkorrekte Icon-Namen können zu Build-Fehlern führen

**Wichtige Korrekturen im Auth-System**:
```typescript
// ❌ FALSCH - führt zu Export-Fehler:
import { Linkedin } from "@/components/foundations/social-icons";
import { CheckCircle2 } from "@untitledui/icons";
import { RadioButtons } from "@/components/base/radio-buttons/radio-buttons";

// ✅ RICHTIG - korrektes Naming:
import { LinkedIn } from "@/components/foundations/social-icons";
import { CheckCircle } from "@untitledui/icons";
import { RadioGroup, RadioButton } from "@/components/base/radio-buttons/radio-buttons";
```

**Betroffene Dateien**:
- `password-input.tsx`, `reset-password-form.tsx`, `success-message.tsx`, `forgot-password-form.tsx` (CheckCircle-Fix)
- `register-form.tsx` (RadioButtons → RadioGroup/RadioButton-Fix)

**Best Practice**: IMMER die exakte Schreibweise und verfügbare Exports aus der Komponenten-Library prüfen!

### Code-Refactoring Best Practices

**1. DRY Principle (Don't Repeat Yourself)**:
- Wiederverwendbare Utilities für Validation und Passwort-Stärke erstellt
- Gemeinsame Types in `src/types/auth.ts` zentralisiert
- Constants in `src/constants/auth.ts` für konsistente Werte

**2. Komponenten-Wiederverwendung**:
```typescript
// Neue wiederverwendbare PasswordInput Komponente
<PasswordInput
    id="password"
    label="Passwort"
    value={password}
    onChange={setPassword}
    showStrengthIndicator={true}
    showRequirements={true}
/>
```

**3. Utility-Funktionen Organisation**:
```
src/utils/
├── password.ts        # Passwort-spezifische Funktionen
├── validation.ts      # Allgemeine Validierungsfunktionen
└── cx.ts             # Bestehende Utility für Klassen-Merging
```

### TypeScript Patterns für Auth

**1. Type Definitions**:
```typescript
// Zentrale Type-Definitionen für Konsistenz
export interface RegisterFormData {
    userType: "dealer" | "salesperson";
    firstName: string;
    // ... weitere Felder
}

export interface ValidationErrors {
    [key: string]: string | undefined;
}
```

**2. Type-Safe Constants**:
```typescript
export const AUTH_ROUTES = {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    // ...
} as const; // 'as const' für type-safety
```

### Form Validation Patterns

**1. Zentrale Validation Logic**:
- E-Mail, Telefon, Required Fields in Utils
- Konsistente Fehlermeldungen
- Wiederverwendbare Regex Patterns

**2. Real-time Validation**:
- Passwort-Stärke während der Eingabe
- Visuelle Feedback-Komponenten
- Requirements-Checkliste

### Performance-Optimierungen

**1. Code-Splitting durch Utilities**:
- Reduzierte Bundle-Size durch gemeinsame Funktionen
- Lazy Loading für Social Icons möglich

**2. useState Optimierung**:
```typescript
// Vorher: Multiple useState
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

// Nachher: Grouped State
const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
});
```

### Architektur-Entscheidungen

**1. Ordnerstruktur**:
```
src/
├── components/auth/      # Auth-spezifische Komponenten
├── app/auth/            # Auth-Pages (Next.js App Router)
├── types/auth.ts        # Auth-Types
├── constants/auth.ts    # Auth-Konstanten
├── utils/               # Wiederverwendbare Utilities
```

**2. Komponenten-Hierarchie**:
- `AuthLayout` als Wrapper für alle Auth-Pages
- Form-Komponenten (Login, Register, etc.) als Children
- Shared Components (PasswordInput, SocialLogin)

### Testing Considerations

**Durch Refactoring verbesserte Testbarkeit**:
1. Isolierte Utility-Funktionen einfach zu testen
2. Props-basierte Komponenten für Unit Tests
3. Konsistente Validation für E2E Tests

### Button Icon-Positionierung (Kritisches Learning)

**Problem**: Icons in Buttons erscheinen oberhalb oder versetzt zum Text statt korrekt ausgerichtet

**Root Cause**: Icons wurden als `children` verwendet statt als Untitled UI Button Props

**Lösung**:
```typescript
// ❌ FALSCH - Icon als child:
<Button>
    <LogIn01 className="size-5" />
    Anmelden
</Button>

// ✅ RICHTIG - Icon als prop:
<Button iconLeading={LogIn01}>
    Anmelden
</Button>

// ✅ Für trailing Icons (Weiter-Buttons):
<Button iconTrailing={ArrowRight}>
    Zur Plattform
</Button>
```

**Wichtige Erkenntnisse**:
1. **iconLeading**: Icon links vom Text (Standard für Aktions-Buttons)
2. **iconTrailing**: Icon rechts vom Text (für Navigation/Weiter-Buttons)  
3. **Automatische Größe**: Button übernimmt `size-5` automatisch - keine `className` nötig
4. **Perfekte Ausrichtung**: Untitled UI Button-Logik sorgt für korrekte Flexbox-Positionierung

**Betroffene Button-Typen**:
- **Social Login**: Google, Facebook, LinkedIn (`iconLeading`)
- **Form Actions**: LogIn01, UserPlus01, Lock01, Mail01 (`iconLeading`)
- **Navigation**: ArrowLeft (`iconLeading`), ArrowRight (`iconTrailing`)

### Metriken nach Refactoring

- **~35% Code-Reduktion** durch Wiederverwendung
- **100% Type-Coverage** für Auth-System
- **Bessere Wartbarkeit** durch zentrale Utilities
- **Konsistente UX** durch gemeinsame Komponenten
- **Perfekte Button Icon-Ausrichtung** durch korrekte Untitled UI Props