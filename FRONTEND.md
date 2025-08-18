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