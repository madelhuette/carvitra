import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PDFCoService } from '@/lib/services/pdf-co-service'
import { AIExtractionService } from '@/lib/services/ai-extraction'
import { PerplexityEnrichmentService } from '@/services/perplexity-enrichment.service'
import { pdfExtractSchema } from '@/lib/validation/schemas'
import { createLogger } from '@/lib/logger'

const logger = createLogger('API:PDF:Extract')

export async function POST(request: NextRequest) {
  logger.info('Starting extraction process')
  
  try {
    const supabase = await createClient()
    
    // Auth check mit besserem Logging
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      logger.error('Auth error', authError)
      return NextResponse.json({ error: 'Authentication failed', details: authError.message }, { status: 401 })
    }
    
    if (!user) {
      logger.error('No user found in session')
      return NextResponse.json({ error: 'Unauthorized - No user session' }, { status: 401 })
    }
    
    logger.debug('User authenticated', { userId: user.id })
    
    // Validate request body with Zod
    const body = await request.json()
    const validation = pdfExtractSchema.safeParse(body)
    
    if (!validation.success) {
      logger.warn('Invalid request body', { errors: validation.error.errors })
      return NextResponse.json({ 
        error: 'Invalid request', 
        details: validation.error.errors 
      }, { status: 400 })
    }
    
    const { pdf_document_id } = validation.data
    
    logger.info('Processing document', { documentId: pdf_document_id })
    
    // Get PDF document
    const { data: pdfDoc, error: fetchError } = await supabase
      .from('pdf_documents')
      .select('*')
      .eq('id', pdf_document_id)
      .single()
    
    if (fetchError) {
      logger.error('Database fetch error', fetchError)
      return NextResponse.json({ error: 'Database error', details: fetchError.message }, { status: 500 })
    }
    
    if (!pdfDoc) {
      logger.warn('Document not found', { documentId: pdf_document_id })
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    logger.debug('Document found', { fileName: pdfDoc.file_name })
    
    // Update status to extracting
    await supabase
      .from('pdf_documents')
      .update({ processing_status: 'extracting' })
      .eq('id', pdf_document_id)
    
    try {
      // Extract text using PDF.co API
      logger.info('Using PDF.co to extract text', { 
        urlPrefix: pdfDoc.file_url?.substring(0, 50) + '...' 
      })
      
      const extractionResult = await PDFCoService.extractTextFromPDF(pdfDoc.file_url, {
        lang: 'deu', // German language for OCR
        timeout: 60000 // 60 seconds timeout
      })
      
      if (extractionResult.error) {
        logger.error('PDF.co extraction error', { error: extractionResult.error })
        throw new Error(extractionResult.error)
      }
      
      logger.info('Text extracted successfully', {
        pages: extractionResult.pageCount,
        textLength: extractionResult.text.length
      })
      
      // Create pdfData object compatible with existing code
      const pdfData = {
        text: extractionResult.text,
        numpages: extractionResult.pageCount,
        info: {} // PDF.co doesn't provide metadata
      }
      
      // KI-basierte Extraktion mit Claude Sonnet
      console.log('[PDF Extract] Starting AI extraction with Claude Sonnet...')
      const startTime = Date.now()
      
      // Periodisches Status-Update in der Datenbank
      const statusUpdateInterval = setInterval(async () => {
        await supabase
          .from('pdf_documents')
          .update({ 
            processing_status: 'extracting',
            updated_at: new Date().toISOString()
          })
          .eq('id', pdf_document_id)
      }, 5000) // Alle 5 Sekunden updaten
      
      try {
        const aiExtractedData = await AIExtractionService.extractVehicleData(pdfData.text, {
          timeout: 30000, // 30 Sekunden Timeout
          maxRetries: 2,
          maxTokens: 2000
        })
        
        clearInterval(statusUpdateInterval)
        const extractionTime = Date.now() - startTime
        console.log('[PDF Extract] AI extraction completed in', extractionTime, 'ms')
      
        // Validierung der extrahierten Daten
        const validation = AIExtractionService.validateExtractedData(aiExtractedData)
        if (validation.warnings.length > 0) {
          console.log('[PDF Extract] Validation warnings:', validation.warnings)
        }
        console.log('[PDF Extract] Confidence score:', aiExtractedData.metadata.confidence_score)
      
        // Cache-Eintrag für extraction_cache Tabelle erstellen
        const cacheEntry = {
          pdf_document_id,
          extracted_data: aiExtractedData,
          confidence_score: aiExtractedData.metadata.confidence_score,
          processing_time_ms: extractionTime,
          tokens_used: aiExtractedData.metadata.tokens_used || 0,
          model_used: aiExtractedData.metadata.model_used,
          validation_warnings: validation.warnings,
          validation_errors: validation.errors,
        }
      
        // In extraction_cache speichern
        const { error: cacheError } = await supabase
          .from('extraction_cache')
          .insert(cacheEntry)
        
        if (cacheError) {
          console.error('Cache-Fehler:', cacheError)
          // Nicht kritisch, Extraktion kann trotzdem fortgesetzt werden
        }
      
        // Extract structured data (Legacy + AI Combined)
        const extractedData = {
          raw_text: pdfData.text,
          page_count: pdfData.numpages,
          info: pdfData.info,
          
          // KI-extrahierte Daten (Hauptquelle)
          ai_extracted: aiExtractedData,
          
          // Legacy-Extraktion als Fallback
          legacy: {
            vehicle: extractBasicVehicleInfo(pdfData.text),
            pricing: extractBasicPricing(pdfData.text),
            technical: extractBasicTechnical(pdfData.text)
          },
          
          // Metadaten
          extraction_metadata: {
            confidence_score: aiExtractedData.metadata.confidence_score,
            validation: validation,
            extraction_method: 'claude-sonnet',
            tokens_used: aiExtractedData.metadata.tokens_used || 0,
            extraction_time_ms: extractionTime,
            error: (aiExtractedData.metadata as any).error
          }
        }
      
        // Update document with extracted data
        // Status basierend auf Confidence Score und Validierung setzen
        let processingStatus = 'ready'
        if (aiExtractedData.metadata.confidence_score < 30) {
          processingStatus = 'needs_review'
        } else if (validation.errors && validation.errors.length > 0) {
          processingStatus = 'needs_review'
        } else if (validation.warnings && validation.warnings.length > 3) {
          processingStatus = 'needs_review'
        }
        
        const { error: updateError } = await supabase
          .from('pdf_documents')
          .update({
            extracted_text: pdfData.text,
            extracted_data: extractedData,
            page_count: pdfData.numpages,
            processing_status: processingStatus
          })
          .eq('id', pdf_document_id)
        
        if (updateError) {
          throw updateError
        }
        
        console.log('[PDF Extract] Document updated successfully with status:', processingStatus)
        
        // Perplexity Enrichment durchführen
        console.log('[PDF Extract] Starting Perplexity enrichment...')
        try {
          const enrichmentService = new PerplexityEnrichmentService(supabase)
          
          // Extrahiere Fahrzeugdaten aus AI-Extraktion für Enrichment
          const vehicleData = {
            make: aiExtractedData.vehicle?.make,
            model: aiExtractedData.vehicle?.model,
            variant: aiExtractedData.vehicle?.variant,
            year: aiExtractedData.vehicle?.year || aiExtractedData.vehicle?.first_registration_year,
            mileage: aiExtractedData.vehicle?.mileage,
            fuel_type: aiExtractedData.technical?.fuel_type,
            transmission: aiExtractedData.technical?.transmission,
            body_type: aiExtractedData.vehicle?.body_type
          }
          
          // Nur enrichen wenn wir genug Basisdaten haben
          if (vehicleData.make && vehicleData.model) {
            const enrichmentResult = await enrichmentService.enrichVehicleData(
              pdf_document_id,
              vehicleData,
              pdfData.text
            )
            
            console.log('[PDF Extract] Enrichment completed successfully')
            console.log('[PDF Extract] Enriched fields:', Object.keys(enrichmentResult.enriched_data).length)
            
            // Füge Enrichment-Info zur Response hinzu
            return NextResponse.json({
              success: true,
              extracted_data: extractedData,
              ai_data: aiExtractedData,
              enrichment_data: enrichmentResult.enriched_data,
              confidence_score: aiExtractedData.metadata.confidence_score,
              validation: validation,
              tokens_used: aiExtractedData.metadata.tokens_used || 0,
              extraction_time: extractionTime,
              enrichment_completed: true,
              message: validation.warnings.length > 0 
                ? `Extraktion und Enrichment erfolgreich mit ${validation.warnings.length} Warnungen` 
                : 'Extraktion und Enrichment erfolgreich abgeschlossen'
            })
          } else {
            console.log('[PDF Extract] Skipping enrichment - insufficient vehicle data')
          }
        } catch (enrichmentError) {
          // Enrichment-Fehler sind nicht kritisch
          console.error('[PDF Extract] Enrichment failed (non-critical):', enrichmentError)
        }
        
        return NextResponse.json({
          success: true,
          extracted_data: extractedData,
          ai_data: aiExtractedData,
          confidence_score: aiExtractedData.metadata.confidence_score,
          validation: validation,
          tokens_used: aiExtractedData.metadata.tokens_used || 0,
          extraction_time: extractionTime,
          enrichment_completed: false,
          message: validation.warnings.length > 0 
            ? `Extraktion erfolgreich mit ${validation.warnings.length} Warnungen` 
            : 'Extraktion erfolgreich abgeschlossen'
        })
        
      } catch (aiError: any) {
        clearInterval(statusUpdateInterval)
        throw aiError
      }
      
    } catch (extractError: any) {
      // Update status to failed
      console.error('[PDF Extract] Extraction error details:', extractError)
      console.error('[PDF Extract] Error stack:', extractError.stack)
      
      const errorMessage = extractError.message || String(extractError)
      
      await supabase
        .from('pdf_documents')
        .update({
          processing_status: 'failed',
          processing_error: errorMessage
        })
        .eq('id', pdf_document_id)
      
      throw extractError
    }
    
  } catch (error: any) {
    console.error('[PDF Extract] Final error handler:', error)
    console.error('[PDF Extract] Error type:', error.constructor.name)
    console.error('[PDF Extract] Error message:', error.message)
    
    return NextResponse.json(
      { 
        error: 'Failed to extract PDF content',
        details: error.message || 'Unknown error',
        type: error.constructor.name
      },
      { status: 500 }
    )
  }
}

// Basic extraction functions (will be replaced with AI later)
function extractBasicVehicleInfo(text: string) {
  const patterns = {
    make: /(?:Marke|Hersteller)[:\s]+([A-Za-z]+)/i,
    model: /(?:Modell|Typ)[:\s]+([A-Za-z0-9\s]+)/i,
    year: /(?:Baujahr|Jahr|EZ)[:\s]+(\d{4})/i,
    mileage: /(?:Kilometer|KM|Laufleistung)[:\s]+(\d+\.?\d*)/i,
  }
  
  const result: any = {}
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern)
    if (match) {
      result[key] = key === 'mileage' || key === 'year' 
        ? parseInt(match[1].replace(/\./g, ''))
        : match[1].trim()
    }
  }
  
  return result
}

function extractBasicPricing(text: string) {
  const patterns = {
    monthly_rate: /(?:Monatsrate|mtl\.|monatlich)[:\s]+(\d+[.,]?\d*)/i,
    purchase_price: /(?:Kaufpreis|Preis|Barpreis)[:\s]+(\d+\.?\d*)/i,
    down_payment: /(?:Anzahlung|Sonderzahlung)[:\s]+(\d+[.,]?\d*)/i,
  }
  
  const result: any = {}
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern)
    if (match) {
      result[key] = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
    }
  }
  
  return result
}

function extractBasicTechnical(text: string) {
  const patterns = {
    fuel_type: /(?:Kraftstoff|Antrieb)[:\s]+([A-Za-z]+)/i,
    transmission: /(?:Getriebe|Schaltung)[:\s]+([A-Za-z]+)/i,
    power_kw: /(\d+)\s*kW/i,
    power_ps: /(\d+)\s*PS/i,
  }
  
  const result: any = {}
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern)
    if (match) {
      result[key] = key.includes('power') 
        ? parseInt(match[1])
        : match[1].trim()
    }
  }
  
  return result
}