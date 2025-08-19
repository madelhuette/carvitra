export interface PdfDocument {
  id: string
  organization_id: string
  file_url: string
  file_name: string
  file_size_bytes?: number
  extracted_text?: string
  extracted_data?: ExtractedData
  processing_status: 'uploaded' | 'extracting' | 'ready' | 'failed'
  processing_error?: string
  page_count?: number
  created_at: string
  updated_at: string
}

export interface ExtractedData {
  // Fahrzeugdaten
  vehicle?: {
    make?: string
    model?: string
    variant?: string
    year?: number
    mileage?: number
    first_registration?: string
    vin?: string
  }
  
  // Technische Daten
  technical?: {
    fuel_type?: string
    transmission?: string
    power_kw?: number
    power_ps?: number
    engine_size?: number
    doors?: number
    seats?: number
    color_exterior?: string
    color_interior?: string
  }
  
  // Preisdaten
  pricing?: {
    purchase_price?: number
    monthly_rate?: number
    down_payment?: number
    final_rate?: number
    duration_months?: number
    km_per_year?: number
    interest_rate?: number
  }
  
  // Ausstattung
  equipment?: string[]
  
  // Zusätzliche Informationen
  dealer?: {
    name?: string
    address?: string
    phone?: string
    email?: string
    contact_person?: string
  }
  
  raw_text_sections?: {
    [key: string]: string
  }
}

export interface ExtractionCache {
  id: string
  pdf_document_id: string
  field_name: string
  extracted_value: any
  confidence_score?: number
  prompt_version?: string
  model_used?: string
  created_at: string
}

export interface ExtractionRequest {
  pdf_document_id: string
  fields: string[]
  force_refresh?: boolean
}

export interface ExtractionResponse {
  field_name: string
  value: any
  confidence: number
  cached: boolean
}