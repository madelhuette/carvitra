import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { getFieldMappingService } from '@/lib/services/field-mapping.service'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { step, currentData, extractedData } = await request.json()

    // Create prompt based on step
    const prompt = getPromptForStep(step, extractedData)
    
    // Call Anthropic Claude to extract relevant fields
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      temperature: 0.1,
      system: `Du bist ein Experte für Fahrzeugdaten-Extraktion. 
        Extrahiere die relevanten Felder aus den bereitgestellten Daten und gib sie im angeforderten JSON-Format zurück.
        Wenn ein Feld nicht gefunden werden kann, lasse es weg.
        Konvertiere alle Werte in das korrekte Format (z.B. Zahlen als Zahlen, nicht als Strings).
        Antworte NUR mit einem validen JSON-Objekt, ohne zusätzlichen Text.`,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })

    // Extract JSON from Claude's response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}'
    let result: any = {}
    
    try {
      // Try to parse the response as JSON
      result = JSON.parse(responseText)
    } catch (e) {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      }
    }
    
    // Apply field mapping for select fields
    const mappedResult = await applyFieldMapping(result, step)
    
    // Calculate detailed confidence scores
    const { overallConfidence, fieldConfidences } = calculateDetailedConfidence(mappedResult, step)
    
    return NextResponse.json({
      fields: mappedResult.fields,
      confidence: overallConfidence,
      fieldConfidences,
      fieldsIdentified: Object.keys(mappedResult.fields).length,
      mappingResults: mappedResult.mappingResults
    })
    
  } catch (error) {
    console.error('Auto-fill error:', error)
    return NextResponse.json(
      { error: 'Failed to auto-fill fields' },
      { status: 500 }
    )
  }
}

function getPromptForStep(step: number, extractedData: any): string {
  const aiData = extractedData?.ai_extracted || {}
  const rawText = extractedData?.raw_text || ''
  
  switch (step) {
    case 1: // Fahrzeugdaten
      return `
        Basierend auf diesen extrahierten Daten:
        ${JSON.stringify(aiData, null, 2)}
        
        Und diesem Rohtext (erste 2000 Zeichen):
        ${rawText.substring(0, 2000)}
        
        Extrahiere folgende Felder für Step 1 (Fahrzeugdaten):
        {
          "make_name": "Marke als Text (z.B. BMW, Mercedes-Benz, Audi)",
          "model": "Modellbezeichnung",
          "trim": "Ausstattungsvariante falls vorhanden",
          "vehicle_category_name": "Fahrzeugkategorie als Text (z.B. SUV, Limousine, Kombi)",
          "vehicle_type_name": "Fahrzeugtyp als Text"
        }
        
        WICHTIG: Gib die Marke und Kategorien als Text zurück, nicht als IDs.
        Gib nur die gefundenen Felder als JSON zurück.
      `
      
    case 2: // Technische Details
      return `
        Basierend auf diesen extrahierten Daten:
        ${JSON.stringify(aiData, null, 2)}
        
        Extrahiere folgende Felder für Step 2 (Technische Details):
        {
          "fuel_type_name": "Kraftstoffart als Text (z.B. Benzin, Diesel, Elektro, Hybrid)",
          "transmission_type_name": "Getriebeart als Text (z.B. Automatik, Manuell)",
          "power_ps": "Leistung in PS als Zahl",
          "power_kw": "Leistung in KW als Zahl",
          "displacement": "Hubraum in ccm als Zahl",
          "cylinder_count": "Anzahl Zylinder als Zahl",
          "fuel_consumption_fossil": "Kraftstoffverbrauch als Zahl",
          "fuel_consumption_electric": "Stromverbrauch als Zahl",
          "co2_emissions": "CO2-Emissionen als Zahl",
          "emission_class": "Emissionsklasse als String",
          "battery_capacity_gross": "Batteriekapazität brutto als Zahl",
          "battery_capacity_usable": "Batteriekapazität nutzbar als Zahl"
        }
        
        WICHTIG: Gib Kraftstoffart und Getriebe als Text zurück, nicht als IDs.
        Gib nur die gefundenen Felder als JSON zurück.
      `
      
    case 3: // Ausstattung & Farben
      return `
        Basierend auf diesen extrahierten Daten:
        ${JSON.stringify(aiData, null, 2)}
        
        Extrahiere folgende Felder für Step 3 (Ausstattung):
        {
          "exterior_color": "Außenfarbe",
          "interior_color": "Innenraumfarbe",
          "interior_material": "Innenraummaterial",
          "door_count": "Anzahl Türen als Zahl",
          "seat_count": "Anzahl Sitzplätze als Zahl"
        }
        
        Gib nur die gefundenen Felder als JSON zurück.
      `
      
    case 4: // Verfügbarkeit & Preise
      return `
        Basierend auf diesen extrahierten Daten:
        ${JSON.stringify(aiData, null, 2)}
        
        Extrahiere folgende Felder für Step 4 (Verfügbarkeit & Preise):
        {
          "list_price_gross": "Bruttopreis als Zahl",
          "list_price_net": "Nettopreis als Zahl",
          "availability_date": "Verfügbarkeitsdatum im Format YYYY-MM-DD",
          "first_registration": "Erstzulassung im Format YYYY-MM-DD",
          "mileage_count": "Kilometerstand als Zahl",
          "owner_count": "Anzahl Vorbesitzer als Zahl",
          "accident_free": "Unfallfrei als boolean (true/false)"
        }
        
        Gib nur die gefundenen Felder als JSON zurück.
      `
      
    case 5: // Finanzierung
      return `
        Basierend auf diesen extrahierten Daten:
        ${JSON.stringify(aiData, null, 2)}
        
        Extrahiere Finanzierungsangebote für Step 5:
        {
          "financing_available": true,
          "credit_offers": [
            {
              "institution_name": "Name der Bank/Leasinggesellschaft",
              "credit_type": "Leasing oder Finanzierung",
              "duration_months": "Laufzeit in Monaten als Zahl",
              "down_payment": "Anzahlung als Zahl",
              "monthly_rate": "Monatsrate als Zahl",
              "final_rate": "Schlussrate als Zahl",
              "total_amount": "Gesamtbetrag als Zahl",
              "interest_rate": "Zinssatz als Zahl",
              "km_per_year": "Kilometer pro Jahr als Zahl"
            }
          ]
        }
        
        Wenn keine Finanzierung gefunden wird, gib {"financing_available": false} zurück.
        
        Gib nur die gefundenen Felder als JSON zurück.
      `
      
    case 7: // Marketing
      return `
        Basierend auf den Fahrzeugdaten:
        Marke: ${aiData.vehicle?.make}
        Modell: ${aiData.vehicle?.model}
        Variante: ${aiData.vehicle?.variant}
        Preis: ${aiData.pricing?.list_price_gross}
        Leasingrate: ${aiData.leasing?.monthly_rate}
        
        Erstelle Marketing-Texte für eine Landing Page:
        {
          "seo_title": "SEO-optimierter Titel (max 60 Zeichen)",
          "seo_description": "SEO-Beschreibung (max 160 Zeichen)",
          "marketing_headline": "Ansprechende Headline für die Landing Page",
          "marketing_description": "Verkaufsstarke Beschreibung (2-3 Sätze)",
          "slug": "url-slug-ohne-sonderzeichen"
        }
        
        Gib nur die Marketing-Texte als JSON zurück.
      `
      
    default:
      return ''
  }
}

async function applyFieldMapping(result: any, step: number): Promise<{ fields: any, mappingResults: any }> {
  const mappingService = getFieldMappingService()
  const mappedFields = { ...result }
  const mappingResults: any = {}
  
  // Define mapping requirements per step
  if (step === 1) {
    // Map make_name to make_id
    if (result.make_name) {
      const makeMapping = await mappingService.mapToId('makes', result.make_name)
      if (makeMapping.id) {
        mappedFields.make_id = makeMapping.id
        delete mappedFields.make_name
        mappingResults.make = makeMapping
      }
    }
    
    // Map vehicle_category_name to vehicle_category_id
    if (result.vehicle_category_name) {
      const categoryMapping = await mappingService.mapToId('vehicle_categories', result.vehicle_category_name)
      if (categoryMapping.id) {
        mappedFields.vehicle_category_id = categoryMapping.id
        delete mappedFields.vehicle_category_name
        mappingResults.vehicle_category = categoryMapping
      }
    }
    
    // Map vehicle_type_name to vehicle_type_id
    if (result.vehicle_type_name) {
      const typeMapping = await mappingService.mapToId('vehicle_types', result.vehicle_type_name)
      if (typeMapping.id) {
        mappedFields.vehicle_type_id = typeMapping.id
        delete mappedFields.vehicle_type_name
        mappingResults.vehicle_type = typeMapping
      }
    }
  }
  
  if (step === 2) {
    // Map fuel_type_name to fuel_type_id
    if (result.fuel_type_name) {
      const fuelMapping = await mappingService.mapToId('fuel_types', result.fuel_type_name)
      if (fuelMapping.id) {
        mappedFields.fuel_type_id = fuelMapping.id
        delete mappedFields.fuel_type_name
        mappingResults.fuel_type = fuelMapping
      }
    }
    
    // Map transmission_type_name to transmission_type_id
    if (result.transmission_type_name) {
      const transmissionMapping = await mappingService.mapToId('transmission_types', result.transmission_type_name)
      if (transmissionMapping.id) {
        mappedFields.transmission_type_id = transmissionMapping.id
        delete mappedFields.transmission_type_name
        mappingResults.transmission_type = transmissionMapping
      }
    }
  }
  
  if (step === 4) {
    // Map availability_type_name to availability_type_id if present
    if (result.availability_type_name) {
      const availabilityMapping = await mappingService.mapToId('availability_types', result.availability_type_name)
      if (availabilityMapping.id) {
        mappedFields.availability_type_id = availabilityMapping.id
        delete mappedFields.availability_type_name
        mappingResults.availability_type = availabilityMapping
      }
    }
  }
  
  return { fields: mappedFields, mappingResults }
}

function calculateDetailedConfidence(mappedResult: any, step: number): { overallConfidence: number, fieldConfidences: Record<string, number> } {
  const fieldConfidences: Record<string, number> = {}
  const fields = mappedResult.fields
  const mappingResults = mappedResult.mappingResults || {}
  
  // Base confidence for each field type
  const baseConfidence: Record<string, number> = {
    // High confidence for direct numeric/text fields
    model: 95,
    trim: 85,
    power_ps: 90,
    power_kw: 90,
    displacement: 85,
    cylinder_count: 90,
    fuel_consumption_fossil: 85,
    fuel_consumption_electric: 85,
    co2_emissions: 90,
    emission_class: 80,
    battery_capacity_gross: 85,
    battery_capacity_usable: 85,
    exterior_color: 80,
    interior_color: 80,
    interior_material: 75,
    door_count: 95,
    seat_count: 95,
    list_price_gross: 90,
    list_price_net: 85,
    availability_date: 75,
    first_registration: 85,
    mileage_count: 90,
    owner_count: 85,
    accident_free: 80,
    monthly_rate: 90,
    down_payment: 85,
    duration_months: 90,
    km_per_year: 85,
    interest_rate: 80,
    seo_title: 85,
    seo_description: 85,
    marketing_headline: 80,
    marketing_description: 80,
    slug: 90
  }
  
  // Calculate confidence for each field
  for (const [fieldName, value] of Object.entries(fields)) {
    if (value !== null && value !== undefined) {
      // Check if this is a mapped field
      const mappingKey = fieldName.replace('_id', '')
      if (mappingResults[mappingKey]) {
        // Use mapping confidence
        fieldConfidences[fieldName] = mappingResults[mappingKey].confidence
      } else {
        // Use base confidence or default
        fieldConfidences[fieldName] = baseConfidence[fieldName] || 70
      }
    }
  }
  
  // Calculate overall confidence
  const confidenceValues = Object.values(fieldConfidences)
  const overallConfidence = confidenceValues.length > 0
    ? Math.round(confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length)
    : 0
  
  return { overallConfidence, fieldConfidences }
}

function getExpectedFieldsForStep(step: number): number {
  const expectedCounts: Record<number, number> = {
    1: 5, // make, model, trim, category, type
    2: 12, // fuel, transmission, power, consumption, etc.
    3: 5, // colors, seats, etc.
    4: 7, // prices, dates, etc.
    5: 9, // financing fields
    6: 0, // No AI fill for contacts
    7: 5  // marketing texts
  }
  
  return expectedCounts[step] || 1
}