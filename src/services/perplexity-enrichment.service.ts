import { SupabaseClient } from '@supabase/supabase-js'

interface VehicleData {
  make?: string
  model?: string
  variant?: string
  year?: number
  mileage?: number
  fuel_type?: string
  transmission?: string
  body_type?: string
}

interface EnrichmentResult {
  enriched_data: {
    displacement_cc?: number
    cylinders?: number
    power_kw?: number
    power_hp?: number
    torque_nm?: number
    emission_class?: string
    co2_emissions?: number
    fuel_consumption_combined?: number
    fuel_consumption_city?: number
    fuel_consumption_highway?: number
    acceleration_0_100?: number
    top_speed?: number
    weight_empty?: number
    weight_total?: number
    tank_capacity?: number
    dimensions?: {
      length_mm?: number
      width_mm?: number
      height_mm?: number
      wheelbase_mm?: number
    }
    confidence_scores?: Record<string, number>
    sources?: string[]
    research_context?: string
  }
  vehicle_year: number | null
  vehicle_age_category: 'new' | 'young_used' | 'used' | 'classic' | 'vintage' | null
  enrichment_model: string
  enrichment_timestamp: Date
}

export class PerplexityEnrichmentService {
  private apiKey: string
  private supabase: SupabaseClient
  private readonly API_URL = 'https://api.perplexity.ai/chat/completions'
  private readonly MODEL = 'sonar' // Cost-effective model for research
  private readonly MAX_RETRIES = 3
  private readonly RETRY_DELAY = 1000 // Start with 1 second
  private vehicleCache = new Map<string, any>()

  constructor(supabase: SupabaseClient) {
    // Try both possible environment variable names
    const apiKey = process.env.PERPLEXITY_KEY || process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY
    if (!apiKey) {
      throw new Error('PERPLEXITY_KEY or NEXT_PUBLIC_PERPLEXITY_API_KEY is not configured')
    }
    this.apiKey = apiKey
    this.supabase = supabase
  }

  /**
   * Enrich vehicle data with technical specifications from web research
   */
  async enrichVehicleData(
    documentId: string,
    vehicleData: VehicleData,
    extractedText?: string
  ): Promise<EnrichmentResult> {
    try {
      // Check cache first
      const cacheKey = `${vehicleData.make}_${vehicleData.model}_${vehicleData.variant}_${vehicleData.year}`
      if (this.vehicleCache.has(cacheKey)) {
        console.log('Using cached enrichment data for:', cacheKey)
        const cachedData = this.vehicleCache.get(cacheKey)
        // Save to database even for cached data
        const result: EnrichmentResult = {
          enriched_data: cachedData,
          vehicle_year: vehicleData.year || null,
          vehicle_age_category: this.categorizeVehicleAge(vehicleData.year).ageCategory,
          enrichment_model: `${this.MODEL} (cached)`,
          enrichment_timestamp: new Date()
        }
        await this.saveEnrichmentData(documentId, result)
        return result
      }
      // Determine vehicle age category
      const { year, ageCategory } = this.categorizeVehicleAge(vehicleData.year)
      
      // Build research prompt
      const prompt = this.buildResearchPrompt(vehicleData, ageCategory, extractedText)
      
      // Call Perplexity API
      const enrichedData = await this.callPerplexityAPI(prompt)
      
      // Cache the result
      this.vehicleCache.set(cacheKey, enrichedData)
      
      // Save to database
      const result: EnrichmentResult = {
        enriched_data: enrichedData,
        vehicle_year: year,
        vehicle_age_category: ageCategory,
        enrichment_model: this.MODEL,
        enrichment_timestamp: new Date()
      }
      
      await this.saveEnrichmentData(documentId, result)
      
      return result
    } catch (error) {
      console.error('Enrichment failed:', error)
      throw error
    }
  }

  private categorizeVehicleAge(year?: number): {
    year: number | null
    ageCategory: 'new' | 'young_used' | 'used' | 'classic' | 'vintage' | null
  } {
    if (!year) return { year: null, ageCategory: null }
    
    const currentYear = new Date().getFullYear()
    const age = currentYear - year
    
    let ageCategory: 'new' | 'young_used' | 'used' | 'classic' | 'vintage'
    
    if (age < 1) {
      ageCategory = 'new'
    } else if (age <= 3) {
      ageCategory = 'young_used'
    } else if (age <= 10) {
      ageCategory = 'used'
    } else if (age <= 30) {
      ageCategory = 'classic'
    } else {
      ageCategory = 'vintage'
    }
    
    return { year, ageCategory }
  }

  private buildResearchPrompt(
    vehicleData: VehicleData,
    ageCategory: string | null,
    extractedText?: string
  ): string {
    const { make, model, variant, year, fuel_type, transmission } = vehicleData
    
    let contextInfo = ''
    if (ageCategory) {
      contextInfo = `This is a ${ageCategory} vehicle from ${year}. `
      if (ageCategory === 'new' || ageCategory === 'young_used') {
        contextInfo += 'Focus on current specifications from recent model years. '
      } else if (ageCategory === 'classic' || ageCategory === 'vintage') {
        contextInfo += 'This is an older vehicle, so specifications should reflect the original values from that era. '
      }
    }
    
    // Extract any additional context from the PDF text
    let additionalContext = ''
    if (extractedText) {
      // Look for keywords that might help identify specific trim or engine
      const engineMatch = extractedText.match(/(\d+[,.]?\d*)\s*(?:Liter|L|ccm|cm³)/i)
      const powerMatch = extractedText.match(/(\d+)\s*(?:PS|hp|KW|kW)/i)
      
      if (engineMatch || powerMatch) {
        additionalContext = '\nAdditional context from document: '
        if (engineMatch) additionalContext += `Engine size mentioned: ${engineMatch[0]}. `
        if (powerMatch) additionalContext += `Power mentioned: ${powerMatch[0]}. `
      }
    }
    
    return `Research technical specifications for this vehicle:
${make} ${model}${variant ? ` ${variant}` : ''} (${year || 'year unknown'})
${fuel_type ? `Fuel: ${fuel_type}` : ''}
${transmission ? `Transmission: ${transmission}` : ''}

${contextInfo}
${additionalContext}

Please find and return ONLY factual technical data that can be researched online. Focus on:
- Engine displacement (in cc)
- Number of cylinders
- Power output (in kW and PS/hp)
- Torque (in Nm)
- CO2 emissions (g/km)
- Fuel consumption (combined, city, highway in l/100km)
- Emission class (Euro standard)
- Acceleration 0-100 km/h (seconds)
- Top speed (km/h)
- Empty weight (kg)
- Tank capacity (liters)
- Dimensions if available (length, width, height in mm)

Return data in JSON format with the structure:
{
  "displacement_cc": number or null,
  "cylinders": number or null,
  "power_kw": number or null,
  "power_hp": number or null,
  "torque_nm": number or null,
  "emission_class": string or null,
  "co2_emissions": number or null,
  "fuel_consumption_combined": number or null,
  "fuel_consumption_city": number or null,
  "fuel_consumption_highway": number or null,
  "acceleration_0_100": number or null,
  "top_speed": number or null,
  "weight_empty": number or null,
  "tank_capacity": number or null,
  "dimensions": {
    "length_mm": number or null,
    "width_mm": number or null,
    "height_mm": number or null,
    "wheelbase_mm": number or null
  },
  "confidence_scores": {
    "field_name": 0-100 confidence percentage
  },
  "sources": ["list of sources used"],
  "research_context": "Brief note about data reliability or special considerations"
}

IMPORTANT: Only return data you can verify from reliable sources. Set fields to null if data cannot be found. Include confidence scores for each field based on source reliability.`
  }

  private async callPerplexityAPI(prompt: string, retryCount = 0): Promise<any> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a technical research assistant that finds accurate vehicle specifications from reliable sources. Always return data in the requested JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1, // Low temperature for factual accuracy
          max_tokens: 2000,
          stream: false // Explicitly disable streaming
        })
      })

      if (!response.ok) {
        // Log the response body for better debugging
        let errorDetails = ''
        try {
          const errorBody = await response.text()
          errorDetails = ` - Details: ${errorBody}`
          console.error('Perplexity API Error Response:', errorBody)
        } catch (e) {
          // Ignore if we can't read the error body
        }
        
        // Handle rate limiting with exponential backoff
        if (response.status === 429 && retryCount < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY * Math.pow(2, retryCount)
          console.log(`Rate limited. Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          return this.callPerplexityAPI(prompt, retryCount + 1)
        }
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}${errorDetails}`)
      }

      const data = await response.json()
      
      // Validate API response structure
      if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        console.error('Invalid Perplexity API response structure:', data)
        throw new Error('Invalid Perplexity API response structure')
      }
      
      const content = data.choices[0]?.message?.content

      if (!content) {
        console.error('No content in Perplexity response:', data)
        throw new Error('No content in Perplexity response')
      }

      // Parse JSON from response
      try {
        // Extract JSON from the response (it might be wrapped in markdown)
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                         content.match(/\{[\s\S]*\}/)
        
        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0]
          return JSON.parse(jsonStr)
        } else {
          // Try direct parse
          return JSON.parse(content)
        }
      } catch (parseError) {
        console.error('Failed to parse Perplexity response:', content)
        // Return empty enrichment if parsing fails
        return {
          research_context: 'Failed to parse API response',
          confidence_scores: {}
        }
      }
    } catch (error) {
      console.error('Perplexity API call failed:', error)
      // Retry on network errors
      if (retryCount < this.MAX_RETRIES && error instanceof TypeError) {
        const delay = this.RETRY_DELAY * Math.pow(2, retryCount)
        console.log(`Network error. Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.callPerplexityAPI(prompt, retryCount + 1)
      }
      throw error
    }
  }

  private async saveEnrichmentData(
    documentId: string,
    enrichmentResult: EnrichmentResult
  ): Promise<void> {
    const { error } = await this.supabase
      .from('pdf_documents')
      .update({
        enriched_data: enrichmentResult.enriched_data,
        vehicle_year: enrichmentResult.vehicle_year,
        vehicle_age_category: enrichmentResult.vehicle_age_category,
        enrichment_model: enrichmentResult.enrichment_model,
        enrichment_timestamp: enrichmentResult.enrichment_timestamp.toISOString()
      })
      .eq('id', documentId)

    if (error) {
      console.error('Failed to save enrichment data:', error)
      throw error
    }
  }

  /**
   * Search for specific vehicle information (für LangGraph Agent)
   */
  async searchVehicleInfo(query: string, vehicleData?: any): Promise<{
    result: any,
    confidence: number,
    sources: string[],
    tokens_used?: number
  }> {
    try {
      const prompt = this.buildSearchPrompt(query, vehicleData)
      
      console.log(`🔍 Perplexity search: "${query}"`)
      
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a vehicle expert. Answer the specific question with accurate information and cite your sources.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 1000,
          stream: false
        })
      })

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No content in Perplexity response')
      }

      // Extract sources and calculate confidence
      const sources = this.extractSources(content)
      const confidence = this.calculateSearchConfidence(content, sources)

      return {
        result: content,
        confidence,
        sources,
        tokens_used: data.usage?.total_tokens
      }
    } catch (error) {
      console.error('Perplexity search failed:', error)
      return {
        result: null,
        confidence: 0,
        sources: [],
        tokens_used: 0
      }
    }
  }

  /**
   * Build search prompt for specific queries
   */
  private buildSearchPrompt(query: string, vehicleData?: any): string {
    let context = ''
    
    if (vehicleData?.make && vehicleData?.model) {
      context = `Vehicle: ${vehicleData.make} ${vehicleData.model}`
      if (vehicleData.variant) context += ` ${vehicleData.variant}`
      if (vehicleData.year) context += ` (${vehicleData.year})`
      context += '\n\n'
    }

    return `${context}Specific question: ${query}

Please provide a precise answer with the following requirements:
- Focus on factual, technical information
- Cite reliable sources (manufacturer websites, official spec sheets)
- If uncertain, express the level of confidence
- Keep the answer concise but complete

Answer format:
ANSWER: [your response]
CONFIDENCE: [High/Medium/Low]
SOURCES: [list sources if available]`
  }

  /**
   * Extract sources from Perplexity response
   */
  private extractSources(content: string): string[] {
    const sources: string[] = []
    
    // Look for URLs or source mentions
    const urlPattern = /https?:\/\/[^\s)]+/g
    const urls = content.match(urlPattern) || []
    sources.push(...urls)
    
    // Look for "SOURCES:" section
    const sourcesMatch = content.match(/SOURCES?:\s*(.+?)(?:\n|$)/i)
    if (sourcesMatch) {
      const sourceText = sourcesMatch[1]
      const additionalSources = sourceText.split(',').map(s => s.trim()).filter(s => s)
      sources.push(...additionalSources)
    }
    
    return [...new Set(sources)] // Remove duplicates
  }

  /**
   * Calculate confidence based on response quality
   */
  private calculateSearchConfidence(content: string, sources: string[]): number {
    let confidence = 50 // Base confidence
    
    // Boost confidence for explicit confidence statements
    if (content.toLowerCase().includes('confidence: high')) confidence += 30
    else if (content.toLowerCase().includes('confidence: medium')) confidence += 15
    else if (content.toLowerCase().includes('confidence: low')) confidence -= 20
    
    // Boost confidence for sources
    if (sources.length > 0) confidence += 20
    if (sources.some(s => s.includes('manufacturer') || s.includes('official'))) confidence += 15
    
    // Boost confidence for specific technical data
    if (content.match(/\d+\s*(ps|kw|nm|mm|kg|l\/100|g\/km)/i)) confidence += 10
    
    // Penalize uncertainty indicators
    if (content.toLowerCase().includes('uncertain') || 
        content.toLowerCase().includes('might be') ||
        content.toLowerCase().includes('possibly')) confidence -= 15
    
    return Math.max(0, Math.min(100, confidence))
  }

  /**
   * Check if a document has already been enriched
   */
  async isDocumentEnriched(documentId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('pdf_documents')
      .select('enrichment_timestamp')
      .eq('id', documentId)
      .single()

    if (error) {
      console.error('Failed to check enrichment status:', error)
      return false
    }

    return !!data?.enrichment_timestamp
  }

  /**
   * Get enrichment data for a document
   */
  async getEnrichmentData(documentId: string): Promise<EnrichmentResult | null> {
    const { data, error } = await this.supabase
      .from('pdf_documents')
      .select('enriched_data, vehicle_year, vehicle_age_category, enrichment_model, enrichment_timestamp')
      .eq('id', documentId)
      .single()

    if (error || !data) {
      return null
    }

    return {
      enriched_data: data.enriched_data || {},
      vehicle_year: data.vehicle_year,
      vehicle_age_category: data.vehicle_age_category,
      enrichment_model: data.enrichment_model,
      enrichment_timestamp: new Date(data.enrichment_timestamp)
    }
  }
}