# 📋 CARVITRA - Entwicklungsplan & Status

## 📅 Stand: Januar 2025

---

## ✅ Kürzlich abgeschlossene Arbeiten

### 🔒 Sicherheits-Implementierung für PDF-Upload (Erfolgreich)

#### Kritische Sicherheitsprobleme behoben:
1. **003_fix_storage_security.sql**
   - ✅ Storage Buckets von PUBLIC auf PRIVATE umgestellt
   - ✅ Umfassende RLS-Policies für INSERT, SELECT, UPDATE, DELETE
   - ✅ Multi-Tenant-Isolation auf Storage-Ebene implementiert
   - ✅ Organisation-basierte Ordnerstruktur erzwungen
   - ✅ Audit-Logging für Storage-Operationen vorbereitet

2. **Dual-Client-Architektur implementiert**
   - ✅ `/lib/supabase/client.ts` - Anon Key für DB-Operationen
   - ✅ `/lib/supabase/server.ts` - Server-Side Client
   - ✅ `/lib/supabase/admin.ts` - Service Role NUR für Storage
   - ✅ Sichere Trennung von Berechtigungen

3. **PDF-Upload API vollständig gesichert**
   - ✅ Magic Bytes Validation (%PDF-)
   - ✅ Größenprüfung (10MB Limit)
   - ✅ MIME-Type Validation
   - ✅ Signed URLs für private Storage-Zugriff
   - ✅ Audit-Logging implementiert

### 🗄️ Datenbank-Migration für PDF-System (Erfolgreich)

#### Durchgeführte Migrationen:
1. **001_pdf_documents_and_landingpages.sql**
   - ✅ Neue Tabelle: `pdf_documents` (Master-Templates für PDFs)
   - ✅ Neue Tabelle: `extraction_cache` (KI-Extraktions-Cache)
   - ✅ Neue Tabelle: `landingpages` (Generierte Landing Pages)
   - ✅ Neue Tabelle: `leads` (Kundenanfragen von Landing Pages)
   - ✅ Erweiterte `offers` Tabelle mit: `pdf_document_id`, `template_overrides`, `is_draft`
   - ✅ RLS-Policies für alle neuen Tabellen
   - ✅ Helper Functions: `update_updated_at_column()`, `generate_unique_slug()`, `increment_landingpage_views()`
   - ✅ Automatische Update-Trigger für Timestamps

2. **002_setup_storage_buckets.sql**
   - ✅ Storage Bucket `pdf-documents` (10MB Limit, nur PDFs)
   - ✅ Storage Bucket `vehicle-images` (5MB Limit, Bilder)
   - ✅ Storage Policies für sichere Zugriffskontrolle

#### Database Integrity Check Ergebnis:
- ✅ Alle 13 Tabellen vorhanden und korrekt
- ✅ 10 Foreign Key Beziehungen verifiziert
- ✅ 16 Performance-Indizes erstellt
- ✅ RLS auf 7 kritischen Tabellen aktiviert
- ✅ 6 Update-Trigger funktionsfähig
- ✅ 4 Helper Functions installiert
- ✅ Multi-Tenant Isolation gewährleistet
- ✅ Storage-Sicherheit durch Database Integrity Checker validiert

### 🎨 UI-Komponenten (Funktionsfähig)
- ✅ PDF-Library Komponente (`/src/components/pdf/pdf-library.tsx`)
- ✅ Dashboard mit Tab-Navigation
- ✅ Upload-Modal mit FileTrigger (Untitled UI konform)
- ✅ FileUpload-Komponenten korrekt importiert

### 📁 API-Routes (Vollständig implementiert)
- ✅ `/api/pdf/upload/route.ts` - Sicher implementiert mit Magic Bytes
- ✅ `/api/pdf/extract/route.ts` - PDF-Parse Integration
- ✅ Type Definitions für PDF-System
- ✅ Error Handling und Logging

---

## 🎯 Aktueller Projekt-Status

### Was funktioniert:
- ✅ Next.js App mit Untitled UI läuft stabil
- ✅ Supabase-Anbindung etabliert
- ✅ Authentication & Multi-Tenant System
- ✅ Dashboard mit Tab-Navigation
- ✅ Datenbank-Schema für PDF-System komplett
- ✅ **PDF-Upload zu Supabase Storage (FERTIG)**
- ✅ **Sichere Multi-Tenant Storage-Isolation**
- ✅ **Magic Bytes Validation für PDFs**
- ✅ **Signed URLs für privaten Zugriff**

### Was noch nicht funktioniert:
- ⚠️ PDF-Text-Extraktion (Basis vorhanden, KI fehlt)
- ❌ KI-Integration für intelligente Datenextraktion
- ❌ Landing Page Generation
- ❌ Lead-Erfassung
- ❌ Angebotserstellung aus PDFs

---

## 🚀 Nächste Entwicklungsschritte

### ✅ Phase 1: PDF-Upload funktionsfähig machen (ABGESCHLOSSEN)
1. **PDF-Upload API vervollständigt** ✅
   - ✅ Supabase Storage Integration in `/api/pdf/upload`
   - ✅ File-Validierung und Größenprüfung
   - ✅ Datenbank-Eintrag in `pdf_documents` erstellen
   - ✅ Response mit Upload-Status

2. **Frontend-Anbindung** ✅
   - ✅ Upload-Modal mit Supabase verbunden
   - ✅ FileTrigger für Dateiauswahl
   - ✅ Progress-States während Upload
   - ✅ Error-Handling und User-Feedback

3. **PDF-Library aktualisiert** ✅
   - ✅ Live-Daten aus Supabase laden
   - ✅ Status-Updates (processing_status)
   - ✅ Aktionen vorbereitet: View, Delete, Create Offer

### 🚧 Phase 2: KI-Integration für PDF-Extraktion (NÄCHSTER FOKUS)

#### Vorbereitende Schritte:
1. **OpenAI API Integration**
   - [ ] OpenAI API Key in Environment Variables
   - [ ] OpenAI Client Setup
   - [ ] Prompt-Templates für Fahrzeugdaten

2. **Intelligente Datenextraktion**
   - [ ] Strukturierte Prompts für verschiedene PDF-Typen
   - [ ] JSON-Schema für extrahierte Daten
   - [ ] Fahrzeugdaten: Marke, Modell, Ausstattung
   - [ ] Preisdaten: Listenpreis, Leasingrate, Laufzeit
   - [ ] Händlerdaten: Name, Adresse, Kontakt

3. **Extraction Pipeline**
   - [ ] PDF → Text (pdf-parse) ✅ Basis vorhanden
   - [ ] Text → Strukturierte Daten (OpenAI GPT-4)
   - [ ] Daten → extraction_cache Tabelle
   - [ ] Cache → pdf_documents.extracted_data
   - [ ] Confidence Scoring für Qualitätssicherung

4. **Progressive Enhancement**
   - [ ] Background Job für Extraktion
   - [ ] Status-Updates in Echtzeit
   - [ ] Retry-Mechanismus bei Fehlern
   - [ ] Manuelle Korrektur-UI

### Phase 3: Angebotserstellung (Priorität: MITTEL)
1. **Multi-Step Form**
   - Step 1: PDF auswählen oder hochladen
   - Step 2: Fahrzeugdaten (KI-unterstützt)
   - Step 3: Preise & Konditionen
   - Step 4: Customization & Preview

2. **Daten-Mapping**
   - PDF-Daten → Offer-Struktur
   - Template-Overrides verwalten
   - Draft/Published Status

3. **Validierung**
   - Pflichtfelder prüfen
   - Datentypen validieren
   - Business Rules anwenden

### Phase 4: Landing Page Generation (Priorität: MITTEL)
1. **Template-System**
   - Modern/Classic/Minimal Templates
   - Dynamic Content Injection
   - SEO-Metadata Generation

2. **Slug-Generation**
   - Automatisch aus Fahrzeugdaten
   - Uniqueness sicherstellen
   - SEO-freundliche URLs

3. **Preview & Publishing**
   - Live-Preview im Editor
   - Publish/Unpublish Toggle
   - QR-Code Generation

### Phase 5: Lead-Management (Priorität: NIEDRIG)
1. **Lead-Capture Form**
   - Responsive Formular auf Landing Pages
   - Validierung und Spam-Schutz
   - Thank-You Page

2. **Lead-Dashboard**
   - Übersicht aller Leads
   - Filter und Sortierung
   - Export-Funktionen

3. **Notifications**
   - Email-Benachrichtigung bei neuen Leads
   - Optional: SMS/WhatsApp Integration

---

## 🔧 Technische Schulden & Optimierungen

### Kurzfristig:
- [ ] Error-Boundary Components hinzufügen
- [ ] Loading States verbessern
- [ ] TypeScript Types aus Supabase generieren
- [ ] Environment Variables validieren

### Mittelfristig:
- [ ] Caching-Strategie implementieren
- [ ] Rate-Limiting für API-Routes
- [ ] Monitoring & Logging Setup
- [ ] Performance-Optimierungen

### Langfristig:
- [ ] Automated Testing Setup
- [ ] CI/CD Pipeline
- [ ] Backup-Strategie
- [ ] Disaster Recovery Plan

---

## 📝 Offene Fragen & Entscheidungen

1. **KI-Provider**: OpenAI vs. Claude API für PDF-Extraktion?
2. **Storage-Strategie**: Langzeit-Archivierung von PDFs?
3. **Multi-Language**: Internationale Unterstützung geplant?
4. **Analytics**: Welches Tracking-System für Landing Pages?
5. **Payment**: Stripe vs. Paddle für Token-System?

---

## 🎯 Definition of Done

Ein Feature gilt als fertig wenn:
- [ ] Code Review durchgeführt
- [ ] TypeScript ohne Errors
- [ ] UI responsive auf allen Geräten
- [ ] Error Handling implementiert
- [ ] Loading States vorhanden
- [ ] Dokumentation aktualisiert
- [ ] Manuell getestet

---

## 📊 Projekt-Metriken

- **Fortschritt**: ~40% des MVP ✅
- **Letzter Milestone**: ✅ Sicherer PDF-Upload implementiert
- **Nächster Milestone**: KI-Integration für Datenextraktion
- **Geschätzte Zeit bis MVP**: 1-2 Wochen
- **Kritischer Pfad**: ~~PDF-Upload~~ → **KI-Extraktion** → Landing Page Generation
- **Aktuelle Phase**: Phase 2 - KI-Integration

### 📈 Fortschritts-Tracking:
- **Phase 1**: ✅ PDF-Upload (100% abgeschlossen)
- **Phase 2**: 🚧 KI-Extraktion (10% - Basis vorhanden)
- **Phase 3**: ⏳ Angebotserstellung (0%)
- **Phase 4**: ⏳ Landing Pages (0%)
- **Phase 5**: ⏳ Lead-Management (0%)

---

*Letzte Aktualisierung: Januar 2025*
*Nächste Review: Nach KI-Integration (Phase 2)*