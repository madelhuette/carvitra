import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user's organization
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
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
    
    // Validate file type
    if (!file.type.includes('pdf')) {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }
    
    // Max file size: 10MB
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB' }, { status: 400 })
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `${profile.organization_id}/${fileName}`
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('pdf-documents')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('pdf-documents')
      .getPublicUrl(filePath)
    
    // Create database record
    const { data: pdfDocument, error: dbError } = await supabase
      .from('pdf_documents')
      .insert({
        organization_id: profile.organization_id,
        file_url: publicUrl,
        file_name: file.name,
        file_size_bytes: file.size,
        processing_status: 'uploaded'
      })
      .select()
      .single()
    
    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('pdf-documents').remove([filePath])
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 })
    }
    
    // Trigger extraction process (async)
    // This will be handled by a separate background job
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/pdf/extract`, {
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