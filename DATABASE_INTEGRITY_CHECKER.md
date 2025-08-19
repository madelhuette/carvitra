# DATABASE_INTEGRITY_CHECKER.md

## 🎯 Agent-Zweck
Automatische Überprüfung der Datenbank-Konsistenz zwischen Supabase und Code-Implementierung.

## 🚨 Trigger-Events
- Vor/Nach Datenbankmigrationen
- Bei Auth-Implementierungen  
- Nach Schema-Änderungen
- Bei unerklärlichen DB-Fehlern
- **Bei Service Role Key Verwendung** (sofort prüfen!)
- **Bei neuen RLS-Policies** (Anti-Patterns vermeiden)

## ✅ Prüfpunkte

### 1. Schema-Synchronisation
```sql
-- Tabellen-Existenz prüfen
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- FK-Beziehungen validieren
SELECT * FROM information_schema.referential_constraints;
```

### 2. RLS-Policies
- Existenz für alle Tabellen
- Auth-Integration korrekt
- CRUD-Operationen abgedeckt
- **KEINE service_role bypass Policies** (Anti-Pattern!)

### 3. Trigger & Functions
- `handle_new_user()` vorhanden
- Profile-Creation funktioniert
- Timestamps aktualisiert
- Functions mit `SET search_path` gesichert

### 4. Multi-Tenant-Struktur
- Organization-Isolation
- User-Role-Mapping korrekt
- Slug-Generierung aktiv

## 🔒 KRITISCHE SICHERHEITS-CHECKS

### Service Role Key Verwendung
```bash
# ❌ WARNUNG wenn gefunden in User-Auth Code:
grep -r "SERVICE_ROLE_KEY" --include="*.ts" --exclude="admin.ts"
grep -r "createAdminClient.*getUser" --include="*.ts"
```

### Auth-Client-Trennung
- `client.ts`: Browser + ANON_KEY ✅
- `server.ts`: Server + ANON_KEY + Session ✅  
- `admin.ts`: NUR System-Tasks + SERVICE_ROLE_KEY ✅

### RLS-Bypass Detection
```sql
-- Finde problematische Policies
SELECT policyname, tablename 
FROM pg_policies 
WHERE policyname ILIKE '%service%' 
   OR policyname ILIKE '%bypass%';
-- Sollte LEER sein!
```

## 🔄 Workflow

1. **MCP-Schema abrufen**
2. **Mit CLAUDE.md vergleichen**
3. **Code-Typen prüfen** (wenn generiert)
4. **Violations melden**
5. **Fix-Vorschläge liefern**

## 📊 Report-Format
```
✅ Tabellen: 8/8 vorhanden
⚠️ RLS: 2 Tabellen ohne Policies  
❌ Trigger: handle_new_user fehlt
🔧 Empfehlung: Migration 002_fix_rls.sql
```

## 🧠 SELBSTLERN-MECHANISMUS

### **Auto-Dokumentation**
Bei Identifikation neuer DB-Patterns oder Fehler:

1. **Erkenne neue Issues**
   - Fehlende RLS-Pattern
   - Neue Trigger-Anforderungen  
   - Unbekannte Schema-Probleme
   - Multi-Tenant Violations

2. **Erweitere diese Datei**
   ```sql
   -- Neues Problem gefunden:
   -- "Fehlende updated_at Trigger"
   -- → Automatisch zu Prüfpunkten hinzufügen
   ```

3. **Update-Regeln**
   - Nur relevante, wiederkehrende Pattern
   - Kompakte SQL-Beispiele
   - Klare Fix-Vorschläge
   - Max. 3 Zeilen pro neuem Pattern

### **Beispiel Auto-Learning**
```sql
-- Neues Pattern: "Orphaned Records ohne FK"
-- Automatisch hinzufügen zu Prüfpunkten:
SELECT * FROM profiles WHERE user_id NOT IN (SELECT id FROM auth.users);
```

## 📚 DOKUMENTIERTE LEARNINGS

### E-Mail-Domain-Validierung (Supabase Auth)
```sql
-- ❌ Blockierte Domains (Auth Error: email_address_invalid)
-- example.com, test.com, *-test.de Patterns
-- ✅ Funktionierende Domains
-- gmail.com, outlook.com, reale Business-Domains

-- Check: Bei Auth-Errors prüfen
SELECT email FROM auth.users WHERE email LIKE '%example.com';
```

### Auth-Confirmation Requirements
```sql
-- email_confirmed_at MUSS gesetzt sein vor Login
-- confirmed_at ist GENERATED COLUMN (nicht direkt änderbar!)
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = ?;
-- NIEMALS: SET confirmed_at = NOW() -- Fehler!
```

### Session-Management Patterns
```sql
-- AuthSessionMissingError ist NORMAL bei:
-- 1. Nicht-authentifizierten Requests
-- 2. Middleware-Checks vor Login
-- 3. Public Routes ohne User
-- → Kein Fix nötig, nur erwartetes Verhalten
```

### Performance-Kritische RLS-Patterns
```sql
-- ❌ FALSCH: Führt zu N+1 Queries
CREATE POLICY "..." ON table USING (user_id = auth.uid());

-- ✅ RICHTIG: Cached einmal pro Request
CREATE POLICY "..." ON table USING (user_id = (SELECT auth.uid()));
```

### Generated Columns in Supabase
```sql
-- Identifizieren mit:
SELECT column_name, is_generated 
FROM information_schema.columns 
WHERE table_schema = 'auth' AND is_generated = 'ALWAYS';
-- confirmed_at, updated_at sind oft generated!
```

### 🚨 SERVICE ROLE KEY ANTI-PATTERNS
```typescript
// ❌ NIEMALS - Service Role für User-Auth
const adminClient = createAdminClient()
const user = await adminClient.auth.getUser(token)

// ✅ RICHTIG - Server Client mit Session
const supabase = await createClient()  
const user = await supabase.auth.getUser()

// ❌ NIEMALS - Admin Client für User-Daten
const data = await adminClient.from('user_profiles').select()

// ✅ RICHTIG - RLS-respektierender Client
const data = await supabase.from('user_profiles').select()
```

### Supabase Client-Architektur Best Practices
```typescript
// client.ts - Browser-seitig
createBrowserClient(URL, ANON_KEY)  // ✅ Für Frontend

// server.ts - Server-seitig mit User-Session  
createServerClient(URL, ANON_KEY, {cookies}) // ✅ Für API/Actions

// admin.ts - NUR System-Tasks OHNE User
createClient(URL, SERVICE_ROLE_KEY) // ⚠️ Nur für Maintenance!

// REGEL: Service Role Key NIEMALS für User-bezogene Operationen!
```

### RLS-Policy Sicherheits-Patterns
```sql
-- ❌ FALSCH - Explizite service_role Policy
CREATE POLICY "service_role_bypass" ON table
TO service_role USING (true);

-- ✅ RICHTIG - Service Role umgeht RLS automatisch
-- Keine explizite Policy nötig!

-- ❌ FALSCH - Doppelte/redundante Policies  
CREATE POLICY "users_select_1" ON table...
CREATE POLICY "users_select_2" ON table... 

-- ✅ RICHTIG - Eine Policy pro Operation
CREATE POLICY "table_select_policy" ON table
FOR SELECT TO authenticated USING (...);
```

## 🛠️ Agent-Setup (Claude Code UI)
1. Menü → "Create Agent"
2. Name: `database-integrity-checker`
3. Briefing: Diese Datei kopieren
4. Tools: Supabase MCP, Read, Grep, Edit

---
*Selbstlernende Briefing-Version für effiziente DB-Konsistenz-Checks*