# DATABASE INTEGRITY BRIEFING - CARVITRA V2

Last Updated: 2025-08-20
Status: ✅ PRODUCTION READY (nach Fixes)

## 🏗️ CURRENT DATABASE STRUCTURE

### Overview
- **Total Tables**: 30+
- **Main Business Tables**: 6 (offer, dealers, sales_persons, credit_offers, offer_equipment, pdf_documents)
- **Dictionary Tables**: 11 (makes, vehicle_categories, fuel_types, etc.)
- **Auth/System Tables**: 4 (organizations, users, invitations, pdf_documents)

### 🎯 Core Architecture Pattern
**Hybrid PDF-First Approach**: 
1. PDFs uploaded → Full text stored in `pdf_documents.extracted_data.raw_text`
2. On-demand extraction via AI when creating landing pages
3. Structured data stored in `offer` table (45+ fields)
4. No re-parsing of PDFs needed after initial upload

## 📊 COMPLETE DATA MODEL

### Main Tables

#### 1. `offer` (Primary Vehicle Offer Table)
- **Purpose**: Stores comprehensive vehicle offer data
- **Fields**: 45+ fields including:
  - Basic: make, model, trim, year, mileage
  - Technical: power_ps, power_kw, fuel_type, transmission
  - Pricing: list_price_gross, list_price_net
  - Environmental: co2_emissions, emission_class, battery_capacity
  - Availability: first_registration, availability_date, owner_count
  - Relations: organization_id, pdf_document_id, dealer_id, sales_person_id
- **Status**: ✅ ACTIVE (replaced old `offers` table)

#### 2. `pdf_documents`
- **Purpose**: Stores uploaded PDFs and extracted text
- **Key Fields**:
  - `file_url`: Supabase storage URL
  - `extracted_text`: Raw OCR text
  - `extracted_data`: JSONB with structured data + raw_text
  - `processing_status`: uploaded/extracting/ready/failed
- **Integration**: PDF.co for OCR, Claude for AI extraction

#### 3. `dealers`
- **Purpose**: Store dealer/vendor information
- **Fields**: company_name, address, city, postal_code, phone, email
- **Relations**: organization_id (multi-tenant)

#### 4. `sales_persons`
- **Purpose**: Contact persons for offers
- **Fields**: name, email, phone, position
- **Relations**: dealer_id, organization_id

#### 5. `credit_offers`
- **Purpose**: Multiple financing options per vehicle
- **Fields**: 30+ fields for detailed financing
  - Rates: financial_rate_gross/net, closing_rate_gross/net
  - Terms: runtime, annual_mileage, down_payment
  - Costs: delivery_cost, registration_cost
  - Leasing: leasing_factor, more_kilometer_cost
- **Relations**: offer_id (multiple per offer)

#### 6. `offer_equipment`
- **Purpose**: N:M relation for vehicle equipment
- **Fields**: offer_id, equipment_id, is_standard, price_gross/net
- **Type**: Junction table

### Dictionary Tables (Lookup/Reference)

All dictionary tables follow the pattern:
- `id`: UUID primary key
- `name`: Unique text value
- `created_at`: Timestamp

1. **makes** - Vehicle manufacturers (25 entries: BMW, Mercedes-Benz, Audi, etc.)
2. **vehicle_categories** - Vehicle types (14 entries: Limousine, SUV, Kombi, etc.)
3. **vehicle_types** - Specific types (related to categories)
4. **fuel_types** - Fuel options (9 entries: Benzin, Diesel, Elektro, Hybrid, etc.)
5. **transmission_types** - Gearbox types (7 entries: Manuell, Automatik, DSG, etc.)
6. **offer_types** - Offer categories (8 entries: Neuwagen, Gebrauchtwagen, etc.)
7. **availability_types** - Stock status (7 entries: Sofort verfügbar, Bestellfahrzeug, etc.)
8. **equipment_categories** - Equipment groups (9 entries: Sicherheit, Komfort, etc.)
9. **equipment** - Specific equipment items (linked to categories)
10. **credit_offer_types** - Financing types (6 entries: Leasing, Finanzierung, etc.)
11. **credit_institutions** - Banks/lenders

## 🔒 SECURITY STATUS

### Row Level Security (RLS)
**Status**: ✅ ALL TABLES PROTECTED

#### Dictionary Tables (Read-Only for All)
- All 11 dictionary tables have SELECT policies for authenticated users
- No write access (managed by admins only)

#### Business Tables (Organization-Based)
- `offer`, `dealers`, `sales_persons`: Full CRUD with organization check
- `credit_offers`, `offer_equipment`: Access via offer ownership
- `pdf_documents`: Organization-based access

### RLS Implementation Pattern
```sql
-- Dictionary tables: Read for all
CREATE POLICY "read_[table]" ON public.[table] 
  FOR SELECT TO authenticated USING (true);

-- Business tables: Organization-based
CREATE POLICY "[action]_[table]" ON public.[table]
  FOR [ACTION] TO authenticated 
  USING/WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM auth.users WHERE id = auth.uid()
    )
  );
```

## 🚀 PERFORMANCE OPTIMIZATIONS

### Indexes Created
1. **Primary Keys**: All tables have UUID primary keys (automatically indexed)
2. **Foreign Keys**: All FK columns indexed for JOIN performance
3. **Lookup Indexes**: Name columns on all dictionary tables
4. **Business Indexes**:
   - `offer`: organization_id, pdf_document_id, created_at DESC
   - `dealers`: organization_id
   - `credit_offers`: offer_id
   - `offer_equipment`: offer_id, equipment_id

### Missing But Recommended Indexes
- `offer.status` (when column is added)
- `offer.availability_type_id`
- Composite: `offer(organization_id, status)`
- Full-text search on offer details

## 🔄 MIGRATION HISTORY

### Completed Migrations
1. `create_dictionary_tables` - All lookup tables
2. `create_offer_and_related_tables` - Main business tables
3. `create_credit_and_equipment_tables` - Financial and equipment relations
4. `remove_old_offers_table` - Cleaned up duplicate table
5. `add_missing_rls_policies` - Security policies for all tables
6. `add_performance_indexes` - Query optimization

### Data Seeding Status
- ✅ Makes (25 manufacturers)
- ✅ Vehicle Categories (14 types)
- ✅ Fuel Types (9 options)
- ✅ Transmission Types (7 options)
- ✅ Offer Types (8 categories)
- ✅ Availability Types (7 statuses)
- ✅ Equipment Categories (9 groups)
- ✅ Credit Offer Types (6 options)

## 🐛 KNOWN ISSUES & FIXES APPLIED

### Fixed Issues
1. **Duplicate Tables**: `offers` vs `offer` → Removed old `offers` table
2. **Missing RLS**: 13 tables unprotected → All policies added
3. **Empty Dictionaries**: No lookup data → All seeded
4. **Missing Indexes**: Poor query performance → Core indexes added

### Pending Improvements
1. Add `status` column to `offer` table
2. Add `is_primary` to `credit_offers`
3. Create composite indexes for common queries
4. Add cascade delete rules for cleaner data management
5. Implement soft deletes with `deleted_at` columns

## 📋 INTEGRITY CHECKLIST

### Critical Checks ✅
- [x] No duplicate tables
- [x] All tables have RLS enabled
- [x] All tables have appropriate policies
- [x] Dictionary data is seeded
- [x] Foreign key constraints are valid
- [x] Primary indexes exist

### Data Flow Validation ✅
- [x] PDF upload → `pdf_documents` table
- [x] Text extraction → `extracted_data.raw_text`
- [x] AI processing → `extracted_data.ai_extracted`
- [x] Offer creation → `offer` table
- [x] Equipment linking → `offer_equipment`
- [x] Financing → `credit_offers`

## 🎯 BEST PRACTICES

### For New Tables
1. Always enable RLS immediately
2. Add organization_id for multi-tenancy
3. Include created_at, updated_at timestamps
4. Create indexes on foreign keys
5. Document purpose in table comments

### For Migrations
1. Test in development first
2. Include rollback strategy
3. Check for dependent objects (CASCADE)
4. Verify RLS policies after creation
5. Seed required data

### For Dictionary Tables
1. Use UNIQUE constraint on name
2. Keep them simple (id, name, created_at)
3. Provide read-only access
4. Pre-seed with common values
5. Plan for admin UI to manage

## 🤖 PDF-EXTRACTION WORKFLOW (Implementiert Jan 2025)

### Hybrid Text-First Approach
```mermaid
PDF Upload → PDF.co OCR → Store raw_text → Claude AI Extract → On-Demand Fields
```

### Extracted Data Structure
```javascript
pdf_documents.extracted_data = {
  raw_text: string,        // Vollständiger OCR-Text (600-2000 chars)
  ai_extracted: {          // Strukturierte Felder
    vehicle: {...},        // make, model, year, etc.
    dealer: {...},        // name, address, contact
    leasing: {...},       // rates, duration, terms
    metadata: {
      confidence_score: 95,
      tokens_used: 1501,
      extraction_time_ms: 6538
    }
  },
  page_count: 1,
  extraction_metadata: {...}
}
```

### Field Extraction Service Pattern
```typescript
// On-Demand Extraction für Landing Pages
FieldExtractorService.extractForLandingpage(rawText)
  → ExtractedFields mit vehicle, technical, pricing, dealer

// Progressive Enhancement
FieldExtractorService.extractMissingFields(rawText, existing, required)
  → Nur fehlende Felder nachladen

// Single Field Extraction
FieldExtractorService.extractSingleField(rawText, "listPrice")
  → Einzelwert für spezifisches Feld
```

### Performance Metrics (Production)
- **OCR Zeit**: ~2-4 Sekunden (PDF.co)
- **KI-Extraktion**: ~6.5 Sekunden (Claude 3.5 Sonnet)
- **Token-Verbrauch**: ~1500 Tokens pro PDF
- **Confidence Score**: 90-95% für strukturierte PDFs
- **Datengröße**: 2-3 KB JSON pro PDF

## 🔐 SECURITY NOTES

### Multi-Tenancy Pattern
All business data is isolated by `organization_id`:
- Users belong to one organization
- All queries filter by user's organization
- No cross-organization data leakage

### Auth Flow
1. User authenticates → auth.users
2. User has organization_id → auth.users.organization_id
3. RLS policies check → auth.uid() → organization_id
4. Data filtered automatically

## 📈 MONITORING RECOMMENDATIONS

### Key Metrics to Track
1. Table sizes (especially `offer` and `pdf_documents`)
2. Index usage statistics
3. Slow query log
4. RLS policy execution time
5. Failed extraction rates

### Regular Maintenance
1. VACUUM ANALYZE weekly
2. Check unused indexes monthly
3. Review slow queries weekly
4. Audit RLS policies quarterly
5. Clean old PDF data annually

## 🚦 DEPLOYMENT READINESS

### Production Checklist
- ✅ All tables created
- ✅ RLS enabled and configured
- ✅ Indexes optimized
- ✅ Dictionary data seeded
- ✅ Foreign keys validated
- ✅ No security vulnerabilities

### Status: READY FOR PRODUCTION ✅

The database is now properly structured, secured, and optimized for the CARVITRA application. The hybrid PDF-first approach with on-demand extraction provides flexibility while maintaining data integrity.

---

*This briefing should be updated whenever structural changes are made to the database.*