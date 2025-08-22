# 🤖 KI-Wizard Development Agent Briefing

## 🎯 Mission Statement

Du bist der spezialisierte Agent für die Entwicklung und Wartung aller KI-Funktionalitäten im CARVITRA Landing Page Wizard. Deine Hauptaufgabe ist es, konsistente, performante und skalierbare AI-Features zu entwickeln, die dem etablierten Multi-Agent-Pattern folgen.

---

## 🏗️ Architektur-Philosophie

### **Multi-Agent Pattern (KRITISCH!)**

**Grundprinzip:** Viele spezialisierte Agenten > Ein großer General-Purpose Agent

```typescript
// ✅ RICHTIG: Spezialisierte Agenten
- field-resolution-agent.ts    // Nur für Feld-Auflösung
- enrichment-agent.ts          // Nur für Daten-Anreicherung
- validation-agent.ts          // Nur für Validierung

// ❌ FALSCH: Ein Agent für alles
- universal-wizard-agent.ts    // NIEMALS!
```

**Warum Multi-Agent?**
1. **Bessere Performance** - Parallele Ausführung möglich
2. **Einfacheres Debugging** - Klare Verantwortlichkeiten
3. **Höhere Genauigkeit** - Spezialisierte Prompts pro Aufgabe
4. **Skalierbarkeit** - Neue Features = Neue Agenten

### **Streaming-First Architecture**

```typescript
// IMMER SSE-Streaming für progressive Updates
const stream = new ReadableStream({
  async start(controller) {
    // Sequenzielle Verarbeitung für echtes Streaming
    for (const field of fields) {
      const result = await processField(field)
      // SOFORT streamen, nicht sammeln!
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`))
    }
  }
})
```

**NIEMALS Promise.all() vor Streaming!** Das würde das Streaming zunichte machen.

---

## 💻 Technische Implementierung

### **1. KI-Model Configuration**

```typescript
// AKTUELLES MODELL (Stand: Januar 2025)
const MODEL = 'claude-sonnet-4-20250514'  // ✅ KORREKT

// DEPRECATED - NICHT VERWENDEN!
// 'claude-3-5-sonnet-20241022'  // ❌ Veraltet
// 'claude-3-5-sonnet-20241205'  // ❌ Existiert nicht
```

### **2. Field Resolution Pattern**

Der etablierte Pattern für KI-gestützte Feld-Befüllung:

```typescript
// 1. Context aufbauen (Prioritäten beachten!)
const buildFieldPrompt = (field, context) => {
  // Priority 1: Enriched data (Perplexity)
  // Priority 2: Extracted data (PDF)
  // Priority 3: Raw text (Fallback)
  
  // Spezielle Hints pro Feld-Typ
  if (fieldName === 'vehicle_type') {
    contextHint = 'Wähle Karosserie-Typ (SUV, Limousine, Kombi...)'
  }
  
  return prompt
}

// 2. Streaming Response
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 50,        // Klein für schnelle Antworten
  temperature: 0.2,      // Niedrig für Konsistenz
  messages: [{ role: 'user', content: prompt }]
})

// 3. Progressive UI Updates
setFieldLoadingStates(prev => ({
  ...prev,
  [fieldId]: false
}))
updateFormData({ [fieldId]: value }, true)  // true = AI-filled
```

### **3. State Management für AI-Fields**

**KRITISCH: Functional Updates verwenden!**

```typescript
// ✅ RICHTIG - Functional Update Pattern
const updateFormData = useCallback((data, isAiFilled = false) => {
  setFormData(prev => ({ ...prev, ...data }))
  if (isAiFilled) {
    setAiFilledFields(prev => {  // FUNCTIONAL UPDATE!
      const newSet = new Set(prev)
      Object.keys(data).forEach(key => newSet.add(key))
      return newSet
    })
  }
}, [])  // KEINE Dependencies!

// ❌ FALSCH - Direct State Access
const updateFormData = useCallback((data, isAiFilled) => {
  const newAiFields = new Set(aiFilledFields)  // CLOSURE PROBLEM!
}, [aiFilledFields])  // Re-creates on every update
```

### **4. useEffect Pattern für KI-Resolution**

```typescript
// ✅ RICHTIG - Getrennte useEffects
useEffect(() => {
  loadSelectOptions()  // Einmal beim Mount
}, [])

useEffect(() => {
  // Dependencies auf .length für Arrays!
  if (options.length > 0 && hasData) {
    startKiResolution()
  }
}, [options.length, hasData])  // Nicht das Array selbst!

// ❌ FALSCH - Closure Problem
useEffect(() => {
  while (options.length === 0) {  // options ist Closure!
    // Wird nie true, da Closure nicht updated
  }
}, [])
```

---

## 🎯 Step-by-Step Implementation Guide

### **Neuen Wizard-Step mit KI erstellen:**

#### **Step 1: Komponenten-Struktur**

```typescript
// src/components/application/landing-page-wizard/steps/step-[name].tsx

export function Step[Name]() {
  // 1. Context und State
  const { formData, updateFormData, extractedData, pdfDocumentId, aiFilledFields } = useWizardContext()
  
  // 2. Loading States pro Feld
  const [fieldLoadingStates, setFieldLoadingStates] = useState<Record<string, boolean>>({})
  
  // 3. Select Options (wenn benötigt)
  const [options, setOptions] = useState<any[]>([])
  
  // 4. Supabase Client
  const supabase = createClient()
  
  return (
    <div className="space-y-6">
      {/* Skeleton Loader während KI-Analyse */}
      {fieldLoadingStates.fieldName ? (
        <SkeletonInput label="Feldname" />
      ) : (
        <div>
          <Label>Feldname</Label>
          <Input value={formData.fieldName} onChange={...} />
          {/* AI-Filled Indicator */}
          {aiFilledFields.has('fieldName') && (
            <div className="mt-1 text-xs text-green-600">
              ✓ Automatisch vorausgefüllt
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

#### **Step 2: KI-Resolution hinzufügen**

```typescript
const callAgentForFields = async () => {
  // 1. Felder identifizieren die gefüllt werden sollen
  const fieldsToResolve = [
    { fieldName: 'field1', fieldType: 'enum', enumOptions: [...] },
    { fieldName: 'field2', fieldType: 'text' }
  ].filter(f => !formData[f.fieldName])  // Nur leere Felder
  
  // 2. Loading States setzen
  const loadingStates = {}
  fieldsToResolve.forEach(f => loadingStates[f.fieldName] = true)
  setFieldLoadingStates(loadingStates)
  
  // 3. Batch API Call mit Streaming
  const response = await fetch('/api/wizard/batch-resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: fieldsToResolve,
      context: { extractedData, enrichedData: extractedData?.enriched_data }
    })
  })
  
  // 4. Stream Processing
  const reader = response.body?.getReader()
  // ... (siehe Streaming Pattern oben)
}
```

#### **Step 3: Auto-Trigger bei Daten**

```typescript
useEffect(() => {
  if (extractedData && pdfDocumentId && !stepAnalysisCompleted[stepNumber]) {
    callAgentForFields()
  }
}, [extractedData?.id, pdfDocumentId])
```

---

## 🐛 Häufige Fehler & Lösungen

### **Problem 1: Race Condition in useEffect**

```typescript
// ❌ PROBLEM
useEffect(() => {
  while (vehicleTypes.length === 0) {  // Closure!
    await sleep(100)
  }
  callAgent()
}, [])

// ✅ LÖSUNG
useEffect(() => {
  if (vehicleTypes.length > 0) {
    callAgent()
  }
}, [vehicleTypes.length])  // Dependency auf .length!
```

### **Problem 2: AI-Filled Markers verschwinden**

```typescript
// ❌ PROBLEM
setAiFilledFields(new Set([...aiFilledFields, key]))  // Direct access

// ✅ LÖSUNG
setAiFilledFields(prev => {
  const newSet = new Set(prev)
  newSet.add(key)
  return newSet
})
```

### **Problem 3: Streaming funktioniert nicht**

```typescript
// ❌ PROBLEM
const results = await Promise.all(fields.map(processField))
results.forEach(r => controller.enqueue(r))  // Alles am Ende!

// ✅ LÖSUNG
for (const field of fields) {
  const result = await processField(field)
  controller.enqueue(result)  // Sofort streamen!
}
```

---

## 📊 Performance-Optimierungen

### **1. Parallele Initialisierung**

```typescript
// Alles parallel starten was möglich ist
await Promise.all([
  loadSelectOptions(),
  loadSmartSuggestions(),
  callAgentForFields()
])
```

### **2. Caching von KI-Responses**

```typescript
// In-Memory Cache für Session
const aiResponseCache = new Map()

const getCachedOrResolve = async (field) => {
  const cacheKey = `${field.name}_${extractedData.id}`
  if (aiResponseCache.has(cacheKey)) {
    return aiResponseCache.get(cacheKey)
  }
  
  const result = await resolveField(field)
  aiResponseCache.set(cacheKey, result)
  return result
}
```

### **3. Debouncing von Updates**

```typescript
const debouncedSave = useMemo(
  () => debounce(saveProgress, 30000),  // 30 Sekunden
  []
)
```

---

## 🧪 Testing & Debugging

### **Console Logging Pattern**

```typescript
// Strukturiertes Logging mit Emojis für bessere Lesbarkeit
console.log('🚀 Starting AI field resolution...')
console.log('   Fields to resolve:', fieldsCount)
console.log('   Has context:', !!context)

// Erfolg
console.log('✅ Field resolved:', fieldName, value)

// Fehler
console.error('❌ Resolution failed:', error)

// Warnung
console.warn('⚠️ No match found for value:', value)

// Info
console.log('ℹ️ Using fallback strategy')
```

### **Playwright Testing**

```typescript
// Test-Flow für Wizard
1. Navigate to wizard
2. Check console for initialization logs
3. Wait for field loading (Skeleton visible)
4. Verify fields are filled
5. Check for AI-filled indicators
6. Test persistence on step navigation
```

---

## 🚀 Roadmap & Erweiterungen

### **Phase 1: Basis-Wizard (DONE ✅)**
- Step 1: Fahrzeugdaten mit KI
- Streaming Implementation
- AI-Field Tracking

### **Phase 2: Alle Steps (IN PROGRESS)**
- Step 2: Technische Details
- Step 3: Ausstattung (Multi-Select)
- Step 4: Verfügbarkeit
- Step 5: Finanzierung (Nested Objects)
- Step 6: Ansprechpartner
- Step 7: Marketing (Long-Form Text)

### **Phase 3: Advanced Features**
- **Confidence Scoring** - Zeige Konfidenz-Level pro Feld
- **Alternative Suggestions** - Mehrere Optionen zur Auswahl
- **Learning Loop** - User-Korrekturen für Training nutzen
- **Batch-Edit Mode** - Mehrere Felder gleichzeitig korrigieren

### **Phase 4: Performance & Scale**
- **Edge Functions** - KI-Calls über Supabase Edge
- **Response Caching** - Redis/Supabase Cache
- **Queue System** - Für High-Volume Processing
- **Monitoring** - Sentry für Error Tracking

---

## 🔧 Utility Functions & Helpers

### **Field Mapping Helper**

```typescript
// Mappe KI-Response auf DB-IDs
const mapToId = (value: string, lookupTable: any[]) => {
  return lookupTable.find(item => 
    item.name.toLowerCase() === value.toLowerCase()
  )?.id || null
}
```

### **Extraction Priority Helper**

```typescript
const getFieldValue = (fieldName: string, context: any) => {
  // Priority Chain
  return context.enrichedData?.[fieldName] ||
         context.extractedData?.vehicle?.[fieldName] ||
         context.extractedData?.technical?.[fieldName] ||
         context.rawText ? extractFromRawText(fieldName, context.rawText) : null
}
```

### **Validation Helper**

```typescript
const validateAiResponse = (value: string, constraints: any) => {
  if (constraints.enum && !constraints.enum.includes(value)) {
    console.warn(`⚠️ AI returned invalid enum value: ${value}`)
    return findClosestMatch(value, constraints.enum)
  }
  return value
}
```

---

## 📝 Code Standards & Conventions

### **Naming Conventions**
```typescript
// Agenten: [purpose]-agent.ts
field-resolution-agent.ts
enrichment-agent.ts

// API Routes: /api/wizard/[action]/route.ts
/api/wizard/batch-resolve/route.ts
/api/wizard/validate/route.ts

// Components: Step[Name].tsx
StepVehicleBasics.tsx
StepTechnicalDetails.tsx
```

### **Type Safety**
```typescript
// IMMER Types definieren
interface FieldResolutionRequest {
  fields: Array<{
    fieldName: string
    fieldType: 'enum' | 'text' | 'number' | 'boolean'
    enumOptions?: string[]
  }>
  context: {
    extractedData: ExtractedData
    enrichedData?: EnrichedData
  }
}
```

### **Error Boundaries**
```typescript
// Jeder Step sollte Error Boundary haben
try {
  await callAgentForFields()
} catch (error) {
  console.error('❌ AI Resolution failed:', error)
  // Fallback: Manuelles Ausfüllen
  setFieldLoadingStates({})  // Clear all loading
}
```

---

## 🎓 Wichtige Learnings aus der Entwicklung

### **1. Pattern Matching ist tot - Lang lebe die KI!**
Wir haben uns bewusst GEGEN Pattern Matching und FÜR pure KI-Entscheidungen entschieden:
- Keine Datenbank-Lookups für ähnliche Fahrzeuge
- Keine hartcodierten Regeln
- Immer KI fragen, auch bei Unsicherheit
- "Falsche Information > Keine Information"

### **2. Claude Model Evolution**
- Claude 3.5 Sonnet ist deprecated
- Claude Sonnet 4 ist das aktuelle Modell
- IMMER in Anthropic Docs die aktuellen Models prüfen

### **3. Streaming ist King**
- User wollen sofortiges Feedback
- Progressive Updates > Batch Updates
- SSE funktioniert besser als WebSockets für unseren Use Case

### **4. State Management Patterns**
- Functional Updates verhindern Stale Closures
- Dependencies in useEffect müssen präzise sein
- Set-Operations für AI-Field Tracking

---

## 🆘 Troubleshooting Guide

### **Felder werden nicht gefüllt**
1. Check: Sind extractedData vorhanden?
2. Check: Werden die API Calls gemacht? (Network Tab)
3. Check: Kommen SSE Events an? (Console)
4. Check: Matching der Enum-Werte korrekt?

### **Performance Probleme**
1. Sind API Calls parallel wo möglich?
2. Wird gestreamt oder gebatcht?
3. Cache implementiert?
4. Debouncing aktiv?

### **UI-State Probleme**
1. Functional Updates verwendet?
2. Dependencies korrekt?
3. Loading States richtig gesetzt/cleared?

---

## 📞 Kontakt & Support

Bei Fragen zur Wizard-Entwicklung:
1. Dieses Briefing konsultieren
2. Git History für Context checken
3. Test-PDFs in `/test-pdfs/` verwenden
4. Console Logs ausführlich nutzen

---

*Letzte Aktualisierung: Januar 2025*
*Version: 1.0.0*
*Maintainer: KI-Wizard Development Team*