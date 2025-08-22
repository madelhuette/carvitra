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
  // REMOVED: vehicleCache - No more pattern matching with similar vehicles!

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
    
    // REMOVED: No more loading similar vehicles from database!
    // We use pure KI-based decisions, not pattern matching from other offers
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
    
    // REMOVED: No database lookups for similar vehicles!
    // Pure KI-based decisions only
    
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
    if (!this.extractedData?.ai_extracted) {
      console.log('⚠️ SmartFieldService: Keine ai_extracted Daten verfügbar für', fieldName)
      return null
    }
    
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
    if (!this.enrichedData) {
      console.log('⚠️ SmartFieldService: Keine enrichedData verfügbar für', fieldName)
      return null
    }
    
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
   * DEPRECATED: Pattern matching removed in favor of AI agent
   */
  private getValueFromPattern(fieldName: string): any {
    // All pattern matching has been removed
    // This method only returns null now and will be removed completely
    return null
  }

  // REMOVED: getValueFromDatabase - No pattern matching from similar vehicles!

  // REMOVED: loadSimilarVehicles - No pattern matching from database!

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

  /**
   * Legacy method - now delegates to universal method
   */
  async getOfferTypeSuggestion(): Promise<SmartFieldResult> {
    // Delegate to universal method with proper constraints
    return this.getUniversalFieldSuggestion('offer_type_id', 'select', {
      enumOptions: ['Neuwagen', 'Gebrauchtwagen'],
      required: true
    })
  }

  /**
   * Universal field suggestion method - uses AI agent for all field resolutions
   */
  async getUniversalFieldSuggestion(
    fieldName: string,
    fieldType: 'select' | 'text' | 'number' | 'boolean' = 'text',
    constraints?: {
      enumOptions?: string[]
      required?: boolean
      min?: number
      max?: number
    }
  ): Promise<SmartFieldResult> {
    try {
      // Call the field resolution agent API
      const response = await fetch('/api/agents/field-resolution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldRequest: {
            fieldName,
            fieldType,
            constraints: {
              ...constraints,
              // For select fields, ALWAYS require a value
              required: fieldType === 'select' ? true : (constraints?.required || false)
            }
          },
          context: {
            extractedData: this.extractedData,
            enrichedData: this.enrichedData,
            pdfText: this.extractedData?.raw_text || '',
            instructions: `Resolve the field '${fieldName}' using all available information. 
              For select fields, you MUST choose one of the enumOptions. 
              Use Perplexity research if needed for accurate information.`
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Agent API error: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.resolution) {
        return {
          field: fieldName,
          suggestions: [{
            value: result.resolution.value,
            confidence: result.resolution.confidence || 50,
            source: 'langraph_agent' as const,
            reasoning: result.resolution.reasoning
          }],
          recommended_value: result.resolution.value,
          needs_user_review: false // Trust the agent
        }
      }

      // Fallback if agent fails
      console.warn(`Agent failed for field ${fieldName}, using fallback`)
      return this.getFallbackSuggestion(fieldName, fieldType, constraints)
      
    } catch (error) {
      console.error(`Error getting suggestion for ${fieldName}:`, error)
      return this.getFallbackSuggestion(fieldName, fieldType, constraints)
    }
  }

  /**
   * Fallback when agent fails - provide sensible defaults
   */
  private getFallbackSuggestion(
    fieldName: string,
    fieldType: string,
    constraints?: any
  ): SmartFieldResult {
    let fallbackValue: any = null
    
    // For select fields with options, use first option
    if (fieldType === 'select' && constraints?.enumOptions?.length > 0) {
      fallbackValue = constraints.enumOptions[0]
    }
    
    return {
      field: fieldName,
      suggestions: fallbackValue ? [{
        value: fallbackValue,
        confidence: 10,
        source: 'database_lookup' as const,
        reasoning: 'Fallback to first available option'
      }] : [],
      recommended_value: fallbackValue,
      needs_user_review: true
    }
  }

  /**
   * Legacy method - now delegates to universal method
   */
  async getVehicleTypeSuggestion(): Promise<SmartFieldResult> {
    // Delegate to universal method
    return this.getUniversalFieldSuggestion('vehicle_type_id', 'select')
  }



  /**
   * Get smart suggestions for vehicle basics step (Step 1)
   */
  async getVehicleBasicsSuggestions(): Promise<Record<string, SmartFieldResult>> {
    const results: Record<string, SmartFieldResult> = {}
    
    // Get offer type suggestion
    results['offer_type_id'] = await this.getOfferTypeSuggestion()
    
    // Get make/model suggestions
    results['make_id'] = await this.getFieldSuggestion('make')
    results['model'] = await this.getFieldSuggestion('model')
    results['trim'] = await this.getFieldSuggestion('variant')
    
    // Get vehicle type suggestion
    results['vehicle_type_id'] = await this.getVehicleTypeSuggestion()
    
    // Get fuel type suggestion (now in Step 1)
    results['fuel_type_id'] = await this.getFieldSuggestion('fuel_type')
    
    return results
  }

  /**
   * Get smart suggestions for technical details step (Step 2)
   */
  async getTechnicalDetailsSuggestions(): Promise<Record<string, SmartFieldResult>> {
    const fields = [
      'power_ps', 'power_kw', 'displacement', 'cylinders', 'torque',
      'fuel_type_id', 'transmission_type_id', 
      'co2_emissions', 'fuel_consumption_combined',
      'emission_class'
    ]
    
    const results: Record<string, SmartFieldResult> = {}
    
    for (const field of fields) {
      results[field] = await this.getFieldSuggestion(field)
    }
    
    // Add special handling for fuel type and transmission mapping
    results['fuel_type_id'] = await this.getFuelTypeSuggestion()
    results['transmission_type_id'] = await this.getTransmissionTypeSuggestion()
    
    return results
  }

  /**
   * Legacy method - now delegates to universal method
   */
  async getFuelTypeSuggestion(): Promise<SmartFieldResult> {
    // Delegate to universal method
    return this.getUniversalFieldSuggestion('fuel_type_id', 'select')
  }

  /**
   * Legacy method - now delegates to universal method
   */
  async getTransmissionTypeSuggestion(): Promise<SmartFieldResult> {
    // Delegate to universal method
    return this.getUniversalFieldSuggestion('transmission_type_id', 'select')
  }

  /**
   * Get smart suggestions for equipment step (Step 3)
   */
  async getEquipmentSuggestions(): Promise<Record<string, SmartFieldResult>> {
    console.log('🚀 SmartFieldService: getEquipmentSuggestions gestartet')
    const results: Record<string, SmartFieldResult> = {}
    
    try {
      // Color suggestions
      console.log('🎨 SmartFieldService: Lade Farbvorschläge...')
      results['exterior_color'] = await this.getFieldSuggestion('exterior_color')
      results['interior_color'] = await this.getFieldSuggestion('interior_color')
      results['interior_material'] = await this.getFieldSuggestion('interior_material')
      
      // Basic specs
      console.log('🔢 SmartFieldService: Lade Basic Specs...')
      results['door_count'] = await this.getFieldSuggestion('door_count')
      results['seat_count'] = await this.getFieldSuggestion('seat_count')
      
      // Equipment keywords
      console.log('🛠️ SmartFieldService: Lade Equipment Keywords...')
      results['equipment_keywords'] = await this.getEquipmentKeywords()
      
      console.log('✅ SmartFieldService: Equipment suggestions vollständig geladen:', Object.keys(results))
      return results
    } catch (error) {
      console.error('❌ SmartFieldService: Fehler beim Laden der Equipment-Suggestions:', error)
      return results
    }
  }

  /**
   * Extract equipment keywords using the new AI Equipment Extraction Agent
   */
  async getEquipmentKeywords(): Promise<SmartFieldResult> {
    const suggestions: FieldSuggestion[] = []
    
    if (!this.extractedData?.raw_text) {
      console.log('❌ SmartFieldService: Kein raw_text für Equipment Keywords verfügbar')
      return {
        field: 'equipment_keywords',
        suggestions: [],
        recommended_value: [],
        needs_user_review: true
      }
    }
    
    console.log('🤖 SmartFieldService: Verwende KI Equipment Extraction Agent')
    
    try {
      // Nutze den neuen Equipment Extraction Agent
      const response = await fetch('/api/agents/equipment-extraction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfDocumentId: this.documentId,
          context: {
            pdfText: this.extractedData.raw_text,
            extractedData: this.extractedData,
            enrichedData: this.enrichedData,
            vehicleInfo: {
              make: this.extractedData?.ai_extracted?.vehicle?.make,
              model: this.extractedData?.ai_extracted?.vehicle?.model,
              variant: this.extractedData?.ai_extracted?.vehicle?.variant,
              year: this.extractedData?.ai_extracted?.vehicle?.year,
              vehicleType: this.extractedData?.ai_extracted?.vehicle?.vehicle_type
            }
          },
          options: {
            enablePerplexity: true,
            confidenceThreshold: 70,
            maxResearchAttempts: 2,
            includeCustomEquipment: true,
            language: 'de'
          }
        })
      })
      
      if (!response.ok) {
        throw new Error(`Agent API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.result) {
        const result = data.result
        
        // Konvertiere Agent-Ergebnis zu SmartFieldResult Format
        const mappedEquipment = result.mappedEquipment.map((item: any) => ({
          id: item.equipmentId,
          name: item.equipmentName,
          confidence: item.confidence
        }))
        
        console.log(`✅ SmartFieldService: KI-Agent hat ${mappedEquipment.length} Equipment Items erkannt`)
        console.log(`📊 Gesamt-Konfidenz: ${result.confidence.overall}%`)
        
        // Log Kategorien
        result.categories.forEach((items: any[], category: string) => {
          if (items.length > 0) {
            console.log(`  📁 ${category}: ${items.length} Items`)
          }
        })
        
        suggestions.push({
          value: mappedEquipment,
          confidence: result.confidence.overall,
          source: 'ai_extraction',
          reasoning: `KI-Agent: ${result.metadata.totalFound} Features erkannt, ${result.metadata.mappedCount} in DB gemappt`
        })
        
        // Füge Custom Equipment als separaten Vorschlag hinzu
        if (result.customEquipment && result.customEquipment.length > 0) {
          console.log(`➕ ${result.customEquipment.length} neue Equipment-Items vorgeschlagen:`, result.customEquipment)
        }
        
        return {
          field: 'equipment_keywords',
          suggestions,
          recommended_value: suggestions[0]?.value || [],
          needs_user_review: result.confidence.overall < 80
        }
      }
      
    } catch (error) {
      console.error('❌ SmartFieldService: Equipment Agent fehlgeschlagen:', error)
      // Fallback zu Pattern-Matching wenn Agent fehlschlägt
      return this.getEquipmentKeywordsFallback()
    }
    
    // Fallback
    return this.getEquipmentKeywordsFallback()
  }
  
  /**
   * Fallback: Pattern-basierte Equipment-Extraktion (Legacy)
   */
  private async getEquipmentKeywordsFallback(): Promise<SmartFieldResult> {
    const suggestions: FieldSuggestion[] = []
    const text = this.extractedData.raw_text.toLowerCase()
    const mappedEquipment: Array<{id: string, name: string, confidence: number}> = []
    console.log('⚠️ SmartFieldService: Fallback zu Pattern-Matching. Text length:', text.length)
    
    // Enhanced equipment patterns with database name mapping
    const equipmentPatterns = {
      'Navigationssystem': {
        patterns: ['navi', 'navigation', 'gps', 'nav', 'routenführung'],
        dbName: 'Navigationssystem',
        confidence: 85
      },
      'Klimaautomatik': {
        patterns: ['klima', 'klimaanlage', 'air conditioning', 'ac', 'klimaautomatik'],
        dbName: 'Klimaautomatik',
        confidence: 80
      },
      'Sitzheizung': {
        patterns: ['sitzheizung', 'heated seats', 'beheizbar', 'beheizt'],
        dbName: 'Sitzheizung',
        confidence: 90
      },
      'Lederausstattung': {
        patterns: ['leder', 'leather', 'volleder', 'dakota'],
        dbName: 'Lederausstattung',
        confidence: 85
      },
      'LED-Scheinwerfer': {
        patterns: ['led', 'led-scheinwerfer', 'led licht'],
        dbName: 'LED-Scheinwerfer',
        confidence: 85
      },
      'Xenon-Scheinwerfer': {
        patterns: ['xenon', 'bi-xenon', 'xenon-scheinwerfer'],
        dbName: 'Xenon-Scheinwerfer',
        confidence: 85
      },
      'Alufelgen': {
        patterns: ['alu', 'alloy', 'felgen', 'leichtmetall', 'alufelgen'],
        dbName: 'Alufelgen',
        confidence: 80
      },
      'Einparkhilfe': {
        patterns: ['pdc', 'parktronic', 'einparkhilfe', 'park', 'sensoren'],
        dbName: 'Einparkhilfe',
        confidence: 85
      },
      'Parkassistent': {
        patterns: ['parkassistent', 'park assist', 'parkpilot'],
        dbName: 'Parkassistent',
        confidence: 85
      },
      'Tempomat': {
        patterns: ['tempomat', 'cruise control', 'geschwindigkeitsregelanlage'],
        dbName: 'Tempomat',
        confidence: 85
      },
      'Adaptive Cruise Control': {
        patterns: ['adaptive cruise control', 'acc', 'abstandsregeltempomat'],
        dbName: 'Adaptive Cruise Control',
        confidence: 90
      },
      'Elektrische Fensterheber': {
        patterns: ['fensterheber', 'electric windows', 'elektrisch'],
        dbName: 'Elektrische Fensterheber',
        confidence: 80
      },
      'Automatikgetriebe': {
        patterns: ['automatik', 'automatic', 'dsg', 'tiptronic', 'automatikgetriebe'],
        dbName: 'Automatikgetriebe',
        confidence: 95
      },
      'Schaltgetriebe': {
        patterns: ['schaltgetriebe', 'manual', 'handschaltung', '6-gang'],
        dbName: 'Schaltgetriebe',
        confidence: 90
      },
      'Allradantrieb': {
        patterns: ['allrad', '4wd', 'awd', 'quattro', 'xdrive', '4motion'],
        dbName: 'Allradantrieb',
        confidence: 95
      },
      'Panoramadach': {
        patterns: ['panorama', 'schiebedach', 'glasdach', 'panoramadach'],
        dbName: 'Panoramadach',
        confidence: 90
      },
      'Schiebedach': {
        patterns: ['schiebedach', 'sunroof'],
        dbName: 'Schiebedach',
        confidence: 90
      },
      'Bluetooth': {
        patterns: ['bluetooth', 'wireless', 'handy'],
        dbName: 'Bluetooth',
        confidence: 80
      },
      'Apple CarPlay': {
        patterns: ['carplay', 'apple carplay', 'smartphone integration'],
        dbName: 'Apple CarPlay',
        confidence: 90
      },
      'Android Auto': {
        patterns: ['android auto', 'android'],
        dbName: 'Android Auto',
        confidence: 90
      }
    }
    
    // Check for equipment patterns and map to database IDs
    for (const [equipmentKey, config] of Object.entries(equipmentPatterns)) {
      for (const pattern of config.patterns) {
        if (text.includes(pattern)) {
          console.log(`🎯 SmartFieldService: Gefunden - "${config.dbName}" über Pattern "${pattern}"`)
          
          // Query database for equipment ID
          const { data: equipment } = await this.supabase
            .from('equipment')
            .select('id, name')
            .ilike('name', config.dbName)
            .single()
          
          if (equipment) {
            console.log(`✅ SmartFieldService: Equipment "${config.dbName}" in DB gefunden mit ID: ${equipment.id}`)
            mappedEquipment.push({
              id: equipment.id,
              name: equipment.name,
              confidence: config.confidence
            })
          } else {
            console.log(`❌ SmartFieldService: Equipment "${config.dbName}" nicht in DB gefunden`)
          }
          break
        }
      }
    }
    
    console.log(`✅ SmartFieldService: ${mappedEquipment.length} Equipment Items gemappt:`, mappedEquipment.map(e => e.name))
    
    if (mappedEquipment.length > 0) {
      suggestions.push({
        value: mappedEquipment,
        confidence: Math.round(mappedEquipment.reduce((avg, item) => avg + item.confidence, 0) / mappedEquipment.length),
        source: 'pattern_matching' as const,
        reasoning: `${mappedEquipment.length} Ausstattungsmerkmale erkannt und in DB gemappt`
      })
    } else {
      console.log('⚠️ SmartFieldService: Keine Equipment Items im Text gefunden oder gemappt')
    }
    
    return {
      field: 'equipment_keywords',
      suggestions,
      recommended_value: suggestions[0]?.value || [],
      needs_user_review: mappedEquipment.length === 0
    }
  }

  /**
   * Get smart suggestions for availability step (Step 4)
   */
  async getAvailabilitySuggestions(): Promise<Record<string, SmartFieldResult>> {
    const results: Record<string, SmartFieldResult> = {}
    
    // Price suggestions
    results['list_price_gross'] = await this.getPriceSuggestion('list_price_gross')
    results['list_price_net'] = await this.getPriceSuggestion('list_price_net')
    
    // Vehicle history
    results['first_registration'] = await this.getFieldSuggestion('first_registration')
    results['mileage_count'] = await this.getFieldSuggestion('mileage')
    results['owner_count'] = await this.getFieldSuggestion('owner_count')
    
    // Availability status
    results['availability_type_id'] = await this.getAvailabilityStatus()
    
    return results
  }

  /**
   * Get price suggestions from PDF
   */
  async getPriceSuggestion(priceType: 'list_price_gross' | 'list_price_net'): Promise<SmartFieldResult> {
    const suggestions: FieldSuggestion[] = []
    
    if (this.extractedData?.raw_text) {
      const prices = this.extractPricesFromText(this.extractedData.raw_text)
      
      for (const price of prices) {
        const confidence = price.type === priceType ? 85 : 70
        suggestions.push({
          value: price.amount,
          confidence,
          source: 'ai_extraction',
          reasoning: `Preis ${price.formatted} im PDF gefunden`
        })
      }
    }
    
    return {
      field: priceType,
      suggestions,
      recommended_value: suggestions[0]?.value || null,
      needs_user_review: suggestions.length === 0
    }
  }

  /**
   * Extract prices from text
   */
  private extractPricesFromText(text: string): Array<{amount: number, type: string, formatted: string}> {
    const prices: Array<{amount: number, type: string, formatted: string}> = []
    
    // Price patterns
    const priceRegex = /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*€/g
    let match
    
    while ((match = priceRegex.exec(text)) !== null) {
      const priceStr = match[1]
      const amount = parseFloat(priceStr.replace(/\./g, '').replace(',', '.'))
      
      if (amount > 1000) { // Only consider realistic car prices
        const isBrutto = text.toLowerCase().includes('brutto') || text.toLowerCase().includes('inkl')
        prices.push({
          amount,
          type: isBrutto ? 'list_price_gross' : 'list_price_net',
          formatted: match[0]
        })
      }
    }
    
    return prices
  }

  /**
   * Legacy method - now delegates to universal method
   */
  async getAvailabilityStatus(): Promise<SmartFieldResult> {
    // Delegate to universal method
    return this.getUniversalFieldSuggestion('availability_type_id', 'select', {
      enumOptions: ['Sofort verfügbar', 'Auf Anfrage', 'Reserviert', 'Verkauft'],
      required: true
    })
  }

  /**
   * Get smart suggestions for financing step (Step 5)
   */
  async getFinancingSuggestions(): Promise<Record<string, SmartFieldResult>> {
    const results: Record<string, SmartFieldResult> = {}
    
    results['financing_available'] = await this.getFinancingAvailability()
    results['credit_offers'] = await this.getFinancingOffers()
    
    return results
  }

  /**
   * Legacy method - now delegates to universal method
   */
  async getFinancingAvailability(): Promise<SmartFieldResult> {
    // Delegate to universal method
    return this.getUniversalFieldSuggestion('financing_available', 'boolean')
  }

  /**
   * Extract financing offers from PDF
   */
  async getFinancingOffers(): Promise<SmartFieldResult> {
    const suggestions: FieldSuggestion[] = []
    
    if (this.extractedData?.raw_text) {
      const offers = this.extractFinancingOffers(this.extractedData.raw_text)
      
      if (offers.length > 0) {
        suggestions.push({
          value: offers,
          confidence: 75,
          source: 'ai_extraction',
          reasoning: `${offers.length} Finanzierungsangebot(e) gefunden`
        })
      }
    }
    
    return {
      field: 'credit_offers',
      suggestions,
      recommended_value: suggestions[0]?.value || [],
      needs_user_review: suggestions.length === 0
    }
  }

  /**
   * Extract financing offers from text
   */
  private extractFinancingOffers(text: string): Array<any> {
    const offers: Array<any> = []
    
    // Look for monthly rates
    const rateRegex = /(\d{1,3}(?:,\d{2})?)\s*€?\s*(?:pro monat|monatlich|\/monat|rate)/gi
    let match
    
    while ((match = rateRegex.exec(text)) !== null) {
      const monthlyRate = parseFloat(match[1].replace(',', '.'))
      
      if (monthlyRate > 50 && monthlyRate < 2000) { // Realistic monthly rates
        offers.push({
          id: `extracted-${offers.length + 1}`,
          monthly_rate: monthlyRate,
          credit_type: text.toLowerCase().includes('leasing') ? 'Leasing' : 'Kredit',
          institution_name: 'Aus PDF extrahiert'
        })
      }
    }
    
    return offers
  }

  /**
   * Get smart suggestions for contact step (Step 6)
   */
  async getContactSuggestions(): Promise<Record<string, SmartFieldResult>> {
    const results: Record<string, SmartFieldResult> = {}
    
    results['dealer_info'] = await this.getDealerInfo()
    results['sales_person'] = await this.getSalesPersonInfo()
    
    return results
  }

  /**
   * Extract dealer information
   */
  async getDealerInfo(): Promise<SmartFieldResult> {
    const suggestions: FieldSuggestion[] = []
    
    if (this.extractedData?.raw_text) {
      const dealerInfo = this.extractDealerFromText(this.extractedData.raw_text)
      
      if (dealerInfo) {
        suggestions.push({
          value: dealerInfo,
          confidence: 70,
          source: 'ai_extraction',
          reasoning: 'Händlerinformationen aus PDF extrahiert'
        })
      }
    }
    
    return {
      field: 'dealer_info',
      suggestions,
      recommended_value: suggestions[0]?.value || null,
      needs_user_review: suggestions.length === 0
    }
  }

  /**
   * Extract dealer info from text
   */
  private extractDealerFromText(text: string): any {
    // Look for company patterns
    const companyRegex = /((?:Auto|BMW|Mercedes|Audi|VW|Volkswagen)[^\n]*(?:GmbH|AG|KG|e\.K\.))/gi
    const phoneRegex = /(\+49[\s\-]?\d{2,4}[\s\-]?\d{6,8}|\d{4,5}[\s\-]?\d{6,8})/g
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
    
    const companyMatch = companyRegex.exec(text)
    const phoneMatch = phoneRegex.exec(text)
    const emailMatch = emailRegex.exec(text)
    
    if (companyMatch || phoneMatch || emailMatch) {
      return {
        company_name: companyMatch?.[1] || '',
        phone: phoneMatch?.[1] || '',
        email: emailMatch?.[1] || ''
      }
    }
    
    return null
  }

  /**
   * Get sales person information
   */
  async getSalesPersonInfo(): Promise<SmartFieldResult> {
    const suggestions: FieldSuggestion[] = []
    
    if (this.extractedData?.raw_text) {
      const salesPerson = this.extractSalesPersonFromText(this.extractedData.raw_text)
      
      if (salesPerson) {
        suggestions.push({
          value: salesPerson,
          confidence: 60,
          source: 'ai_extraction',
          reasoning: 'Ansprechpartner aus PDF extrahiert'
        })
      }
    }
    
    return {
      field: 'sales_person',
      suggestions,
      recommended_value: suggestions[0]?.value || null,
      needs_user_review: suggestions.length === 0
    }
  }

  /**
   * Extract sales person from text
   */
  private extractSalesPersonFromText(text: string): any {
    // Look for name patterns before contact info
    const namePattern = /(?:Ansprechpartner|Kontakt|Ihr\s+(?:Verkäufer|Berater))[:\s]*([A-ZÄÖÜ][a-zäöüß]+\s+[A-ZÄÖÜ][a-zäöüß]+)/gi
    const match = namePattern.exec(text)
    
    if (match) {
      const fullName = match[1]
      const nameParts = fullName.split(' ')
      
      return {
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        full_name: fullName
      }
    }
    
    return null
  }

  /**
   * Get smart suggestions for marketing step (Step 7)
   */
  async getMarketingSuggestions(): Promise<Record<string, SmartFieldResult>> {
    const results: Record<string, SmartFieldResult> = {}
    
    results['seo_title'] = await this.generateSEOTitle()
    results['seo_description'] = await this.generateSEODescription()
    results['url_slug'] = await this.generateURLSlug()
    
    return results
  }

  /**
   * Generate SEO title suggestion
   */
  async generateSEOTitle(): Promise<SmartFieldResult> {
    const suggestions: FieldSuggestion[] = []
    
    const vehicle = this.extractedData?.ai_extracted?.vehicle
    if (vehicle?.make && vehicle?.model) {
      const offerType = await this.getOfferTypeSuggestion()
      const type = offerType.recommended_value === 'Neuwagen' ? 'Neuwagen' : 'Gebrauchtwagen'
      
      const title = `${vehicle.make} ${vehicle.model} ${type} ${vehicle.variant ? vehicle.variant + ' ' : ''}kaufen | Leasing Angebot`
      
      suggestions.push({
        value: title,
        confidence: 85,
        source: 'ai_extraction',
        reasoning: 'SEO-Titel aus Fahrzeugdaten generiert'
      })
    }
    
    return {
      field: 'seo_title',
      suggestions,
      recommended_value: suggestions[0]?.value || '',
      needs_user_review: suggestions.length === 0
    }
  }

  /**
   * Generate SEO description
   */
  async generateSEODescription(): Promise<SmartFieldResult> {
    const suggestions: FieldSuggestion[] = []
    
    const vehicle = this.extractedData?.ai_extracted?.vehicle
    const technical = this.enrichedData
    
    if (vehicle?.make && vehicle?.model) {
      const parts = [
        `${vehicle.make} ${vehicle.model}`,
        vehicle.variant ? vehicle.variant : '',
        technical?.power_ps ? `${technical.power_ps} PS` : '',
        technical?.fuel_type ? technical.fuel_type : '',
        'günstig kaufen oder leasen.',
        'Sofort verfügbar mit attraktiven Finanzierungsangeboten.'
      ].filter(Boolean)
      
      const description = parts.join(' ')
      
      suggestions.push({
        value: description,
        confidence: 80,
        source: 'ai_extraction',
        reasoning: 'SEO-Beschreibung aus Fahrzeugdaten generiert'
      })
    }
    
    return {
      field: 'seo_description',
      suggestions,
      recommended_value: suggestions[0]?.value || '',
      needs_user_review: suggestions.length === 0
    }
  }

  /**
   * Generate URL slug
   */
  async generateURLSlug(): Promise<SmartFieldResult> {
    const suggestions: FieldSuggestion[] = []
    
    const vehicle = this.extractedData?.ai_extracted?.vehicle
    if (vehicle?.make && vehicle?.model) {
      const offerType = await this.getOfferTypeSuggestion()
      const type = offerType.recommended_value === 'Neuwagen' ? 'neuwagen' : 'gebrauchtwagen'
      
      const slugParts = [
        vehicle.make?.toLowerCase(),
        vehicle.model?.toLowerCase().replace(/\s+/g, '-'),
        vehicle.variant?.toLowerCase().replace(/\s+/g, '-'),
        type
      ].filter(Boolean)
      
      const slug = slugParts.join('-')
                            .replace(/[^a-z0-9-]/g, '')
                            .replace(/-+/g, '-')
                            .replace(/^-|-$/g, '')
      
      suggestions.push({
        value: slug,
        confidence: 90,
        source: 'ai_extraction',
        reasoning: 'URL-Slug aus Fahrzeugdaten generiert'
      })
    }
    
    return {
      field: 'url_slug',
      suggestions,
      recommended_value: suggestions[0]?.value || '',
      needs_user_review: suggestions.length === 0
    }
  }
}