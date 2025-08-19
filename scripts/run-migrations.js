const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase-Konfiguration aus Umgebungsvariablen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kigcdrahcvyddxrkaeog.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY ist nicht gesetzt!');
  console.log('Bitte setzen Sie die Umgebungsvariable oder verwenden Sie das Supabase Dashboard.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  console.log('🚀 Starte Supabase-Migrationen...\n');

  try {
    // Lese Migration-Dateien
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_pdf_documents_and_landingpages.sql');
    const storagePath = path.join(__dirname, '..', 'supabase', 'setup-storage.sql');

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    const storageSQL = fs.readFileSync(storagePath, 'utf8');

    console.log('📄 Migration 1: Tabellen und Schema...');
    
    // Split SQL statements und führe sie einzeln aus
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        // Für CREATE TABLE und ALTER TABLE Statements
        if (statement.includes('CREATE TABLE') || 
            statement.includes('ALTER TABLE') || 
            statement.includes('CREATE INDEX') ||
            statement.includes('CREATE POLICY') ||
            statement.includes('CREATE FUNCTION') ||
            statement.includes('CREATE TRIGGER') ||
            statement.includes('INSERT INTO')) {
          
          console.log(`   Führe aus: ${statement.substring(0, 50)}...`);
          
          // Wir können leider keine direkte SQL-Ausführung über die Client-Library machen
          // Stattdessen müssen wir die Tabellen über das Dashboard erstellen
          console.log('   ⚠️  Bitte über Supabase Dashboard ausführen');
        }
      } catch (error) {
        console.error(`   ❌ Fehler: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n📦 Migration 2: Storage-Buckets...');
    
    // Storage Buckets können wir über die API erstellen
    try {
      // PDF-Documents Bucket
      const { data: pdfBucket, error: pdfError } = await supabase.storage.createBucket('pdf-documents', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf']
      });

      if (pdfError && !pdfError.message.includes('already exists')) {
        throw pdfError;
      }
      console.log('   ✅ PDF-Documents Bucket erstellt/vorhanden');

      // Vehicle-Images Bucket
      const { data: imageBucket, error: imageError } = await supabase.storage.createBucket('vehicle-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      });

      if (imageError && !imageError.message.includes('already exists')) {
        throw imageError;
      }
      console.log('   ✅ Vehicle-Images Bucket erstellt/vorhanden');

    } catch (error) {
      console.error(`   ❌ Storage-Fehler: ${error.message}`);
    }

    console.log('\n✨ Migration abgeschlossen!');
    console.log('\n⚠️  WICHTIG: Bitte führen Sie die SQL-Migrationen manuell im Supabase Dashboard aus:');
    console.log('1. Gehen Sie zu: https://supabase.com/dashboard/project/kigcdrahcvyddxrkaeog/sql');
    console.log('2. Kopieren Sie den Inhalt von: supabase/migrations/001_pdf_documents_and_landingpages.sql');
    console.log('3. Fügen Sie ihn im SQL Editor ein und klicken Sie auf "Run"');
    console.log('4. Wiederholen Sie dies für: supabase/setup-storage.sql');

  } catch (error) {
    console.error('❌ Fehler bei der Migration:', error);
    process.exit(1);
  }
}

// Führe Migrationen aus
runMigrations();