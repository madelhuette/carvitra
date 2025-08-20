import { anthropic } from '@/lib/anthropic/client'

/**
 * Field Extractor Service
 * Extrahiert spezifische Felder aus gespeichertem PDF-Text on-demand
 * Verwendet Claude für intelligente Kontextextraktion
 */

// Typen für verschiedene Extraktionskategorien
export interface VehicleFields {
  offer_type?: 'new' | 'used' | 'demonstration' | 'yearly'
  vehicle_category?: string
  make?: string
  model?: string
  trim?: string
  doors?: number
  seats?: number
  displacement?: number
  cylinders?: number
  exterior_color?: string
  interior_color?: string
  interior_material?: string
  first_registration?: string
  mileage?: number
  previous_owners?: number
  accident_free?: boolean
}

export interface TechnicalFields {
  fuel_type?: string
  transmission?: string
  power_kw?: number
  power_ps?: number
  fuel_consumption_combined?: number
  fuel_consumption_electric?: number
  battery_capacity_gross?: number
  battery_capacity_usable?: number
  electric_range?: number
  co2_emissions?: number
  emission_class?: string
  efficiency_class?: string
}

export interface PricingFields {
  list_price_gross?: number
  list_price_net?: number
  monthly_rate?: number
  duration_months?: number
  down_payment?: number
  closing_rate?: number
  annual_mileage?: number
  effective_interest?: number
  total_amount?: number
}

export interface DealerFields {
  dealer_name?: string
  dealer_address?: string
  dealer_city?: string
  dealer_postal_code?: string
  dealer_phone?: string
  dealer_email?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
}

export interface ExtractedFields {
  vehicle?: VehicleFields
  technical?: TechnicalFields
  pricing?: PricingFields
  dealer?: DealerFields
  equipment?: string[]
  availability?: string
  metadata?: {
    confidence: number
    extraction_timestamp: string
  }
}

export class FieldExtractorService {
  /**
   * Extrahiert ein einzelnes Feld aus dem Text
   */
  static async extractSingleField(
    rawText: string, 
    fieldName: string,
    fieldDescription?: string
  ): Promise<any> {
    const prompt = `
Extrahiere das Feld "${fieldName}" aus diesem Fahrzeugangebot.
${fieldDescription ? `Beschreibung: ${fieldDescription}` : ''}

Regeln:
- Gib nur den Wert zurück, keine Erklärung
- Bei Zahlen: Nur Ziffern ohne Einheiten
- Bei Boolean: "true" oder "false"
- Wenn nicht gefunden: "null"

Text:
${rawText.substring(0, 5000)}
`

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        temperature: 0,
        system: 'Du bist ein Experte für die Extraktion von Fahrzeugdaten aus deutschen Angebots-PDFs.',
        messages: [{ role: 'user', content: prompt }]
      })

      const content = response.content[0]
      if (content.type === 'text') {
        const value = content.text.trim()
        return value === 'null' ? null : value
      }
      return null
    } catch (error) {
      console.error(`Error extracting field ${fieldName}:`, error)
      return null
    }
  }

  /**
   * Extrahiert alle Felder für eine Landingpage
   */
  static async extractForLandingpage(rawText: string): Promise<ExtractedFields> {
    const prompt = `
Analysiere diesen Fahrzeugangebot-Text und extrahiere alle relevanten Daten für eine Landingpage.
Gib die Daten als JSON zurück.

WICHTIGE FELDER:
1. Angebotstyp (Neuwagen/Gebrauchtwagen/Jahreswagen)
2. Fahrzeugkategorie (Limousine/Kombi/SUV/etc.)
3. Marke, Modell, Ausstattungslinie
4. Technische Daten (PS, kW, Kraftstoff, Getriebe)
5. Umweltdaten (CO2, Verbrauch, Elektro-Reichweite)
6. Preise (Listenpreis, Leasingrate, Anzahlung)
7. Kilometerstand und Erstzulassung
8. Ausstattungsmerkmale (als Array)
9. Händler und Kontaktdaten
10. Verfügbarkeit

JSON-SCHEMA:
{
  "vehicle": {
    "offer_type": "new|used|demonstration|yearly",
    "vehicle_category": "string",
    "make": "string",
    "model": "string",
    "trim": "string",
    "doors": number,
    "seats": number,
    "exterior_color": "string",
    "interior_color": "string",
    "interior_material": "string",
    "first_registration": "string",
    "mileage": number,
    "previous_owners": number,
    "accident_free": boolean
  },
  "technical": {
    "fuel_type": "string",
    "transmission": "string",
    "power_kw": number,
    "power_ps": number,
    "fuel_consumption_combined": number,
    "co2_emissions": number,
    "emission_class": "string",
    "battery_capacity_gross": number,
    "electric_range": number
  },
  "pricing": {
    "list_price_gross": number,
    "monthly_rate": number,
    "duration_months": number,
    "down_payment": number,
    "annual_mileage": number
  },
  "dealer": {
    "dealer_name": "string",
    "dealer_city": "string",
    "contact_person": "string"
  },
  "equipment": ["string"],
  "availability": "string"
}

TEXT ZUR ANALYSE:
${rawText}
`

    try {
      console.log('[Field Extractor] Starting comprehensive extraction for landingpage...')
      
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.1,
        system: 'Du bist ein Experte für die Extraktion von Fahrzeugdaten aus deutschen Angebots-PDFs. Antworte NUR mit validem JSON.',
        messages: [{ role: 'user', content: prompt }]
      })

      const content = response.content[0]
      if (content.type === 'text') {
        // JSON aus der Antwort extrahieren
        const jsonMatch = content.text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const extractedData = JSON.parse(jsonMatch[0])
          
          return {
            ...extractedData,
            metadata: {
              confidence: this.calculateConfidence(extractedData),
              extraction_timestamp: new Date().toISOString()
            }
          }
        }
      }
      
      throw new Error('No valid JSON in response')
    } catch (error) {
      console.error('[Field Extractor] Extraction failed:', error)
      return {
        metadata: {
          confidence: 0,
          extraction_timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Extrahiert nur fehlende Felder (progressive enhancement)
   */
  static async extractMissingFields(
    rawText: string,
    existingData: ExtractedFields,
    requiredFields: string[]
  ): Promise<ExtractedFields> {
    const missingFields = requiredFields.filter(field => {
      const parts = field.split('.')
      let current: any = existingData
      for (const part of parts) {
        if (!current || current[part] === undefined) return true
        current = current[part]
      }
      return false
    })

    if (missingFields.length === 0) {
      return existingData
    }

    console.log('[Field Extractor] Extracting missing fields:', missingFields)

    const results: any = { ...existingData }
    
    for (const field of missingFields) {
      const value = await this.extractSingleField(rawText, field)
      const parts = field.split('.')
      let current = results
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {}
        current = current[parts[i]]
      }
      current[parts[parts.length - 1]] = value
    }

    return results
  }

  /**
   * Berechnet Confidence Score basierend auf gefundenen Feldern
   */
  private static calculateConfidence(data: any): number {
    const importantFields = [
      'vehicle.make',
      'vehicle.model',
      'technical.fuel_type',
      'pricing.monthly_rate',
      'pricing.list_price_gross'
    ]

    let found = 0
    for (const field of importantFields) {
      const parts = field.split('.')
      let current = data
      let exists = true
      for (const part of parts) {
        if (!current || current[part] === undefined) {
          exists = false
          break
        }
        current = current[part]
      }
      if (exists) found++
    }

    // Basis-Score von gefundenen wichtigen Feldern
    let score = (found / importantFields.length) * 70

    // Bonus für zusätzliche Felder
    if (data.equipment && data.equipment.length > 0) score += 10
    if (data.dealer && data.dealer.dealer_name) score += 10
    if (data.vehicle && data.vehicle.mileage !== undefined) score += 10

    return Math.min(100, Math.round(score))
  }

  /**
   * Validiert extrahierte Daten
   */
  static validateExtractedData(data: ExtractedFields): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Pflichtfelder prüfen
    if (!data.vehicle?.make) errors.push('Marke fehlt')
    if (!data.vehicle?.model) errors.push('Modell fehlt')

    // Plausibilitätsprüfungen
    if (data.technical?.power_ps && data.technical.power_ps > 2000) {
      warnings.push(`Unplausible PS-Zahl: ${data.technical.power_ps}`)
    }

    if (data.vehicle?.mileage && data.vehicle.mileage > 500000) {
      warnings.push(`Sehr hoher Kilometerstand: ${data.vehicle.mileage}`)
    }

    if (data.pricing?.monthly_rate && data.pricing.monthly_rate > 10000) {
      warnings.push(`Sehr hohe Monatsrate: ${data.pricing.monthly_rate}€`)
    }

    if (data.technical?.co2_emissions && data.technical.co2_emissions > 500) {
      warnings.push(`Sehr hohe CO2-Emissionen: ${data.technical.co2_emissions}g/km`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}