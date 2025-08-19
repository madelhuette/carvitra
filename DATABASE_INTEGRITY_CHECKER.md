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

## 🚀 ERWEITERTE RLS BEST PRACTICES (State-of-the-Art)

### Performance-Optimierung für RLS Policies

#### 1. **Index-Strategie für RLS**
```sql
-- PFLICHT: B-Tree Index auf alle RLS-genutzten Spalten
CREATE INDEX idx_user_id ON table_name USING btree (user_id);
CREATE INDEX idx_team_id ON table_name USING btree (team_id);
CREATE INDEX idx_org_id ON table_name USING btree (organization_id);

-- Composite Index für Multi-Column Policies
CREATE INDEX idx_user_team ON table_name (user_id, team_id);
```

#### 2. **Subquery-Wrapping für Funktionen**
```sql
-- ❌ FALSCH: auth.uid() wird pro Zeile ausgeführt
CREATE POLICY "bad" ON table 
USING (auth.uid() = user_id OR is_admin());

-- ✅ RICHTIG: Funktionen in SELECT wrappen für Caching
CREATE POLICY "good" ON table 
USING ((SELECT auth.uid()) = user_id OR (SELECT is_admin()));
```

#### 3. **TO-Klausel für Role-Targeting**
```sql
-- ❌ FALSCH: Policy wird für ALLE Rollen evaluiert
CREATE POLICY "policy" ON table
USING (auth.uid() = user_id);

-- ✅ RICHTIG: Nur für authenticated users
CREATE POLICY "policy" ON table
TO authenticated
USING ((SELECT auth.uid()) = user_id);
```

#### 4. **Security Definer Functions für komplexe Checks**
```sql
-- Für Join-Queries in RLS: Security Definer verwenden
CREATE OR REPLACE FUNCTION private.user_teams()
RETURNS int[] 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN array(
    SELECT team_id FROM team_user 
    WHERE user_id = auth.uid()
  );
END;
$$;

-- In RLS Policy verwenden
CREATE POLICY "team_access" ON table
TO authenticated
USING (team_id = ANY(SELECT private.user_teams()));
```

#### 5. **Client-Side Filtering zusätzlich zu RLS**
```javascript
// ❌ FALSCH: Nur auf RLS verlassen
const { data } = await supabase.from('table').select()

// ✅ RICHTIG: Explizite Filter für Performance
const { data } = await supabase
  .from('table')
  .select()
  .eq('user_id', userId) // Hilft Postgres beim Query Planning
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

## 🔄 MIGRATION & SCHEMA MANAGEMENT

### Migration Best Practices
```sql
-- 1. Schema-Diff vor Migration
supabase db diff --schema public

-- 2. Auth Schema Ownership Issues vermeiden
ALTER TABLE auth.users OWNER TO supabase_auth_admin;
ALTER FUNCTION auth.handle_new_user() OWNER TO supabase_auth_admin;

-- 3. Migration Testing lokal
supabase db reset
supabase test db

-- 4. Rollback-Strategie
supabase db reset --version <migration_timestamp>
```

### Schema Ownership Validation
```sql
-- Check für falsche Ownership (häufiger Fehler bei ORMs)
SELECT 
  n.nspname as schema,
  c.relname as object,
  pg_get_userbyid(c.relowner) as owner
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'auth' 
  AND pg_get_userbyid(c.relowner) != 'supabase_auth_admin';
```

## 🔐 AUTH-SPEZIFISCHE VALIDIERUNGEN

### MFA/AAL-Level Enforcement
```sql
-- Check für MFA-geschützte Tabellen
CREATE POLICY "mfa_required" ON sensitive_table
AS RESTRICTIVE
TO authenticated
USING ((SELECT auth.jwt()->>'aal') = 'aal2');

-- Conditional MFA basierend auf User-Faktoren
CREATE POLICY "conditional_mfa" ON table
AS RESTRICTIVE
TO authenticated
USING (
  array[auth.jwt()->>'aal'] <@ (
    SELECT CASE
      WHEN count(id) > 0 THEN array['aal2']
      ELSE array['aal1', 'aal2']
    END
    FROM auth.mfa_factors
    WHERE user_id = auth.uid() AND status = 'verified'
  )
);
```

### Auth Hook Permissions Check
```sql
-- Validiere Auth Hook Permissions
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook 
TO supabase_auth_admin;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook 
FROM authenticated, anon;
```

## 🧪 TESTING & CI/CD INTEGRATION

### pgTAP Test Suite für RLS
```sql
-- tests/database/rls_policies.test.sql
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(5);

-- Test 1: RLS ist auf allen public Tabellen aktiviert
SELECT tests.rls_enabled('public');

-- Test 2: Alle Policies haben TO-Klausel
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND roles = '{public}'
  ),
  'Keine Policies ohne explizite Rolle'
);

-- Test 3: Auth.uid() ist gewrappt in SELECT
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE qual LIKE '%auth.uid()%'
    AND qual NOT LIKE '%(select auth.uid())%'
  ),
  'auth.uid() ist in SELECT gewrappt'
);

SELECT * FROM finish();
ROLLBACK;
```

### GitHub Actions CI
```yaml
name: Database Integrity Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase start
      - run: supabase test db
      - run: supabase db lint --level error
```

## 🗄️ STORAGE & REALTIME SECURITY

### Storage RLS Patterns
```sql
-- Public Read, Authenticated Write
CREATE POLICY "public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'public');

CREATE POLICY "auth_write" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Index für Storage Performance
CREATE INDEX idx_storage_owner ON storage.objects(owner);
CREATE INDEX idx_storage_bucket ON storage.objects(bucket_id);
```

### Realtime Message Security
```sql
-- Topic-basierte Zugriffskontrolle
CREATE POLICY "realtime_room_access" 
ON realtime.messages
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM room_participants
    WHERE room_id = realtime.topic()
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  realtime.messages.extension IN ('broadcast', 'presence')
);
```

## 🏢 MULTI-TENANT BEST PRACTICES

### Organization-basierte Isolation
```sql
-- Sicherstellen dass alle Tabellen org_id haben
SELECT table_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND column_name = 'id'
  AND table_name NOT IN (
    SELECT table_name FROM information_schema.columns 
    WHERE column_name = 'organization_id'
  );

-- RLS für Multi-Tenancy
CREATE POLICY "org_isolation" ON table
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);
```

### SSO Provider Integration
```sql
-- Check SSO-basierte Policies
CREATE POLICY "sso_org_access" ON organization_settings
AS RESTRICTIVE
USING (
  sso_provider_id = (SELECT auth.jwt()#>>'{amr,0,provider}')
);
```

## 📊 PERFORMANCE MONITORING

### Query Plan Analysis
```sql
-- RLS Performance Testing
SET SESSION ROLE authenticated;
SET request.jwt.claims TO '{"sub":"user-uuid"}';

EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM large_table WHERE org_id = 1;

-- Index-Nutzung validieren
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0 -- Ungenutzte Indizes
ORDER BY schemaname, tablename;
```

### Connection Pool Monitoring
```sql
-- Aktive Connections prüfen
SELECT 
  state,
  COUNT(*),
  MAX(NOW() - state_change) as max_duration
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state;

-- Slow Queries identifizieren
SELECT 
  calls,
  mean_exec_time,
  query
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- ms
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## 🛠️ Agent-Setup (Claude Code UI)
1. Menü → "Create Agent"
2. Name: `database-integrity-checker`
3. Briefing: Diese Datei kopieren
4. Tools: Supabase MCP, Read, Grep, Edit

---
*Selbstlernende Briefing-Version für effiziente DB-Konsistenz-Checks mit State-of-the-Art Supabase Best Practices*