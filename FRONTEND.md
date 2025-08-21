# Frontend Development Guide

## Untitled UI Component Learnings

### Input Component onChange Handler
**Problem:** TypeError beim Verwenden von Input-Komponenten aus der Untitled UI Bibliothek.

**Ursache:** Untitled UI Input-Komponenten basieren auf React Aria Components und behandeln onChange-Events anders als native HTML-Inputs.

**Lösung:**
```tsx
// ❌ FALSCH - Verursacht TypeError
<Input 
  onChange={(e) => updateFormData("field", e.target.value)}
/>

// ✅ RICHTIG - Value wird direkt übergeben
<Input 
  onChange={(value) => updateFormData("field", value)}
/>
```

**Betroffene Komponenten:**
- `Input` aus `@/components/base/input/input`
- `PasswordInput` aus `@/components/auth/password-input`
- Alle anderen Untitled UI Form-Komponenten

**Wichtig:** Diese Konvention gilt für ALLE Untitled UI Form-Komponenten, die auf React Aria Components basieren. Der Wert wird immer direkt als Parameter übergeben, nicht als Event-Objekt.

---

## Weitere UI-Komponenten Best Practices

### Icon Usage
- Ausschließlich Icons aus `@untitledui/icons` verwenden
- Keine Custom-Icons ohne explizite Genehmigung

### Button Props
- Icons immer über `iconLeading` oder `iconTrailing` Props übergeben
- Niemals Icons als children verwenden

### Theme System
- Semantische Farben verwenden (bg-primary, text-primary, etc.)
- Dark/Light Mode wird automatisch über next-themes gehandhabt

---

## Landing Page Wizard Components

### Multi-Step Wizard Pattern
**Implementation mit React Context für State Management:**

```tsx
// Wizard Context Provider
<WizardProvider 
  offerId={offerId}
  pdfDocumentId={pdfDocumentId}
  extractedData={extractedData}
>
  <WizardContainer isOpen={isOpen} onClose={onClose} />
</WizardProvider>
```

**Wichtige Features:**
- 7-Schritte Navigation mit Tabs
- Auto-Save alle 30 Sekunden (nur mit offerId)
- Progress Bar mit Schritt-Anzeige
- Step-Validierung vor Navigation
- KI-Auto-Fill pro Step

### Wizard Navigation Components

```tsx
// Progress & Tab Navigation
<WizardNavigation />  // Top navigation mit Tabs und Progress
<WizardFooter />      // Bottom navigation mit Zurück/Weiter/Speichern

// Step Components
<StepVehicleBasics />      // Schritt 1: Fahrzeugdaten
<StepTechnicalDetails />   // Schritt 2: Technische Details
<StepEquipment />          // Schritt 3: Ausstattung
<StepAvailability />       // Schritt 4: Verfügbarkeit
<StepFinancing />          // Schritt 5: Finanzierung
<StepContact />            // Schritt 6: Ansprechpartner
<StepMarketing />          // Schritt 7: Marketing
```

### Date Picker Integration
**Neue Date Picker Komponente für Datums-Auswahl:**

```tsx
import { DatePicker } from '@/components/base/date-picker/date-picker'

<DatePicker 
  value={date}
  onChange={(newDate) => setDate(newDate)}
  placeholder="Datum auswählen"
/>
```

### Skeleton Loading States
**Skeleton Komponenten für Loading States:**

```tsx
import { Skeleton } from '@/components/base/skeleton/skeleton'

// Text Skeleton
<Skeleton className="h-4 w-full" />

// Card Skeleton  
<Skeleton className="h-32 w-full rounded-lg" />

// Custom Shapes
<Skeleton variant="circular" className="h-12 w-12" />
```

### Auto-Analysis Hook
**Custom Hook für KI-gestützte Feld-Analyse:**

```tsx
import { useAutoAnalysis } from '@/hooks/useAutoAnalysis'

const { 
  isAnalyzing, 
  analysisResults,
  runAnalysis 
} = useAutoAnalysis(extractedData)

// Trigger Analysis
await runAnalysis(currentStep)
```

**Best Practices:**
- Zeige Analysis-Status prominent an
- Disable Form während Analyse läuft
- Zeige Confidence-Scores für analysierte Felder
- Erlaube manuelle Überschreibung