# 🚗 CARVITRA - Automotive Leasing & Marketing Platform

> **Die innovative Plattform für Autohändler zur digitalen Vermarktung von Leasing- und Kaufangeboten**

## 🎯 Über CARVITRA

CARVITRA revolutioniert die Art und Weise, wie Autohändler ihre Fahrzeugangebote präsentieren. Mit unserer KI-gestützten Plattform erstellen Sie in Minuten professionelle Landing Pages aus einfachen PDF-Angeboten - ohne technisches Know-how oder externe Dienstleister.

## ⚡ Kernfunktionen

### 🤖 KI-gestützte Automatisierung
- **PDF-Analyse**: Automatische Extraktion aller Fahrzeug- und Angebotsdaten
- **Smart Fields**: Intelligente Feldbefüllung aus unstrukturierten Daten  
- **Schnelle Veröffentlichung**: Von PDF zu fertiger Landing Page in Minuten

### 🎯 Lead-Management
- **Strukturierte Erfassung**: Einheitliche, qualifizierte Leads
- **Flexible Zielsteuerung**: Leads an Einzelpersonen, Teams oder CRM-Systeme
- **Multi-Tenant**: Sichere Datentrennung zwischen Organisationen

### 📈 Marketing-Automatisierung
- **Google Ads Integration**: Automatisierte Display Network Kampagnen
- **KI-Content**: Automatische Generierung von Werbetexten und Anzeigen
- **SEO-Optimierung**: Für maximale organische Sichtbarkeit

## 🚀 Schnellstart

### Voraussetzungen
- Node.js 18+ 
- npm oder yarn
- Supabase Account
- Anthropic API Key (für KI-Features)

### Installation

1. Repository klonen:
```bash
git clone https://github.com/yourusername/carvitra.git
cd carvitra
```

2. Dependencies installieren:
```bash
npm install
```

3. Umgebungsvariablen konfigurieren:
```bash
cp .env.example .env.local
# Bearbeite .env.local mit deinen API Keys
```

4. Entwicklungsserver starten:
```bash
npm run dev
```

Die Anwendung läuft dann unter [http://localhost:3000](http://localhost:3000)

## 🏗️ Technologie-Stack

- **Frontend**: Next.js 15.4, React 19, TypeScript
- **UI Components**: Untitled UI React
- **Styling**: Tailwind CSS v4.1
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **KI Integration**: Anthropic Claude API
- **PDF Processing**: PDF.co API
- **Deployment**: Vercel

## 📁 Projektstruktur

```
carvitra/
├── src/
│   ├── app/          # Next.js App Router
│   ├── components/   # React Komponenten
│   ├── lib/          # Utilities und Services
│   ├── types/        # TypeScript Definitionen
│   └── styles/       # Globale Styles
├── supabase/
│   └── migrations/   # Datenbank-Migrationen
└── public/           # Statische Assets
```

## 🔐 Sicherheit

- **Row Level Security (RLS)**: Alle Datenbanktabellen sind mit RLS gesichert
- **Multi-Tenant Architektur**: Strikte Datentrennung zwischen Organisationen
- **Magic Bytes Verification**: PDF-Upload Sicherheitsprüfung
- **Signed URLs**: Sichere Dateizugriffe über temporäre URLs

## 🛠️ Entwicklung

### Verfügbare Scripts

```bash
npm run dev          # Entwicklungsserver starten
npm run build        # Production Build erstellen
npm run start        # Production Server starten
npm run dev:status   # Server-Status prüfen
npm run dev:clean    # Alle Dev-Server bereinigen
```

### Datenbank-Migrationen

Neue Migration erstellen:
```bash
# SQL-Datei in supabase/migrations/ erstellen
# Dann über Supabase Dashboard oder CLI ausführen
```

## 🤝 Contributing

Wir freuen uns über Beiträge! Bitte beachte:

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📄 Lizenz

Dieses Projekt ist proprietär und vertraulich. Alle Rechte vorbehalten.

## 📞 Support

Bei Fragen oder Problemen wende dich an:
- Email: support@carvitra.de
- Documentation: [docs.carvitra.de](https://docs.carvitra.de)

---

**CARVITRA** - Digitale Fahrzeugvermarktung neu gedacht.