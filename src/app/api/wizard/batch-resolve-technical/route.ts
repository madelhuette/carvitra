import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic/client'
import { createLogger } from '@/lib/logger'

const logger = createLogger('BatchResolveTechnicalAPI')

export async function POST(request: NextRequest) {
  try {
    const { fields, context } = await request.json()
    
    logger.info('Batch technical field resolution requested', { 
      fieldsCount: fields.length,
      hasContext: !!context,
      vehicleType: context?.vehicleType
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
          logger.info(`🚀 Starting technical field streaming for ${fields.length} fields`)
          
          // Process fields sequentially for true streaming
          const processField = async (field: any, index: number) => {
            try {
              // Small delay between fields to avoid API rate limits
              if (index > 0) {
                await new Promise(resolve => setTimeout(resolve, 100))
              }
              
              logger.debug(`🔍 Resolving technical field ${index + 1}/${fields.length}: ${field.fieldName}`)
              
              // Build prompt based on field type and technical context
              const prompt = buildTechnicalFieldPrompt(field, context)
              
              // Call Claude directly for speed
              const startTime = Date.now()
              const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 100, // Slightly larger for technical values
                temperature: 0.1, // Very low for technical accuracy
                messages: [{
                  role: 'user',
                  content: prompt
                }]
              })

              const content = response.content[0]
              if (content.type === 'text') {
                let value = content.text.trim()
                
                // Parse and validate based on field type
                if (field.fieldType === 'number') {
                  // Extract numeric value from response
                  const numMatch = value.match(/[\d.]+/)
                  if (numMatch) {
                    value = numMatch[0]
                    
                    // Validate against constraints
                    const numValue = parseFloat(value)
                    if (field.constraints) {
                      if (field.constraints.min !== undefined && numValue < field.constraints.min) {
                        value = String(field.constraints.min)
                      }
                      if (field.constraints.max !== undefined && numValue > field.constraints.max) {
                        value = String(field.constraints.max)
                      }
                    }
                  }
                } else if (field.fieldType === 'enum' && field.enumOptions) {
                  // Find best match from enum options
                  const lowerValue = value.toLowerCase()
                  const match = field.enumOptions.find((opt: string) => 
                    opt.toLowerCase() === lowerValue
                  )
                  if (match) {
                    value = match
                  } else {
                    // Try partial match
                    const partialMatch = field.enumOptions.find((opt: string) =>
                      opt.toLowerCase().includes(lowerValue) || lowerValue.includes(opt.toLowerCase())
                    )
                    if (partialMatch) {
                      value = partialMatch
                    }
                  }
                }
                
                const responseTime = Date.now() - startTime
                
                // Stream this result IMMEDIATELY
                const result = {
                  field: field.fieldName,
                  value: value,
                  unit: field.unit,
                  confidence: calculateTechnicalConfidence(value, field),
                  responseTime,
                  index: index + 1,
                  total: fields.length
                }
                
                logger.info(`✅ Resolved ${field.fieldName} = "${value}"${field.unit ? ' ' + field.unit : ''} in ${responseTime}ms`)
                
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
          
          logger.info(`🎯 All technical fields processed. Success: ${results.filter(r => r).length}/${fields.length}`)
          
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
    logger.error('Batch technical resolve error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function buildTechnicalFieldPrompt(field: any, context: any): string {
  const { fieldName, fieldType, enumOptions, constraints, unit } = field
  const { extractedData, enrichedData, currentFormData } = context
  
  // Build comprehensive technical context
  const vehicleInfo = []
  
  // Priority 1: Enriched data from Perplexity (most accurate for technical specs)
  if (enrichedData) {
    if (enrichedData.make) vehicleInfo.push(`Marke: ${enrichedData.make}`)
    if (enrichedData.model) vehicleInfo.push(`Modell: ${enrichedData.model}`)
    if (enrichedData.variant) vehicleInfo.push(`Variante: ${enrichedData.variant}`)
    if (enrichedData.year) vehicleInfo.push(`Jahr: ${enrichedData.year}`)
    
    // Technical specs from enrichment
    if (enrichedData.power_ps) vehicleInfo.push(`Leistung: ${enrichedData.power_ps} PS`)
    if (enrichedData.power_kw) vehicleInfo.push(`Leistung: ${enrichedData.power_kw} kW`)
    if (enrichedData.displacement) vehicleInfo.push(`Hubraum: ${enrichedData.displacement} ccm`)
    if (enrichedData.cylinders) vehicleInfo.push(`Zylinder: ${enrichedData.cylinders}`)
    if (enrichedData.fuel_type) vehicleInfo.push(`Kraftstoff: ${enrichedData.fuel_type}`)
    if (enrichedData.transmission) vehicleInfo.push(`Getriebe: ${enrichedData.transmission}`)
    if (enrichedData.co2_emissions) vehicleInfo.push(`CO₂: ${enrichedData.co2_emissions} g/km`)
    if (enrichedData.fuel_consumption) vehicleInfo.push(`Verbrauch: ${enrichedData.fuel_consumption}`)
  }
  
  // Priority 2: Extracted vehicle data
  if (extractedData?.vehicle) {
    const vehicle = extractedData.vehicle
    if (vehicle.make && !enrichedData?.make) {
      vehicleInfo.push(`Marke: ${vehicle.make}`)
    }
    if (vehicle.model && !enrichedData?.model) {
      vehicleInfo.push(`Modell: ${vehicle.model}`)
    }
    if (vehicle.power_ps && !enrichedData?.power_ps) {
      vehicleInfo.push(`Leistung: ${vehicle.power_ps} PS`)
    }
    if (vehicle.power_kw && !enrichedData?.power_kw) {
      vehicleInfo.push(`Leistung: ${vehicle.power_kw} kW`)
    }
  }
  
  // Priority 3: Raw text for additional context
  if (extractedData?.raw_text) {
    const preview = extractedData.raw_text.substring(0, 1000)
    vehicleInfo.push(`PDF-Text: ${preview}...`)
  }
  
  // Add current form data for context
  if (currentFormData) {
    if (currentFormData.fuel_type_id) {
      vehicleInfo.push(`Bereits erfasst: Kraftstoffart gewählt`)
    }
  }
  
  logger.debug(`Building technical prompt for ${fieldName}`, {
    hasEnrichedData: !!enrichedData,
    hasExtractedData: !!extractedData,
    vehicleInfoCount: vehicleInfo.length,
    enumOptionsCount: enumOptions?.length || 0,
    constraints
  })
  
  // Build field-specific prompts
  let fieldSpecificInstructions = ''
  
  switch (fieldName) {
    case 'power_ps':
      fieldSpecificInstructions = `
Ermittle die Motorleistung in PS (Pferdestärken).
Typische Werte: Kleinwagen 60-100 PS, Kompakt 100-150 PS, Mittelklasse 150-250 PS, Oberklasse 250-500 PS, Sportwagen 300-700 PS.
${constraints ? `Gültige Range: ${constraints.min}-${constraints.max} PS` : ''}
WICHTIG: Antworte NUR mit der Zahl (z.B. "340"), OHNE Einheit.`
      break
      
    case 'power_kw':
      fieldSpecificInstructions = `
Ermittle die Motorleistung in kW (Kilowatt).
Umrechnung: 1 PS = 0.735499 kW, 1 kW = 1.35962 PS
Typische Werte: Kleinwagen 45-75 kW, Kompakt 75-110 kW, Mittelklasse 110-185 kW, Oberklasse 185-370 kW.
${constraints ? `Gültige Range: ${constraints.min}-${constraints.max} kW` : ''}
WICHTIG: Antworte NUR mit der Zahl (z.B. "250"), OHNE Einheit.`
      break
      
    case 'displacement':
      fieldSpecificInstructions = `
Ermittle den Hubraum des Motors in ccm (Kubikzentimeter).
Typische Werte: Kleinwagen 900-1400 ccm, Kompakt 1400-2000 ccm, Mittelklasse 2000-3000 ccm, Oberklasse 3000-5000 ccm.
${constraints ? `Gültige Range: ${constraints.min}-${constraints.max} ccm` : ''}
WICHTIG: Antworte NUR mit der Zahl (z.B. "1998"), OHNE Einheit.`
      break
      
    case 'cylinder_count':
      fieldSpecificInstructions = `
Ermittle die Anzahl der Zylinder.
Typisch: 3-Zylinder (Kleinwagen), 4-Zylinder (Standard), 6-Zylinder (gehobene Klasse), 8-Zylinder (Oberklasse/Sport), 12-Zylinder (Supersport).
${constraints ? `Gültige Range: ${constraints.min}-${constraints.max}` : ''}
WICHTIG: Antworte NUR mit der Zahl (z.B. "6"), OHNE Text.`
      break
      
    case 'co2_emissions':
      fieldSpecificInstructions = `
Ermittle die CO₂-Emissionen in g/km.
Typische Werte: Elektro 0 g/km, Hybrid 50-100 g/km, Benzin 100-200 g/km, Diesel 90-180 g/km, SUV 150-250 g/km.
${constraints ? `Gültige Range: ${constraints.min}-${constraints.max} g/km` : ''}
WICHTIG: Antworte NUR mit der Zahl (z.B. "120"), OHNE Einheit.`
      break
      
    case 'fuel_consumption_fossil':
      fieldSpecificInstructions = `
Ermittle den Kraftstoffverbrauch (kombiniert) in Liter pro 100km.
Typische Werte: Kleinwagen 4-6 l/100km, Kompakt 5-7 l/100km, Mittelklasse 6-9 l/100km, SUV 8-12 l/100km.
${constraints ? `Gültige Range: ${constraints.min}-${constraints.max} l/100km` : ''}
WICHTIG: Antworte NUR mit der Zahl (z.B. "7.5"), OHNE Einheit.`
      break
      
    case 'fuel_consumption_electric':
      fieldSpecificInstructions = `
Ermittle den Stromverbrauch in kWh pro 100km.
Typische Werte: Kleinwagen 12-16 kWh/100km, Kompakt 15-20 kWh/100km, SUV 20-30 kWh/100km.
${constraints ? `Gültige Range: ${constraints.min}-${constraints.max} kWh/100km` : ''}
WICHTIG: Antworte NUR mit der Zahl (z.B. "18.5"), OHNE Einheit.`
      break
      
    case 'battery_capacity_gross':
      fieldSpecificInstructions = `
Ermittle die Brutto-Batteriekapazität in kWh.
Typische Werte: Kleinwagen 20-40 kWh, Kompakt 40-60 kWh, Mittelklasse 60-90 kWh, Oberklasse 90-120 kWh.
${constraints ? `Gültige Range: ${constraints.min}-${constraints.max} kWh` : ''}
WICHTIG: Antworte NUR mit der Zahl (z.B. "75.0"), OHNE Einheit.`
      break
      
    case 'battery_capacity_usable':
      fieldSpecificInstructions = `
Ermittle die nutzbare Batteriekapazität in kWh (typisch 90-95% der Bruttokapazität).
${constraints ? `Gültige Range: ${constraints.min}-${constraints.max} kWh` : ''}
WICHTIG: Antworte NUR mit der Zahl (z.B. "70.0"), OHNE Einheit.`
      break
      
    case 'emission_class':
      fieldSpecificInstructions = `
Bestimme die Energieeffizienzklasse (A bis G).
A = sehr effizient (meist Elektro/Hybrid)
B-C = effizient (sparsame Verbrenner)
D-E = durchschnittlich
F-G = weniger effizient (große/alte Verbrenner)
WICHTIG: Antworte NUR mit EINEM Buchstaben (A, B, C, D, E, F oder G).`
      break
      
    case 'transmission_type':
      fieldSpecificInstructions = `
Bestimme die Getriebeart aus dieser Liste:
${enumOptions ? enumOptions.map((opt: string) => `- ${opt}`).join('\n') : ''}

Hinweise: "Automatik" für Automatikgetriebe, "Manuell" für Schaltgetriebe, "DSG" für Doppelkupplungsgetriebe.
WICHTIG: Antworte NUR mit EINER Option aus der obigen Liste.`
      break
  }
  
  // Build final prompt
  if (fieldType === 'enum' && enumOptions?.length > 0) {
    return `${vehicleInfo.length > 0 ? `Fahrzeugkontext:\n${vehicleInfo.join('\n')}\n\n` : ''}
${fieldSpecificInstructions}

${fieldName !== 'emission_class' && fieldName !== 'transmission_type' ? `Optionen:\n${enumOptions.map((opt: string) => `- ${opt}`).join('\n')}\n\nWICHTIG: Wähle GENAU EINE Option aus der Liste.` : ''}
Bei Unsicherheit wähle die wahrscheinlichste Option basierend auf dem Kontext.`
  }
  
  return `${vehicleInfo.length > 0 ? `Fahrzeugkontext:\n${vehicleInfo.join('\n')}\n\n` : ''}
${fieldSpecificInstructions}
Bei Unsicherheit gib einen typischen Wert für dieses Fahrzeug an.`
}

function calculateTechnicalConfidence(value: string, field: any): number {
  if (!value) return 0
  
  // Higher confidence for fields with enriched data
  const baseConfidence = 85
  
  // For enum fields, check if value is in options
  if (field.enumOptions && field.enumOptions.length > 0) {
    const exactMatch = field.enumOptions.some((opt: string) => 
      opt.toLowerCase() === value.toLowerCase()
    )
    return exactMatch ? 95 : 75
  }
  
  // For numeric fields, higher confidence if within typical ranges
  if (field.fieldType === 'number' && field.constraints) {
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      if (numValue >= field.constraints.min && numValue <= field.constraints.max) {
        return 90
      }
    }
  }
  
  return baseConfidence
}