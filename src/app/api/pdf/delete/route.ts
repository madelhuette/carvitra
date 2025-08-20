import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteFromStorage } from '@/lib/supabase/admin'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { pdf_document_id } = await request.json()
    
    if (!pdf_document_id) {
      return NextResponse.json({ error: 'No document ID provided' }, { status: 400 })
    }
    
    // Get PDF document with organization check (RLS)
    const { data: pdfDoc, error: fetchError } = await supabase
      .from('pdf_documents')
      .select('*')
      .eq('id', pdf_document_id)
      .single()
    
    if (fetchError || !pdfDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    // Get user profile to determine organization
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()
    
    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }
    
    // Extract file path from URL
    // Expected format: https://...supabase.../storage/v1/object/sign/pdf-documents/{org_id}/{filename}.pdf?...
    const urlParts = pdfDoc.file_url.split('/pdf-documents/')
    if (urlParts.length < 2) {
      console.error('Could not parse file path from URL:', pdfDoc.file_url)
      return NextResponse.json({ error: 'Invalid file URL format' }, { status: 500 })
    }
    
    const filePathWithQuery = urlParts[1]
    const filePath = filePathWithQuery.split('?')[0] // Remove query parameters
    
    try {
      // Delete from database first (with RLS protection)
      const { error: dbDeleteError } = await supabase
        .from('pdf_documents')
        .delete()
        .eq('id', pdf_document_id)
      
      if (dbDeleteError) {
        throw new Error(`Database deletion failed: ${dbDeleteError.message}`)
      }
      
      // Delete related extraction cache entries
      const { error: cacheDeleteError } = await supabase
        .from('extraction_cache')
        .delete()
        .eq('pdf_document_id', pdf_document_id)
      
      if (cacheDeleteError) {
        console.log('Cache cleanup error (non-critical):', cacheDeleteError)
      }
      
      // Delete from storage
      await deleteFromStorage('pdf-documents', [filePath])
      
      // Audit log entry
      const { error: auditError } = await supabase
        .from('storage_audit_log')
        .insert({
          user_id: user.id,
          organization_id: profile.organization_id,
          bucket_id: 'pdf-documents',
          file_path: filePath,
          action: 'delete',
          file_size_bytes: pdfDoc.file_size_bytes,
          user_agent: request.headers.get('user-agent')
        })
        .select()
        .single()
      
      if (auditError) {
        console.log('Audit log error (non-critical):', auditError)
      }
      
      return NextResponse.json({
        success: true,
        message: 'Document deleted successfully'
      })
      
    } catch (deleteError) {
      console.error('Delete operation failed:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete document' 
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('PDF deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}