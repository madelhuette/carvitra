import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadToStorage, deleteFromStorage, createSignedUrl } from '@/lib/supabase/admin'
import { v4 as uuidv4 } from 'uuid'

/**
 * Sicherer PDF-Upload Endpoint
 * 
 * Sicherheitsmaßnahmen:
 * - Magic Bytes Verification für PDFs
 * - Strikte MIME-Type Prüfung
 * - Größenlimit (10MB)
 * - Multi-Tenant Isolation durch organization_id Pfade
 * - Dual-Client Architektur (Anon für DB, Admin für Storage)
 */
export async function POST(request: NextRequest) {
  try {
    // Verwende den normalen Server-Client für Auth und DB-Operationen (mit RLS)
    const supabase = await createClient()
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user's organization mit RLS
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single()
    
    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }
    
    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Strikte MIME-Type Validierung
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        error: 'Invalid file type. Only PDF files (application/pdf) are allowed' 
      }, { status: 400 })
    }
    
    // Max file size: 10MB
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB' 
      }, { status: 400 })
    }
    
    // Convert file to buffer für Magic Bytes Check
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Magic Bytes Verification für PDF
    const pdfMagicBytes = buffer.slice(0, 5).toString('ascii')
    if (pdfMagicBytes !== '%PDF-') {
      return NextResponse.json({ 
        error: 'Invalid PDF file. File does not contain valid PDF magic bytes' 
      }, { status: 400 })
    }
    
    // Generate unique filename mit sicherer Extension
    const fileName = `${uuidv4()}.pdf`
    const filePath = `${profile.organization_id}/${fileName}`
    
    // Upload zu Storage mit Admin Client (da Bucket jetzt privat ist)
    try {
      await uploadToStorage('pdf-documents', filePath, buffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      })
    } catch (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload file to storage' 
      }, { status: 500 })
    }
    
    // Generiere signierte URL für privaten Zugriff (1 Jahr gültig)
    let signedUrl: string
    try {
      signedUrl = await createSignedUrl('pdf-documents', filePath, 365 * 24 * 60 * 60)
    } catch (urlError) {
      // Cleanup bei Fehler
      await deleteFromStorage('pdf-documents', [filePath])
      console.error('Signed URL error:', urlError)
      return NextResponse.json({ 
        error: 'Failed to generate access URL' 
      }, { status: 500 })
    }
    
    // Create database record mit RLS-geschütztem Client
    const { data: pdfDocument, error: dbError } = await supabase
      .from('pdf_documents')
      .insert({
        organization_id: profile.organization_id,
        file_url: signedUrl,
        file_name: file.name,
        file_size_bytes: file.size,
        processing_status: 'uploaded'
      })
      .select()
      .single()
    
    if (dbError) {
      // Clean up uploaded file if database insert fails
      await deleteFromStorage('pdf-documents', [filePath])
      console.error('Database error:', dbError)
      return NextResponse.json({ 
        error: 'Failed to save document record' 
      }, { status: 500 })
    }
    
    // Audit Log Entry (optional, aber empfohlen)
    await supabase
      .from('storage_audit_log')
      .insert({
        user_id: user.id,
        organization_id: profile.organization_id,
        bucket_id: 'pdf-documents',
        file_path: filePath,
        action: 'upload',
        file_size_bytes: file.size,
        user_agent: request.headers.get('user-agent')
      })
      .select()
      .single()
      .catch(err => console.log('Audit log error (non-critical):', err))
    
    // Trigger extraction process (async)
    // Use absolute URL or relative path
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`
    fetch(`${baseUrl}/api/pdf/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      },
      body: JSON.stringify({ pdf_document_id: pdfDocument.id })
    }).catch(err => console.error('Failed to trigger extraction:', err))
    
    return NextResponse.json({
      success: true,
      document: pdfDocument
    })
    
  } catch (error) {
    console.error('PDF upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}