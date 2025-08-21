import { anthropic } from '@/lib/anthropic/client'
import { createLogger } from '@/lib/logger'

const logger = createLogger('AIExtractionService')

// Typen für die extrahierten Daten
export interface ExtractedVehicleData {
  // Fahrzeugdaten
  vehicle: {
    make?: string
    model?: string
    variant?: string
    year?: number
    mileage?: number
    fuel_type?: string
    transmission?: string
    power_kw?: number
    power_ps?: number
    color?: string
    doors?: number
    seats?: number
    first_registration?: string
  }
  
  // Leasingkonditionen
  leasing: {
    monthly_rate?: number
    duration_months?: number
    annual_mileage?: number
    down_payment?: number
    final_payment?: number
    total_cost?: number
    interest_rate?: number
  }
  
  // Händlerinformationen
  dealer: {
    name?: string
    address?: string
    city?: string
    postal_code?: string
    phone?: string
    email?: string
    contact_person?: string
  }
  
  // Zusatzleistungen
  services: {
    insurance_included?: boolean
    maintenance_included?: boolean
    tires_included?: boolean
    gap_protection?: boolean
    warranty_extension?: boolean
  }
  
  // Metadaten
  metadata: {
    confidence_score: number
    extraction_date: string
    model_used: string
    tokens_used?: number
    error?: string
  }
}

export class AIExtractionService {
  private static readonly SYSTEM_PROMPT = `Du bist ein Experte für die Analyse von deutschen Fahrzeug-Leasing- und Verkaufs-PDFs. 

Deine Aufgabe ist es, aus dem gegebenen PDF-Text alle relevanten Fahrzeug- und Leasingdaten strukturiert zu extrahieren und als JSON zurückzugeben.

WICHTIGE REGELN:
- Alle Preise in Euro (ohne Währungssymbol, nur Zahlen)
- Kilometerangaben ohne Punkte (123000 statt 123.000)
- Leistung sowohl in kW als auch PS wenn verfügbar
- Deutsche Begriffe korrekt interpretieren (z.B. "mtl." = monatlich, "EZ" = Erstzulassung)
- Bei Unsicherheit: null verwenden
- Confidence Score: 0-100 basierend auf Textqualität und gefundenen Daten

Extrahiere nur Daten, die eindeutig im Text stehen. Rate oder erfinde nichts.`

  private static readonly USER_PROMPT = `Analysiere diesen PDF-Text und extrahiere alle Fahrzeug- und Leasingdaten im folgenden JSON-Schema:

{
  "vehicle": {
    "make": "string | null",
    "model": "string | null", 
    "variant": "string | null",
    "year": "number | null",
    "mileage": "number | null",
    "fuel_type": "string | null",
    "transmission": "string | null",
    "power_kw": "number | null",
    "power_ps": "number | null",
    "color": "string | null",
    "doors": "number | null",
    "seats": "number | null",
    "first_registration": "string | null"
  },
  "leasing": {
    "monthly_rate": "number | null",
    "duration_months": "number | null", 
    "annual_mileage": "number | null",
    "down_payment": "number | null",
    "final_payment": "number | null",
    "total_cost": "number | null",
    "interest_rate": "number | null"
  },
  "dealer": {
    "name": "string | null",
    "address": "string | null",
    "city": "string | null",
    "postal_code": "string | null",
    "phone": "string | null", 
    "email": "string | null",
    "contact_person": "string | null"
  },
  "services": {
    "insurance_included": "boolean | null",
    "maintenance_included": "boolean | null",
    "tires_included": "boolean | null",
    "gap_protection": "boolean | null",
    "warranty_extension": "boolean | null"
  },
  "metadata": {
    "confidence_score": "number (0-100)",
    "extraction_date": "ISO string",
    "model_used": "claude-3-sonnet-20241022"
  }
}

PDF-Text zur Analyse:

`

  /**
   * Extrahiert strukturierte Daten aus PDF-Text mit Claude Sonnet
   */
  static async extractVehicleData(
    pdfText: string,
    options: {
      maxTokens?: number
      temperature?: number
      timeout?: number
      maxRetries?: number
    } = {}
  ): Promise<ExtractedVehicleData> {
    const { 
      maxTokens = 2000, 
      temperature = 0.1,
      timeout = 30000, // 30 Sekunden Timeout
      maxRetries = 2 
    } = options

    // Prüfe ob Text leer oder zu kurz ist
    if (!pdfText || pdfText.trim().length < 50) {
      logger.warn('Text too short or empty', { length: pdfText?.length || 0 })
      return {
        vehicle: {},
        leasing: {},
        dealer: {},
        services: {},
        metadata: {
          confidence_score: 0,
          extraction_date: new Date().toISOString(),
          model_used: 'claude-3-5-sonnet-20241022',
          error: 'Text too short or empty for meaningful extraction'
        },
      }
    }

    // Text kürzen wenn zu lang (max 10000 Zeichen für API)
    const maxTextLength = 10000
    const truncatedText = pdfText.length > maxTextLength 
      ? pdfText.substring(0, maxTextLength) + '\n\n[TEXT GEKÜRZT]'
      : pdfText

    logger.info('Processing text', { 
      originalLength: pdfText.length,
      truncated: pdfText.length > maxTextLength 
    })

    // Retry-Logik mit exponential backoff
    let lastError: any
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.debug(`Calling Claude API (Attempt ${attempt}/${maxRetries})`)
        
        // AbortController für Timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)
        
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: maxTokens,
          temperature: temperature,
          system: this.SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: this.USER_PROMPT + truncatedText,
            },
          ],
        }, {
          signal: controller.signal as any
        })
        
        clearTimeout(timeoutId)

        logger.debug('Claude API response received', { 
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens 
        })

        const content = response.content[0]
        if (content.type !== 'text') {
          throw new Error('Unexpected response format from Claude')
        }

        // JSON aus der Antwort extrahieren
        const jsonMatch = content.text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          logger.error('No JSON found in response', { 
            responsePreview: content.text.substring(0, 500) 
          })
          throw new Error('No JSON found in Claude response')
        }

        logger.debug('Parsing JSON response')
        const extractedData = JSON.parse(jsonMatch[0]) as Omit<ExtractedVehicleData, 'metadata'>
        
        // Metadaten hinzufügen
        const result: ExtractedVehicleData = {
          ...extractedData,
          metadata: {
            confidence_score: extractedData.metadata?.confidence_score || 50,
            extraction_date: new Date().toISOString(),
            model_used: 'claude-3-5-sonnet-20241022',
            tokens_used: response.usage.input_tokens + response.usage.output_tokens,
          },
        }

        logger.info('Extraction successful', {
          vehicle: `${result.vehicle?.make} ${result.vehicle?.model}`,
          confidence: result.metadata.confidence_score
        })
        
        return result

      } catch (error: any) {
        lastError = error
        logger.error(`Attempt ${attempt} failed`, { 
          error: error.message,
          code: error.code 
        })
        
        // Bei Timeout oder Netzwerkfehler: Retry mit Backoff
        if (error.name === 'AbortError' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
          if (attempt < maxRetries) {
            const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000) // Max 10s wait
            logger.info(`Waiting ${waitTime}ms before retry`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
            continue
          }
        }
        
        // Bei API-Key-Fehler: Sofort abbrechen
        if (error.status === 401) {
          logger.error('API Key authentication failed - check ANTHROPIC_API_KEY')
          break
        }
        
        // Bei anderen Fehlern: Nach letztem Versuch abbrechen
        if (attempt === maxRetries) {
          break
        }
      }
    }
    
    // Alle Versuche fehlgeschlagen
    logger.error('All extraction attempts failed', {
      error: lastError?.message,
      errorType: lastError?.constructor.name
    })
    
    // Fallback: Leere Struktur mit niedrigem Confidence Score
    return {
      vehicle: {},
      leasing: {},
      dealer: {},
      services: {},
      metadata: {
        confidence_score: 0,
        extraction_date: new Date().toISOString(),
        model_used: 'claude-3-5-sonnet-20241022',
        error: lastError?.message || 'Unknown error'
      },
    }
  }

  /**
   * Validiert extrahierte Daten auf Plausibilität
   */
  static validateExtractedData(data: ExtractedVehicleData): {
    isValid: boolean
    warnings: string[]
    errors: string[]
  } {
    const warnings: string[] = []
    const errors: string[] = []

    // Fahrzeugdaten validieren
    if (data.vehicle.year && (data.vehicle.year < 1990 || data.vehicle.year > new Date().getFullYear() + 1)) {
      warnings.push(`Unplausibles Baujahr: ${data.vehicle.year}`)
    }

    if (data.vehicle.mileage && data.vehicle.mileage > 500000) {
      warnings.push(`Sehr hoher Kilometerstand: ${data.vehicle.mileage} km`)
    }

    if (data.vehicle.power_kw && data.vehicle.power_ps) {
      const calculatedPs = Math.round(data.vehicle.power_kw * 1.36)
      const difference = Math.abs(calculatedPs - data.vehicle.power_ps)
      if (difference > 5) {
        warnings.push(`kW/PS-Werte stimmen nicht überein: ${data.vehicle.power_kw}kW ≠ ${data.vehicle.power_ps}PS`)
      }
    }

    // Leasingdaten validieren
    if (data.leasing.monthly_rate && (data.leasing.monthly_rate < 50 || data.leasing.monthly_rate > 5000)) {
      warnings.push(`Unplausible Monatsrate: ${data.leasing.monthly_rate}€`)
    }

    if (data.leasing.duration_months && (data.leasing.duration_months < 6 || data.leasing.duration_months > 96)) {
      warnings.push(`Unplausible Laufzeit: ${data.leasing.duration_months} Monate`)
    }

    if (data.leasing.annual_mileage && (data.leasing.annual_mileage < 5000 || data.leasing.annual_mileage > 100000)) {
      warnings.push(`Unplausible Jahreskilometer: ${data.leasing.annual_mileage} km`)
    }

    // Confidence Score prüfen
    if (data.metadata.confidence_score < 30) {
      warnings.push('Niedrige Extraktionsqualität - manuelle Überprüfung empfohlen')
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    }
  }
}