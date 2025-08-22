import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic/client'
import { createLogger } from '@/lib/logger'

const logger = createLogger('BatchResolveAPI')

export async function POST(request: NextRequest) {
  try {
    const { fields, context } = await request.json()
    
    logger.info('Batch field resolution requested', { 
      fieldsCount: fields.length,
      hasContext: !!context 
    })

    // Validate input
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json(
        { error: 'Fields array is required' },
        { status: 400 }
      )
    }

    if (!context || !context.extractedData) {
      return NextResponse.json(
        { error: 'Context with extractedData is required' },
        { status: 400 }
      )
    }

    // Create streaming response with REAL progressive updates
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          logger.info(`🚀 Starting REAL streaming for ${fields.length} fields`)
          
          // Process fields sequentially for true streaming
          // But launch them with slight delays for perceived speed
          const processField = async (field: any, index: number) => {
            try {
              // Small delay between fields to avoid API rate limits
              if (index > 0) {
                await new Promise(resolve => setTimeout(resolve, 100))
              }
              
              logger.debug(`🔍 Resolving field ${index + 1}/${fields.length}: ${field.fieldName}`)
              
              // Build prompt based on field type
              const prompt = buildFieldPrompt(field, context)
              
              // Call Claude directly for speed
              const startTime = Date.now()
              const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 50, // Small response needed
                temperature: 0.2, // Low for consistency
                messages: [{
                  role: 'user',
                  content: prompt
                }]
              })

              const content = response.content[0]
              if (content.type === 'text') {
                const value = content.text.trim()
                const responseTime = Date.now() - startTime
                
                // Stream this result IMMEDIATELY
                const result = {
                  field: field.fieldName,
                  value: value,
                  confidence: calculateConfidence(value, field.enumOptions),
                  responseTime,
                  index: index + 1,
                  total: fields.length
                }
                
                logger.info(`✅ Resolved ${field.fieldName} = "${value}" in ${responseTime}ms`)
                
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(result)}\n\n`)
                )
                
                return result
              }
            } catch (error) {
              logger.error(`❌ Failed to resolve ${field.fieldName}:`, error)
              
              // Stream error for this field
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  field: field.fieldName,
                  error: true,
                  message: error instanceof Error ? error.message : 'Unknown error'
                })}\n\n`)
              )
              
              return null
            }
          }

          // Process fields with staggered starts for immediate feedback
          const results = []
          for (let i = 0; i < fields.length; i++) {
            const result = await processField(fields[i], i)
            results.push(result)
          }
          
          logger.info(`🎯 All fields processed. Success: ${results.filter(r => r).length}/${fields.length}`)
          
          // Send completion signal
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              complete: true,
              totalProcessed: results.length,
              successCount: results.filter(r => r).length
            })}\n\n`)
          )
          
          controller.close()
          
        } catch (error) {
          logger.error('❌ Fatal stream error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
    
  } catch (error) {
    logger.error('Batch resolve error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function buildFieldPrompt(field: any, context: any): string {
  const { fieldName, fieldType, enumOptions } = field
  const { extractedData, enrichedData } = context
  
  // Build comprehensive context info
  const vehicleInfo = []
  
  // Priority 1: Enriched data from Perplexity
  if (enrichedData) {
    if (enrichedData.make) vehicleInfo.push(`Marke: ${enrichedData.make}`)
    if (enrichedData.model) vehicleInfo.push(`Modell: ${enrichedData.model}`)
    if (enrichedData.variant) vehicleInfo.push(`Variante: ${enrichedData.variant}`)
    if (enrichedData.year) vehicleInfo.push(`Jahr: ${enrichedData.year}`)
  }
  
  // Priority 2: Extracted vehicle data
  if (extractedData?.vehicle) {
    if (extractedData.vehicle.make && !enrichedData?.make) {
      vehicleInfo.push(`Marke: ${extractedData.vehicle.make}`)
    }
    if (extractedData.vehicle.model && !enrichedData?.model) {
      vehicleInfo.push(`Modell: ${extractedData.vehicle.model}`)
    }
    if (extractedData.vehicle.variant) {
      vehicleInfo.push(`Variante: ${extractedData.vehicle.variant}`)
    }
  }
  
  // Priority 3: Raw text for additional context
  if (extractedData?.raw_text) {
    const preview = extractedData.raw_text.substring(0, 800)
    vehicleInfo.push(`Zusatzinfo: ${preview}...`)
  }
  
  logger.debug(`Building prompt for ${fieldName}`, {
    hasEnrichedData: !!enrichedData,
    hasExtractedData: !!extractedData,
    vehicleInfoCount: vehicleInfo.length,
    enumOptionsCount: enumOptions?.length || 0
  })
  
  // Build prompt based on field type with better context
  if (fieldType === 'enum' && enumOptions?.length > 0) {
    // Special handling for each field type
    let contextHint = ''
    
    if (fieldName === 'vehicle_type') {
      contextHint = '\n\nHinweis: Wähle den Karosserie-Typ (z.B. SUV für X5, Limousine für 3er, Kombi für Touring, Coupé für 2-Türer, Cabrio für offene Fahrzeuge, Van für Familienautos, Pickup für Nutzfahrzeuge, Crossover für kompakte SUVs wie T-Cross).'
    } else if (fieldName === 'fuel_type') {
      contextHint = '\n\nHinweis: Wähle die Kraftstoffart (Benzin, Diesel, Elektro, Hybrid, Plug-in-Hybrid, etc.).'
    } else if (fieldName === 'offer_type') {
      contextHint = '\n\nHinweis: Wähle Neuwagen für fabrikneue Fahrzeuge, Gebrauchtwagen für gebrauchte Fahrzeuge.'
    }
    
    return `${vehicleInfo.length > 0 ? `Fahrzeugkontext:\n${vehicleInfo.join('\n')}\n\n` : ''}
Bitte wähle die passende Option für "${fieldName}" aus dieser Liste:
${enumOptions.map((opt: string) => `- ${opt}`).join('\n')}
${contextHint}

WICHTIG: Antworte NUR mit EINER Option aus der obigen Liste. KEINE Erklärung.
Bei Unsicherheit wähle die wahrscheinlichste Option basierend auf dem Kontext.`
  }
  
  return `${vehicleInfo.length > 0 ? `Fahrzeugkontext:\n${vehicleInfo.join('\n')}\n\n` : ''}
Was ist der Wert für "${fieldName}"?
Antworte NUR mit dem Wert, keine Erklärung.`
}

function calculateConfidence(value: string, enumOptions?: string[]): number {
  if (!value) return 0
  
  // For enum fields, check if value is in options
  if (enumOptions && enumOptions.length > 0) {
    const exactMatch = enumOptions.some(opt => 
      opt.toLowerCase() === value.toLowerCase()
    )
    return exactMatch ? 95 : 70
  }
  
  // For other fields, base confidence on value presence
  return value.length > 0 ? 85 : 50
}