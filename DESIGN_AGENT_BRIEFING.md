# DESIGN_AGENT_BRIEFING.md

## 🎯 Purpose
This document defines when and how the `design-compliance-checker` agent must be used during development to ensure all UI/UX implementations adhere to the CARVITRA design standards.

---

## 🚨 MANDATORY TRIGGER EVENTS

The design-compliance-checker MUST be automatically invoked when:

### 1. **UI Component Changes**
- ✅ Adding new UI components to any file
- ✅ Removing existing UI components
- ✅ Modifying component props or structure
- ✅ Changing component imports

### 2. **File Pattern Triggers**
Automatically check when modifying files matching:
- `src/components/**/*.tsx`
- `src/components/**/*.ts`
- `src/app/**/*.tsx`
- `src/styles/**/*.css`

### 3. **Keyword Triggers in Changes**
When code changes include:
- Component imports from `@/components/`
- Icon imports from `@untitledui/icons`
- Style classes (`className`, `style`)
- Theme-related changes
- Form elements (`Input`, `Button`, `Select`, etc.)

### 4. **Post-Implementation Checks**
- ✅ After completing any user story involving UI
- ✅ Before marking any UI-related todo as completed
- ✅ After refactoring existing UI code

---

## 📋 DESIGN COMPLIANCE CHECKLIST

The agent must verify:

### **1. Untitled UI Component Policy**
```typescript
// ✅ CORRECT - Using Untitled UI components
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";

// ❌ WRONG - Custom components
const CustomButton = () => <button>...</button>;
```

### **2. Icon System**
```typescript
// ✅ CORRECT - Only @untitledui/icons
import { UserPlus01, AlertCircle } from "@untitledui/icons";

// ❌ WRONG - Other icon libraries or custom SVGs
import { FaUser } from "react-icons/fa";
```

### **3. Button Implementation**

#### **Props Usage**
```typescript
// ✅ CORRECT - Using 'color' prop
<Button color="primary">Primary Button</Button>
<Button color="secondary">Secondary Button</Button>
<Button color="tertiary">Tertiary Button</Button>

// ❌ WRONG - Using 'variant' prop (existiert nicht!)
<Button variant="secondary">Button</Button>
```

#### **Icon-Only Buttons**
```typescript
// ✅ CORRECT - Icon als iconLeading, kein children
<Button color="secondary" iconLeading={Eye} />
<Button color="secondary" iconLeading={Trash02} />

// ❌ WRONG - Icon als children mit 'iconOnly' prop
<Button variant="secondary" iconOnly><Eye /></Button>
<Button iconOnly={true}><Trash02 /></Button>
```

#### **Icon Positioning mit Text**
```typescript
// ✅ CORRECT - Icons as props
<Button iconLeading={UserPlus01}>Anmelden</Button>
<Button iconTrailing={ArrowRight}>Weiter</Button>

// ❌ WRONG - Icons as children
<Button><UserPlus01 />Anmelden</Button>
```

#### **Invalid Props to Avoid**
```typescript
// ❌ Diese Props existieren NICHT in Untitled UI Button:
- variant (use 'color' instead)
- iconOnly (use iconLeading/iconTrailing without children)
- destructive (use color="primary-destructive" or "secondary-destructive")
```

### **4. Theme System**
```typescript
// ✅ CORRECT - Semantic colors that adapt to theme
<div className="bg-primary text-secondary">
<div className="bg-secondary border-border">
<div className="bg-brand-primary text-brand-700">

// ❌ WRONG - Hardcoded colors that don't adapt
<div className="bg-gray-50 text-blue-600">
<div className="bg-gray-100 border-gray-200">
<div style={{ backgroundColor: "#000" }}>
```

⚠️ **KRITISCH**: NIEMALS hartcodierte Farben verwenden wie:
- `bg-gray-50`, `bg-gray-100`, `text-gray-600` etc.
- `bg-blue-500`, `text-red-600`, `border-green-400` etc.
- Inline styles mit Hex/RGB Werten

✅ **IMMER semantische Klassen verwenden**:
- `bg-primary`, `bg-secondary`, `bg-tertiary`
- `text-primary`, `text-secondary`, `text-tertiary`
- `border-border`, `border-primary`, `border-secondary`
- `bg-brand-primary`, `text-brand-600`, etc.

### **5. Component Structure**
- No duplicate/fork of Untitled UI components
- Props-based customization only
- Wrapper pattern when needed, not replacement

---

## 🔄 AUTOMATED WORKFLOW

### **Step 1: Detection**
Claude Code monitors for trigger events during development

### **Step 2: Auto-Invocation**
```typescript
// Pseudo-code for automatic invocation
if (fileChanged.matches(UI_FILE_PATTERNS) || 
    codeChanges.includes(UI_KEYWORDS)) {
  await Task.invoke({
    subagent_type: "design-compliance-checker",
    description: "Verify UI changes compliance",
    prompt: generateComplianceCheckPrompt(changes)
  });
}
```

### **Step 3: Compliance Report**
Agent provides:
- ✅ Compliant aspects
- ⚠️ Warnings for potential issues
- ❌ Violations requiring fixes
- 📊 Compliance score

### **Step 4: Action Items**
- **If 100% compliant**: Proceed with implementation
- **If warnings**: Review and adjust if needed
- **If violations**: MUST fix before proceeding

---

## 🎨 CARVITRA DESIGN STANDARDS

### **Core Principles**
1. **Consistency**: All UI elements from Untitled UI
2. **Theming**: Dark/Light mode via Untitled UI system
3. **Responsiveness**: Mobile-first approach
4. **Accessibility**: WCAG 2.1 AA compliance

### **Component Hierarchy**
```
src/components/
├── base/          # Untitled UI base components (DO NOT MODIFY)
├── application/   # App-specific compositions
├── marketing/     # Marketing page components
└── foundations/   # Icons, logos (from Untitled UI only)
```

### **Forbidden Practices**
- ❌ Creating custom UI components from scratch
- ❌ Using non-Untitled UI component libraries
- ❌ **HARDCODING COLORS** (z.B. `bg-gray-50`, `text-blue-600`)
  - Verwende IMMER semantische Klassen (`bg-primary`, `text-secondary`)
  - ALLE Farben müssen auf Theme-Wechsel reagieren
  - KEINE direkten Tailwind-Farben ohne semantische Bedeutung
- ❌ Hardcoding dimensions (außer wenn wirklich notwendig)
- ❌ Modifying base Untitled UI components
- ❌ Using custom SVG icons
- ❌ Inline styles (except for dynamic values)

---

## 🚀 IMPLEMENTATION GUIDELINES

### **For Claude Code**
When performing ANY frontend development:

1. **Before Implementation**
   - Review this briefing
   - Check existing patterns in codebase
   - Plan component usage

2. **During Implementation**
   - Use only Untitled UI components
   - Follow naming conventions
   - Apply semantic classes

3. **After Implementation**
   - Run design-compliance-checker
   - Address any violations
   - Document any exceptions

### **Automatic Trigger Example**
```typescript
// When this code is written:
import { useState } from "react";
import { Button } from "@/components/base/buttons/button";

export const NewFeature = () => {
  return (
    <div className="flex gap-4">
      <Button>Click me</Button>
    </div>
  );
};

// Claude Code should automatically:
// 1. Detect UI component usage
// 2. Invoke design-compliance-checker
// 3. Verify Button usage is correct
// 4. Check className usage
// 5. Provide compliance report
```

---

## 📊 COMPLIANCE METRICS

Track and report:
- **Component Coverage**: % of UI from Untitled UI
- **Theme Coverage**: % using semantic colors
- **Icon Compliance**: % from @untitledui/icons
- **Pattern Conformity**: % following established patterns

---

## 🔍 SPECIFIC CHECKS FOR COMMON COMPONENTS

### **Forms**
- ✅ Label + Input pairing
- ✅ Error states below fields
- ✅ Helper text formatting
- ✅ Validation feedback

### **Navigation**
- ✅ Header from marketing components
- ✅ Consistent link styling
- ✅ Mobile responsiveness

### **Modals/Dialogs**
- ✅ Using Untitled UI Dialog
- ✅ Proper backdrop handling
- ✅ Keyboard navigation

### **Tables/Lists**
- ✅ Using Untitled UI Table
- ✅ Proper pagination
- ✅ Sorting indicators

---

## 🛠️ EXCEPTION HANDLING

If a custom component is absolutely necessary:
1. Document the reason in this file
2. Get explicit user approval
3. Wrap in a clearly marked container
4. Add TODO for future migration

---

## ⚡ COMPONENT INTEGRATION PATTERNS

### **Event Handler Compatibility**
Stelle sicher, dass Event Handler den Untitled UI Konventionen folgen:

#### **Input Components**
```typescript
// ✅ CORRECT - Untitled UI Input übergibt Wert direkt
<Input onChange={(value: string) => setState(value)} />

// ❌ WRONG - Event-basiertes Pattern
<Input onChange={(e) => setState(e.target.value)} />
```

#### **Checkbox Components**
```typescript
// ✅ CORRECT - React-Aria Checkbox übergibt boolean
<Checkbox onChange={(checked: boolean) => setState(checked)} />

// ❌ WRONG - Event-basiertes Pattern
<Checkbox onChange={(e) => setState(e.target.checked)} />
```

#### **Custom Wrapper Components**
Wenn du Untitled UI Komponenten wrapst, **behalte die gleiche onChange Signatur**:
```typescript
// ✅ CORRECT
const CustomInput = ({ onChange, ...props }) => {
  return <Input onChange={onChange} {...props} />;
};

// ❌ WRONG - Signatur-Änderung
const CustomInput = ({ onChange, ...props }) => {
  return <Input onChange={(value) => onChange({ target: { value }})} {...props} />;
};
```

### **Common Integration Errors to Check**
- ⚠️ `event.target.value` Zugriffe bei Untitled UI Komponenten
- ⚠️ Inkonsistente onChange Handler zwischen Wrapper und Base-Komponenten
- ⚠️ Fehlende TypeScript-Typen für Event Handler
- ⚠️ Mischung von kontrollierten und unkontrollierten Komponenten
- 🚨 **HARTCODIERTE FARBEN** (z.B. `bg-gray-50`, `text-blue-600`)
  - Prüfe ALLE className Attribute auf nicht-semantische Farben
  - Stelle sicher, dass nur Theme-kompatible Klassen verwendet werden
  - Identifiziere und melde ALLE hartcodierten Farbwerte

---

## 🧠 SELBSTLERN-MECHANISMUS

### **Automatische Dokumentations-Erweiterung**

Wenn der Agent während seiner Prüfung **neue Pattern, Fehler oder Best Practices** identifiziert, die noch nicht dokumentiert sind:

1. **Erkenne neue Patterns**
   - Wiederkehrende Fehler, die nicht in der Checkliste sind
   - Neue Untitled UI Component-Pattern
   - Unbekannte Icon-Mappings
   - Neue Integration-Herausforderungen

2. **Dokumentiere automatisch**
   ```typescript
   // Wenn neues Pattern erkannt:
   if (isNewPattern && isRelevantForFuture) {
     // Füge zur entsprechenden Sektion hinzu:
     - Component Integration Patterns
     - Common Integration Errors
     - Icon-Mappings
     - Forbidden Practices
   }
   ```

3. **Update diese Datei**
   - Erweitere relevante Sektionen
   - Füge neue Code-Beispiele hinzu
   - Aktualisiere Revision History
   - **WICHTIG**: Änderungen müssen die Datei kompakt halten

### **Beispiel für Auto-Learning**
```typescript
// Neuer Fehler entdeckt:
"SelectField onChange übergibt {value, label} statt nur value"

// Automatisch hinzufügen zu Component Integration Patterns:
#### **Select Components**
// ✅ CORRECT - Untitled UI Select übergibt Objekt
<Select onChange={({value}) => setState(value)} />
```

---

## 📝 REVISION HISTORY

- **2025-01-18**: Initial briefing created
- **2025-01-18**: Added automatic trigger events and workflows
- **2025-01-18**: Enhanced with specific code examples and patterns
- **2025-01-18**: Added Component Integration Patterns section for Event Handler compatibility
- **2025-01-18**: Added Self-Learning mechanism for automatic documentation updates
- **2025-01-18**: **KRITISCH**: Verschärfte Regeln gegen hartcodierte Farben - ALLE Farben müssen semantisch und Theme-kompatibel sein
- **2025-01-20**: **WICHTIG**: Erweiterte Button Implementation Guidelines - korrekter Einsatz von 'color' statt 'variant', Icon-Only Buttons mit iconLeading, keine ungültigen Props

---

*This document ensures consistent, high-quality UI implementation across the CARVITRA platform and learns from new patterns automatically.*