import { SupabaseClient } from '@supabase/supabase-js'

export interface FieldSuggestion {
  value: any
  confidence: number
  source: 'ai_extraction' | 'enrichment' | 'pattern_matching' | 'database_lookup' | 'user_input'
  reasoning?: string
}

export interface SmartFieldResult {
  field: string
  suggestions: FieldSuggestion[]
  recommended_value: any
  needs_user_review: boolean
}

export class SmartFieldService {
  private supabase: SupabaseClient
  private documentId: string | null = null
  private extractedData: any = null
  private enrichedData: any = null
  private vehicleCache: Map<string, any> = new Map()

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * Initialize the service with document data
   */
  async initialize(documentId: string) {
    this.documentId = documentId
    
    // Load document data including extracted and enriched data
    const { data: doc, error } = await this.supabase
      .from('pdf_documents')
      .select('extracted_data, enriched_data, vehicle_year')
      .eq('id', documentId)
      .single()
    
    if (error) {
      console.error('Failed to load document data:', error)
      throw error
    }
    
    this.extractedData = doc?.extracted_data
    this.enrichedData = doc?.enriched_data
    
    // Build cache key for similar vehicle lookup
    if (this.extractedData?.ai_extracted) {
      const ai = this.extractedData.ai_extracted
      const cacheKey = `${ai.vehicle?.make}_${ai.vehicle?.model}_${ai.vehicle?.year}`
      if (!this.vehicleCache.has(cacheKey)) {
        await this.loadSimilarVehicles(ai.vehicle)
      }
    }
  }

  /**
   * Get smart suggestion for a specific field
   */
  async getFieldSuggestion(fieldName: string, currentValue?: any): Promise<SmartFieldResult> {
    const suggestions: FieldSuggestion[] = []
    
    // 1. Check AI extraction data
    const aiValue = this.getValueFromAIExtraction(fieldName)
    if (aiValue !== undefined && aiValue !== null) {
      const confidence = this.getAIConfidence(fieldName)
      suggestions.push({
        value: aiValue,
        confidence,
        source: 'ai_extraction',
        reasoning: 'Direkt aus PDF extrahiert'
      })
    }
    
    // 2. Check enrichment data (Perplexity research)
    const enrichedValue = this.getValueFromEnrichment(fieldName)
    if (enrichedValue !== undefined && enrichedValue !== null) {
      const confidence = this.getEnrichmentConfidence(fieldName)
      suggestions.push({
        value: enrichedValue,
        confidence,
        source: 'enrichment',
        reasoning: 'Aus Web-Recherche ermittelt'
      })
    }
    
    // 3. Pattern matching for specific fields
    const patternValue = this.getValueFromPattern(fieldName)
    if (patternValue !== undefined && patternValue !== null) {
      suggestions.push({
        value: patternValue,
        confidence: 70, // Pattern matching is moderately confident
        source: 'pattern_matching',
        reasoning: 'Basierend auf bekannten Mustern'
      })
    }
    
    // 4. Database lookup for similar vehicles
    const dbValue = await this.getValueFromDatabase(fieldName)
    if (dbValue !== undefined && dbValue !== null) {
      suggestions.push({
        value: dbValue,
        confidence: 60, // Database lookups are less confident
        source: 'database_lookup',
        reasoning: 'Typischer Wert für ähnliche Fahrzeuge'
      })
    }
    
    // 5. If user already provided a value, include it
    if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
      suggestions.push({
        value: currentValue,
        confidence: 100,
        source: 'user_input',
        reasoning: 'Vom Benutzer eingegeben'
      })
    }
    
    // Sort suggestions by confidence
    suggestions.sort((a, b) => b.confidence - a.confidence)
    
    // Determine recommended value and if review is needed
    const recommended = suggestions[0]?.value
    const needsReview = suggestions.length === 0 || 
                       (suggestions[0]?.confidence < 80 && suggestions[0]?.source !== 'user_input')
    
    return {
      field: fieldName,
      suggestions,
      recommended_value: recommended,
      needs_user_review: needsReview
    }
  }

  /**
   * Get value from AI extraction
   */
  private getValueFromAIExtraction(fieldName: string): any {
    if (!this.extractedData?.ai_extracted) return null
    
    const mapping: Record<string, string[]> = {
      // Technical fields
      'displacement': ['technical.engine_displacement', 'technical.displacement_cc'],
      'cylinders': ['technical.cylinders', 'technical.cylinder_count'],
      'power_kw': ['technical.power_kw', 'technical.engine_power_kw'],
      'power_ps': ['technical.power_ps', 'technical.engine_power_ps'],
      'torque': ['technical.torque_nm', 'technical.max_torque'],
      'emission_class': ['environmental.emission_class', 'technical.emission_standard'],
      'co2_emissions': ['environmental.co2_emissions', 'environmental.co2_g_km'],
      'fuel_consumption_combined': ['environmental.fuel_consumption_combined', 'technical.consumption_combined'],
      'fuel_consumption_city': ['environmental.fuel_consumption_city', 'technical.consumption_city'],
      'fuel_consumption_highway': ['environmental.fuel_consumption_highway', 'technical.consumption_highway'],
      
      // Vehicle fields
      'make': ['vehicle.make', 'vehicle.manufacturer'],
      'model': ['vehicle.model'],
      'variant': ['vehicle.variant', 'vehicle.trim'],
      'year': ['vehicle.year', 'vehicle.first_registration_year'],
      'mileage': ['vehicle.mileage', 'vehicle.kilometrage'],
      'vin': ['vehicle.vin', 'vehicle.chassis_number'],
      
      // Equipment fields
      'exterior_color': ['features.exterior_color', 'equipment.exterior_color'],
      'interior_color': ['features.interior_color', 'equipment.interior_color'],
      'interior_material': ['features.upholstery', 'equipment.interior_material'],
      'door_count': ['technical.doors', 'vehicle.door_count'],
      'seat_count': ['technical.seats', 'vehicle.seat_count']
    }
    
    const paths = mapping[fieldName] || [fieldName]
    
    for (const path of paths) {
      const value = this.getNestedValue(this.extractedData.ai_extracted, path)
      if (value !== undefined && value !== null) {
        return value
      }
    }
    
    return null
  }

  /**
   * Get value from enrichment data
   */
  private getValueFromEnrichment(fieldName: string): any {
    if (!this.enrichedData) return null
    
    // Direct mapping
    const directFields = [
      'displacement_cc', 'cylinders', 'power_kw', 'power_hp', 
      'torque_nm', 'emission_class', 'co2_emissions',
      'fuel_consumption_combined', 'fuel_consumption_city', 'fuel_consumption_highway',
      'acceleration_0_100', 'top_speed', 'weight_empty', 'tank_capacity'
    ]
    
    if (directFields.includes(fieldName)) {
      return this.enrichedData[fieldName]
    }
    
    // Check dimensions
    if (fieldName.startsWith('dimension_')) {
      const dimension = fieldName.replace('dimension_', '')
      return this.enrichedData.dimensions?.[`${dimension}_mm`]
    }
    
    return null
  }

  /**
   * Get confidence score for AI extraction
   */
  private getAIConfidence(fieldName: string): number {
    const baseConfidence = this.extractedData?.extraction_metadata?.confidence_score || 70
    
    // Adjust confidence based on field type
    const highConfidenceFields = ['make', 'model', 'year', 'mileage', 'vin']
    const mediumConfidenceFields = ['power_kw', 'power_ps', 'fuel_type', 'transmission']
    
    if (highConfidenceFields.includes(fieldName)) {
      return Math.min(95, baseConfidence + 10)
    } else if (mediumConfidenceFields.includes(fieldName)) {
      return baseConfidence
    } else {
      return Math.max(50, baseConfidence - 10)
    }
  }

  /**
   * Get confidence score for enrichment data
   */
  private getEnrichmentConfidence(fieldName: string): number {
    // Check if we have specific confidence scores for this field
    const fieldConfidence = this.enrichedData?.confidence_scores?.[fieldName]
    if (fieldConfidence !== undefined) {
      return fieldConfidence
    }
    
    // Default confidence based on field type
    const technicalFields = ['displacement_cc', 'cylinders', 'power_kw', 'power_hp', 'torque_nm']
    const environmentalFields = ['emission_class', 'co2_emissions', 'fuel_consumption_combined']
    
    if (technicalFields.includes(fieldName)) {
      return 85 // High confidence for technical specs
    } else if (environmentalFields.includes(fieldName)) {
      return 75 // Medium confidence for environmental data
    } else {
      return 65 // Lower confidence for other fields
    }
  }

  /**
   * Get value from pattern matching
   */
  private getValueFromPattern(fieldName: string): any {
    // Example: Infer emission class from year and CO2 emissions
    if (fieldName === 'emission_class') {
      const year = this.extractedData?.ai_extracted?.vehicle?.year
      const co2 = this.enrichedData?.co2_emissions || this.extractedData?.ai_extracted?.environmental?.co2_emissions
      
      if (year && co2) {
        // Simplified emission class inference
        if (year >= 2020 && co2 <= 95) return 'Euro 6d'
        if (year >= 2018 && co2 <= 120) return 'Euro 6c'
        if (year >= 2015 && co2 <= 130) return 'Euro 6'
        if (year >= 2011) return 'Euro 5'
        if (year >= 2006) return 'Euro 4'
      }
    }
    
    // Example: Calculate power_ps from power_kw
    if (fieldName === 'power_ps') {
      const kw = this.getValueFromAIExtraction('power_kw') || this.getValueFromEnrichment('power_kw')
      if (kw) {
        return Math.round(kw * 1.35962) // Convert kW to PS
      }
    }
    
    // Example: Calculate power_kw from power_ps
    if (fieldName === 'power_kw') {
      const ps = this.getValueFromAIExtraction('power_ps') || this.getValueFromEnrichment('power_ps')
      if (ps) {
        return Math.round(ps * 0.735499) // Convert PS to kW
      }
    }
    
    return null
  }

  /**
   * Get value from database lookup
   */
  private async getValueFromDatabase(fieldName: string): Promise<any> {
    // Look up typical values from similar vehicles in the database
    const vehicle = this.extractedData?.ai_extracted?.vehicle
    if (!vehicle?.make || !vehicle?.model) return null
    
    const cacheKey = `${vehicle.make}_${vehicle.model}_${vehicle.year}`
    const cachedData = this.vehicleCache.get(cacheKey)
    
    if (cachedData && cachedData[fieldName]) {
      return cachedData[fieldName]
    }
    
    return null
  }

  /**
   * Load similar vehicles from database for reference
   */
  private async loadSimilarVehicles(vehicle: any) {
    if (!vehicle?.make || !vehicle?.model) return
    
    try {
      // Query offers with similar vehicles
      const { data: offers } = await this.supabase
        .from('offer')
        .select('*')
        .eq('make', vehicle.make)
        .eq('model', vehicle.model)
        .limit(10)
      
      if (offers && offers.length > 0) {
        // Calculate typical values
        const typical: any = {}
        
        const numericFields = [
          'displacement_cc', 'cylinders', 'power_kw', 'power_ps',
          'co2_emissions', 'fuel_consumption_combined'
        ]
        
        for (const field of numericFields) {
          const values = offers.map(o => o[field]).filter(v => v !== null && v !== undefined)
          if (values.length > 0) {
            // Use median value
            values.sort((a, b) => a - b)
            typical[field] = values[Math.floor(values.length / 2)]
          }
        }
        
        const cacheKey = `${vehicle.make}_${vehicle.model}_${vehicle.year}`
        this.vehicleCache.set(cacheKey, typical)
      }
    } catch (error) {
      console.error('Failed to load similar vehicles:', error)
    }
  }

  /**
   * Helper to get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    const parts = path.split('.')
    let current = obj
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return null
      }
      current = current[part]
    }
    
    return current
  }

  /**
   * Get all smart suggestions for technical details step
   */
  async getTechnicalDetailsSuggestions(): Promise<Record<string, SmartFieldResult>> {
    const fields = [
      'displacement', 'cylinders', 'power_kw', 'power_ps', 'torque',
      'emission_class', 'co2_emissions', 'fuel_consumption_combined',
      'fuel_consumption_city', 'fuel_consumption_highway'
    ]
    
    const results: Record<string, SmartFieldResult> = {}
    
    for (const field of fields) {
      results[field] = await this.getFieldSuggestion(field)
    }
    
    return results
  }

  /**
   * Get confidence indicator color
   */
  static getConfidenceColor(confidence: number): string {
    if (confidence >= 90) return 'text-green-600 dark:text-green-400'
    if (confidence >= 70) return 'text-yellow-600 dark:text-yellow-400'
    if (confidence >= 50) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  /**
   * Get confidence indicator icon
   */
  static getConfidenceIcon(confidence: number): string {
    if (confidence >= 90) return 'CheckCircle'
    if (confidence >= 70) return 'AlertCircle'
    return 'HelpCircle'
  }
}