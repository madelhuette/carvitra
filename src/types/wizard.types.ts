export interface WizardStep {
  id: number
  label: string
  description: string
  completed: boolean
  current: boolean
}

export interface OfferWizardData {
  // Step 1: Fahrzeugdaten
  make_id?: string
  model?: string
  trim?: string
  vehicle_type_id?: string
  vehicle_category_id?: string
  
  // Step 2: Technische Details
  power_ps?: number
  power_kw?: number
  displacement?: number
  cylinder_count?: number
  transmission_type_id?: string
  fuel_type_id?: string
  fuel_consumption_fossil?: number
  fuel_consumption_electric?: number
  co2_emissions?: number
  emission_class?: string
  battery_capacity_gross?: number
  battery_capacity_usable?: number
  
  // Step 3: Ausstattung & Farben
  exterior_color?: string
  interior_color?: string
  interior_material?: string
  door_count?: number
  seat_count?: number
  equipment?: string[]
  custom_equipment?: string[]
  special_equipment?: string
  
  // Step 4: Verfügbarkeit & Preise
  availability_type_id?: string
  availability_date?: string
  list_price_gross?: number
  list_price_net?: number
  first_registration?: string
  mileage_count?: number
  owner_count?: number
  general_inspection_date?: string
  accident_free?: boolean
  
  // Step 5: Finanzierung
  financing_available?: boolean
  credit_offers?: CreditOfferData[]
  
  // Step 6: Ansprechpartner
  sales_person_id?: string
  
  // Step 7: Marketing & Veröffentlichung
  seo_title?: string
  seo_description?: string
  marketing_headline?: string
  marketing_description?: string
  slug?: string
}

export interface CreditOfferData {
  id?: string
  institution_name?: string
  credit_type?: string
  duration_months?: number
  down_payment?: number
  monthly_rate?: number
  final_rate?: number
  total_amount?: number
  interest_rate?: number
  km_per_year?: number
  terms?: any
}

export interface AnalysisResult {
  fieldsIdentified: number
  confidence: number
  timestamp: Date
}

export interface WizardContextType {
  currentStep: number
  steps: WizardStep[]
  formData: OfferWizardData
  offerId?: string
  pdfDocumentId?: string
  extractedData?: any
  isLoading: boolean
  isSaving: boolean
  isAnalyzing: boolean
  analysisResults: AnalysisResult | null
  stepAnalysisCompleted: Record<number, boolean>
  goToStep: (step: number) => void
  goNext: () => void
  goPrevious: () => void
  updateFormData: (data: Partial<OfferWizardData>) => void
  saveProgress: () => Promise<void>
  autoFillWithAI: (step: number) => Promise<void>
  setAnalysisState: (analyzing: boolean, results?: AnalysisResult | null) => void
}