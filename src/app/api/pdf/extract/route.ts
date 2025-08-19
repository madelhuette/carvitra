import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as pdfParse from 'pdf-parse'

export async function POST(request: NextRequest) {
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
    
    // Get PDF document
    const { data: pdfDoc, error: fetchError } = await supabase
      .from('pdf_documents')
      .select('*')
      .eq('id', pdf_document_id)
      .single()
    
    if (fetchError || !pdfDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    // Update status to extracting
    await supabase
      .from('pdf_documents')
      .update({ processing_status: 'extracting' })
      .eq('id', pdf_document_id)
    
    try {
      // Fetch PDF from URL
      const response = await fetch(pdfDoc.file_url)
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Parse PDF
      const pdfData = await pdfParse(buffer)
      
      // Extract structured data
      const extractedData = {
        raw_text: pdfData.text,
        page_count: pdfData.numpages,
        info: pdfData.info,
        
        // Basic extraction patterns (will be enhanced with AI later)
        vehicle: extractBasicVehicleInfo(pdfData.text),
        pricing: extractBasicPricing(pdfData.text),
        technical: extractBasicTechnical(pdfData.text)
      }
      
      // Update document with extracted data
      const { error: updateError } = await supabase
        .from('pdf_documents')
        .update({
          extracted_text: pdfData.text,
          extracted_data: extractedData,
          page_count: pdfData.numpages,
          processing_status: 'ready'
        })
        .eq('id', pdf_document_id)
      
      if (updateError) {
        throw updateError
      }
      
      return NextResponse.json({
        success: true,
        extracted_data: extractedData
      })
      
    } catch (extractError) {
      // Update status to failed
      await supabase
        .from('pdf_documents')
        .update({
          processing_status: 'failed',
          processing_error: String(extractError)
        })
        .eq('id', pdf_document_id)
      
      throw extractError
    }
    
  } catch (error) {
    console.error('PDF extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to extract PDF content' },
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