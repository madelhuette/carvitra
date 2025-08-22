'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/base/input/input'
import { Select } from '@/components/base/select/select'
import { Label } from '@/components/base/input/label'
import { useWizardContext } from '../wizard-context'
import { createClient } from '@/lib/supabase/client'
import { useAutoAnalysis } from '@/hooks/useAutoAnalysis'
import { SkeletonInput, SkeletonSelect } from '@/components/base/skeleton/skeleton'
import { AnalysisBadge } from '../analysis-badge'
import { SmartFieldService } from '@/services/smart-field.service'
import type { SmartFieldResult } from '@/services/smart-field.service'

export function StepVehicleBasics() {
  const { formData, updateFormData, autoFillWithAI, extractedData, setAnalysisState, stepAnalysisCompleted, pdfDocumentId, aiFilledFields } = useWizardContext()
  const [makes, setMakes] = useState<any[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([])
  const [offerTypes, setOfferTypes] = useState<any[]>([])
  const [fuelTypes, setFuelTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [smartSuggestions, setSmartSuggestions] = useState<Record<string, SmartFieldResult>>({})
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  
  // Individueller Loading-State für jedes KI-analysierte Feld
  const [fieldLoadingStates, setFieldLoadingStates] = useState<Record<string, boolean>>({
    vehicle_type_id: false,
    fuel_type_id: false,
    offer_type_id: false
  })
  
  const supabase = createClient()
  
  // Auto-Analyse nur beim ersten Betreten des Steps
  const hasBasicData = !!(formData.model && formData.make_id && formData.offer_type_id)
  const { isAnalyzing, fieldsIdentified, confidence, error: analysisError } = useAutoAnalysis({
    stepNumber: 1,
    extractedData,
    autoFillFunction: autoFillWithAI,
    skipIfDataExists: hasBasicData || stepAnalysisCompleted[1],
    onAnalysisStart: () => {
      setAnalysisState(true)
    },
    onAnalysisComplete: (fields, conf) => {
      setAnalysisState(false, {
        fieldsIdentified: fields,
        confidence: conf || 85,
        timestamp: new Date()
      })
    },
    onAnalysisError: () => {
      setAnalysisState(false, null)
    }
  })

  // Load select options on mount
  useEffect(() => {
    console.log('🔄 Loading select options on mount...')
    loadSelectOptions()
  }, [])

  // Start KI resolution when options are loaded AND we have PDF data
  useEffect(() => {
    const hasOptions = vehicleTypes.length > 0 && fuelTypes.length > 0 && offerTypes.length > 0
    const hasData = pdfDocumentId && extractedData
    
    if (hasOptions && hasData && !loading) {
      console.log('✅ Options loaded, starting KI resolution...')
      console.log(`   Vehicle types: ${vehicleTypes.length}`)
      console.log(`   Fuel types: ${fuelTypes.length}`)
      console.log(`   Offer types: ${offerTypes.length}`)
      console.log(`   PDF Document ID: ${pdfDocumentId}`)
      console.log(`   Extracted data available: ✓`)
      
      // Start parallel processing with real AI
      Promise.all([
        callAgentForEmptyFields(),
        loadSmartSuggestions()
      ]).catch(error => {
        console.error('❌ Parallel processing failed:', error)
      })
    } else if (hasOptions && !hasData && !loading) {
      console.log('⚠️ No PDF data available. This should not happen in production.')
      console.log('   The wizard should only be accessible after PDF upload and processing.')
      // In production, this state should trigger a redirect to the upload page
      // For development, we allow manual testing
    }
  }, [vehicleTypes.length, fuelTypes.length, offerTypes.length, loading, pdfDocumentId, extractedData?.id])

  // Helper function for smart suggestions
  const loadSmartSuggestions = async () => {
    if (!pdfDocumentId) return
    
    try {
      const smartService = new SmartFieldService(supabase)
      await smartService.initialize(pdfDocumentId)
      const suggestions = await smartService.getVehicleBasicsSuggestions()
      setSmartSuggestions(suggestions)
      console.log('✅ Smart suggestions loaded:', Object.keys(suggestions).length)
    } catch (error) {
      console.error('❌ Failed to load smart suggestions:', error)
    }
  }


  const loadSelectOptions = async () => {
    console.log('🔄 Loading select options from database...')
    try {
      // Nur Neuwagen und Gebrauchtwagen für offer_types
      const [makesRes, typesRes, offerTypesRes, fuelRes] = await Promise.all([
        supabase.from('makes').select('*').order('name'),
        supabase.from('vehicle_types').select('*').order('name'),
        supabase.from('offer_types')
          .select('*')
          .in('name', ['Neuwagen', 'Gebrauchtwagen'])
          .order('name'),
        supabase.from('fuel_types').select('*').order('name')
      ])

      if (makesRes.data) {
        setMakes(makesRes.data)
        console.log(`✅ Loaded ${makesRes.data.length} makes`)
      }
      if (typesRes.data) {
        setVehicleTypes(typesRes.data)
        console.log(`✅ Loaded ${typesRes.data.length} vehicle types`)
      }
      if (offerTypesRes.data) {
        setOfferTypes(offerTypesRes.data)
        console.log(`✅ Loaded ${offerTypesRes.data.length} offer types`)
      }
      if (fuelRes.data) {
        setFuelTypes(fuelRes.data)
        console.log(`✅ Loaded ${fuelRes.data.length} fuel types`)
      }
    } catch (error) {
      console.error('❌ Error loading select options:', error)
    } finally {
      setLoading(false)
      console.log('✅ Select options loading complete')
    }
  }


  // Optimierte Agent-Integration mit Streaming für alle leeren Select-Felder
  const callAgentForEmptyFields = async () => {
    console.log('🤖 Starting AI-powered field resolution with Claude Sonnet 4...')
    console.log('   Current formData:', {
      vehicle_type_id: formData.vehicle_type_id,
      fuel_type_id: formData.fuel_type_id,
      offer_type_id: formData.offer_type_id
    })
    console.log('   Available options:', {
      vehicleTypes: vehicleTypes.length,
      fuelTypes: fuelTypes.length,
      offerTypes: offerTypes.length
    })
    console.log('   Using extracted PDF data for context:', !!extractedData)

    try {
      const fieldsToResolve = [
        {
          fieldId: 'vehicle_type_id',
          fieldName: 'vehicle_type',
          fieldType: 'enum',
          currentValue: formData.vehicle_type_id,
          enumOptions: vehicleTypes.map(t => t.name),
          lookupTable: vehicleTypes
        },
        {
          fieldId: 'fuel_type_id',
          fieldName: 'fuel_type',
          fieldType: 'enum',
          currentValue: formData.fuel_type_id,
          enumOptions: fuelTypes.map(t => t.name),
          lookupTable: fuelTypes
        },
        {
          fieldId: 'offer_type_id',
          fieldName: 'offer_type',
          fieldType: 'enum',
          currentValue: formData.offer_type_id,
          enumOptions: offerTypes.map(t => t.name),
          lookupTable: offerTypes
        }
      ]
      
      // Filter nur leere Felder
      const fieldsToProcess = fieldsToResolve.filter(field => !field.currentValue && field.lookupTable.length > 0)
      console.log(`📝 Fields that need resolution: ${fieldsToProcess.length}`)

      if (fieldsToProcess.length === 0) {
        console.log('✅ No fields need resolution')
        return
      }

      // Setze alle Loading-States auf einmal
      const loadingStates: Record<string, boolean> = {}
      fieldsToProcess.forEach(field => {
        loadingStates[field.fieldId] = true
      })
      setFieldLoadingStates(prev => ({ ...prev, ...loadingStates }))
      console.log(`⏳ Starting parallel resolution for ${fieldsToProcess.length} fields`)

      // Neuer Batch-API Call mit Streaming
      const response = await fetch('/api/wizard/batch-resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: fieldsToProcess.map(f => ({
            fieldName: f.fieldName,
            fieldType: f.fieldType,
            enumOptions: f.enumOptions
          })),
          context: {
            extractedData,
            enrichedData: extractedData?.enriched_data,
            currentFormData: formData
          }
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      // Stream-Reader für progressive Updates
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      const startTime = Date.now()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        
        // Keep last incomplete line in buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.complete) {
                const totalTime = Date.now() - startTime
                console.log(`✅ All fields resolved in ${totalTime}ms`)
                console.log(`   Success: ${data.successCount}/${data.totalProcessed}`)
                break
              }

              if (data.field && data.value) {
                console.log(`🎯 [${data.index}/${data.total}] Received: ${data.field} = "${data.value}"`)
                console.log(`   Confidence: ${data.confidence}% | Response time: ${data.responseTime}ms`)
                
                // Find matching field and lookup table
                const fieldConfig = fieldsToResolve.find(f => f.fieldName === data.field)
                if (fieldConfig) {
                  const matchingItem = fieldConfig.lookupTable.find(t => 
                    t.name.toLowerCase() === data.value.toLowerCase()
                  )
                  
                  if (matchingItem) {
                    // Update UI immediately
                    setFieldLoadingStates(prev => ({
                      ...prev,
                      [fieldConfig.fieldId]: false
                    }))
                    
                    updateFormData({
                      [fieldConfig.fieldId]: matchingItem.id
                    }, true)
                    
                    console.log(`✅ Applied ${fieldConfig.fieldId}: ${data.value} (ID: ${matchingItem.id})`)
                  } else {
                    console.warn(`⚠️ No match found for "${data.value}" in ${fieldConfig.fieldName} options`)
                    console.log('   Available options:', fieldConfig.lookupTable.map(t => t.name))
                    
                    // Remove loading state even if no match
                    setFieldLoadingStates(prev => ({
                      ...prev,
                      [fieldConfig.fieldId]: false
                    }))
                  }
                } else {
                  console.warn(`⚠️ No field config found for: ${data.field}`)
                }
              }
              
              if (data.error && data.field) {
                console.error(`❌ Error for field ${data.field}: ${data.message || 'Unknown error'}`)
                
                // Remove loading state for failed field
                const fieldConfig = fieldsToResolve.find(f => f.fieldName === data.field)
                if (fieldConfig) {
                  setFieldLoadingStates(prev => ({
                    ...prev,
                    [fieldConfig.fieldId]: false
                  }))
                }
              }
            } catch (e) {
              console.error('❌ Failed to parse SSE data:', e, 'Line:', line)
            }
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Batch field resolution failed:', error)
      // Remove all loading states on error
      setFieldLoadingStates({
        vehicle_type_id: false,
        fuel_type_id: false,
        offer_type_id: false
      })
    }
  }


  // Auto-Apply KI-Fahrzeugzustand-Einschätzung
  useEffect(() => {
    if (smartSuggestions['offer_type_id']?.suggestions?.length > 0 && !formData.offer_type_id && offerTypes.length > 0) {
      const topSuggestion = smartSuggestions['offer_type_id'].suggestions[0]
      const matchingOfferType = offerTypes.find(t => t.name === topSuggestion.value)
      if (matchingOfferType) {
        console.log(`🤖 Auto-applying Fahrzeugzustand: ${topSuggestion.value} (${topSuggestion.confidence}%)`)
        updateFormData({ offer_type_id: matchingOfferType.id }, true) // Mark as AI-filled
      }
    }
  }, [smartSuggestions, offerTypes, formData.offer_type_id, updateFormData])

  // Auto-Apply Karosserie-Typ
  useEffect(() => {
    if (smartSuggestions['vehicle_type_id']?.suggestions?.length > 0 && !formData.vehicle_type_id && vehicleTypes.length > 0) {
      const topSuggestion = smartSuggestions['vehicle_type_id'].suggestions[0]
      const matchingVehicleType = vehicleTypes.find(t => t.name === topSuggestion.value)
      if (matchingVehicleType) {
        console.log(`🤖 Auto-applying Karosserie-Typ: ${topSuggestion.value} (${topSuggestion.confidence}%)`)
        updateFormData({ vehicle_type_id: matchingVehicleType.id }, true) // Mark as AI-filled
      }
    }
  }, [smartSuggestions, vehicleTypes, formData.vehicle_type_id, updateFormData])

  // Auto-Apply Kraftstoffart
  useEffect(() => {
    if (smartSuggestions['fuel_type_id']?.suggestions?.length > 0 && !formData.fuel_type_id && fuelTypes.length > 0) {
      const topSuggestion = smartSuggestions['fuel_type_id'].suggestions[0]
      const matchingFuelType = fuelTypes.find(t => t.name === topSuggestion.value)
      if (matchingFuelType) {
        console.log(`🤖 Auto-applying Kraftstoffart: ${topSuggestion.value} (${topSuggestion.confidence}%)`)
        updateFormData({ fuel_type_id: matchingFuelType.id }, true) // Mark as AI-filled
      }
    }
  }, [smartSuggestions, fuelTypes, formData.fuel_type_id, updateFormData])

  return (
    <div className="space-y-6">
      {/* Analysis Badge mit stabilem Layout */}
      <AnalysisBadge 
        isAnalyzing={isAnalyzing}
        isSuccess={fieldsIdentified > 0}
      />
      
      {/* 1. Fahrzeugzustand */}
      {isAnalyzing || fieldLoadingStates.offer_type_id ? (
        <SkeletonSelect label="Fahrzeugzustand *" />
      ) : (
        <div>
          <Label htmlFor="offerType">Fahrzeugzustand *</Label>
          <Select
            id="offerType"
            placeholder="Wählen Sie den Fahrzeugzustand"
            selectedKey={formData.offer_type_id || null}
            onSelectionChange={(key) => updateFormData({ offer_type_id: key as string })}
            disabled={loading}
          >
            {offerTypes.map((type) => (
              <Select.Item key={type.id} id={type.id} label={type.name} />
            ))}
          </Select>
          
          {/* Auto-Fill Label nur wenn durch KI befüllt */}
          {aiFilledFields.has('offer_type_id') && formData.offer_type_id && (
            <div className="mt-1 text-xs text-green-600 dark:text-green-400">
              ✓ Automatisch vorausgefüllt
            </div>
          )}
        </div>
      )}

      {/* 2. Marke */}
      {isAnalyzing ? (
        <SkeletonSelect label="Marke *" />
      ) : (
        <div>
          <Label htmlFor="make">Marke *</Label>
          <Select
            id="make"
            placeholder="Wählen Sie eine Marke"
            selectedKey={formData.make_id || null}
            onSelectionChange={(key) => updateFormData({ make_id: key as string })}
            disabled={loading}
          >
            {makes.map((make) => (
              <Select.Item key={make.id} id={make.id} label={make.name} />
            ))}
          </Select>
          
          {/* Auto-Fill Label für Marke */}
          {aiFilledFields.has('make_id') && formData.make_id && (
            <div className="mt-1 text-xs text-green-600 dark:text-green-400">
              ✓ Automatisch vorausgefüllt
            </div>
          )}
        </div>
      )}

      {/* 3. Modell */}
      {isAnalyzing ? (
        <SkeletonInput label="Modell *" />
      ) : (
        <div>
          <Label htmlFor="model">Modell *</Label>
          <Input
            id="model"
            type="text"
            placeholder="z.B. 3er Touring"
            value={formData.model || ''}
            onChange={(value) => updateFormData({ model: value })}
          />
          
          {/* Auto-Fill Label für Modell */}
          {aiFilledFields.has('model') && formData.model && (
            <div className="mt-1 text-xs text-green-600 dark:text-green-400">
              ✓ Automatisch vorausgefüllt
            </div>
          )}
        </div>
      )}

      {/* 4. Ausstattungsvariante */}
      {isAnalyzing ? (
        <SkeletonInput label="Ausstattungsvariante" hint={true} />
      ) : (
        <div>
          <Label htmlFor="trim">Ausstattungsvariante</Label>
          <Input
            id="trim"
            type="text"
            placeholder="z.B. M Sport"
            value={formData.trim || ''}
            onChange={(value) => updateFormData({ trim: value })}
          />
          
          {/* Auto-Fill Label für Trim */}
          {aiFilledFields.has('trim') && formData.trim && (
            <div className="mt-1 text-xs text-green-600 dark:text-green-400">
              ✓ Automatisch vorausgefüllt
            </div>
          )}
        </div>
      )}

      {/* 5. Karosserie-Typ */}
      {isAnalyzing || fieldLoadingStates.vehicle_type_id ? (
        <SkeletonSelect label="Karosserie-Typ" />
      ) : (
        <div>
          <Label htmlFor="vehicleType">Karosserie-Typ</Label>
          <Select
            id="vehicleType"
            placeholder="Wählen Sie den Karosserie-Typ"
            selectedKey={formData.vehicle_type_id || null}
            onSelectionChange={(key) => updateFormData({ vehicle_type_id: key as string })}
            disabled={loading}
          >
            {vehicleTypes.map((type) => (
              <Select.Item key={type.id} id={type.id} label={type.name} />
            ))}
          </Select>
          
          {/* Auto-Fill Label für Karosserie-Typ */}
          {aiFilledFields.has('vehicle_type_id') && formData.vehicle_type_id && (
            <div className="mt-1 text-xs text-green-600 dark:text-green-400">
              ✓ Automatisch vorausgefüllt
            </div>
          )}
        </div>
      )}

      {/* 6. Kraftstoffart */}
      {isAnalyzing || fieldLoadingStates.fuel_type_id ? (
        <SkeletonSelect label="Kraftstoffart *" />
      ) : (
        <div>
          <Label htmlFor="fuelType">Kraftstoffart *</Label>
          <Select
            id="fuelType"
            placeholder="Wählen Sie die Kraftstoffart"
            selectedKey={formData.fuel_type_id || null}
            onSelectionChange={(key) => updateFormData({ fuel_type_id: key as string })}
            disabled={loading}
          >
            {fuelTypes.map((type) => (
              <Select.Item key={type.id} id={type.id} label={type.name} />
            ))}
          </Select>
          
          {/* Auto-Fill Label für Kraftstoffart */}
          {aiFilledFields.has('fuel_type_id') && formData.fuel_type_id && (
            <div className="mt-1 text-xs text-green-600 dark:text-green-400">
              ✓ Automatisch vorausgefüllt
            </div>
          )}
        </div>
      )}
    </div>
  )
}