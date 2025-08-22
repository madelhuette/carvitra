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
import { EmissionClassSelectV2 } from '../emission-class-select-v2'

export function StepTechnicalDetails() {
  const { formData, updateFormData, autoFillWithAI, extractedData, setAnalysisState, stepAnalysisCompleted, pdfDocumentId, aiFilledFields } = useWizardContext()
  const [transmissionTypes, setTransmissionTypes] = useState<any[]>([])
  const [fuelTypes, setFuelTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [aiProcessingCompleted, setAiProcessingCompleted] = useState(false)
  
  // Individuelle Loading-States für jedes KI-analysierte Feld
  const [fieldLoadingStates, setFieldLoadingStates] = useState<Record<string, boolean>>({
    transmission_type_id: false,
    power_ps: false,
    power_kw: false,
    displacement: false,
    cylinder_count: false,
    fuel_consumption_combined: false,
    co2_emissions: false,
    emission_class: false,
    battery_capacity_gross: false,
    battery_capacity_usable: false
  })
  
  const supabase = createClient()
  
  // Auto-Analyse nur beim ersten Betreten des Steps
  const hasTechnicalData = !!(formData.power_ps && formData.fuel_type_id && formData.co2_emissions)
  const { isAnalyzing, fieldsIdentified, confidence, error: analysisError } = useAutoAnalysis({
    stepNumber: 2,
    extractedData,
    autoFillFunction: autoFillWithAI,
    skipIfDataExists: hasTechnicalData || stepAnalysisCompleted[2],
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
    console.log('🔄 Loading select options for technical details...')
    loadSelectOptions()
  }, [])
  
  // Start KI resolution when options are loaded AND we have PDF data
  useEffect(() => {
    const hasOptions = transmissionTypes.length > 0 && fuelTypes.length > 0
    const hasData = pdfDocumentId && extractedData
    
    if (hasOptions && hasData && !loading && !aiProcessingCompleted) {
      console.log('✅ Options loaded, starting KI resolution for technical fields...')
      console.log(`   Transmission types: ${transmissionTypes.length}`)
      console.log(`   Fuel types: ${fuelTypes.length}`)
      console.log(`   PDF Document ID: ${pdfDocumentId}`)
      console.log(`   Extracted data available: ✓`)
      
      setAiProcessingCompleted(true)
      
      // Start AI processing
      callAgentForEmptyTechnicalFields()
        .catch(error => {
          console.error('❌ Field resolution failed:', error)
        })
    }
  }, [transmissionTypes.length, fuelTypes.length, loading, pdfDocumentId, extractedData?.id, aiProcessingCompleted])

  const loadSelectOptions = async () => {
    try {
      const [transmissionRes, fuelRes] = await Promise.all([
        supabase.from('transmission_types').select('*').order('name'),
        supabase.from('fuel_types').select('*').order('name')
      ])

      if (transmissionRes.data) setTransmissionTypes(transmissionRes.data)
      if (fuelRes.data) setFuelTypes(fuelRes.data)
    } catch (error) {
      console.error('Error loading select options:', error)
    } finally {
      setLoading(false)
    }
  }


  // Neue optimierte Batch-Resolution für technische Felder
  const callAgentForEmptyTechnicalFields = async () => {
    console.log('🤖 Starting AI-powered technical field resolution with Claude Sonnet 4...')
    console.log('   Current formData:', {
      power_ps: formData.power_ps,
      power_kw: formData.power_kw,
      displacement: formData.displacement,
      cylinder_count: formData.cylinder_count,
      transmission_type_id: formData.transmission_type_id,
      fuel_consumption: formData.fuel_consumption_fossil || formData.fuel_consumption_electric,
      co2_emissions: formData.co2_emissions,
      emission_class: formData.emission_class
    })
    console.log('   Using extracted PDF data for context:', !!extractedData)

    try {
      // Definiere alle technischen Felder die aufgelöst werden sollen
      const fieldsToResolve = [
        // Priorität 1: Kritische Felder
        {
          fieldId: 'power_ps',
          fieldName: 'power_ps',
          fieldType: 'number',
          currentValue: formData.power_ps,
          constraints: { min: 50, max: 1500 },
          unit: 'PS'
        },
        {
          fieldId: 'power_kw',
          fieldName: 'power_kw',
          fieldType: 'number',
          currentValue: formData.power_kw,
          constraints: { min: 37, max: 1100 },
          unit: 'kW'
        },
        // Priorität 2: Wichtige Felder
        {
          fieldId: 'co2_emissions',
          fieldName: 'co2_emissions',
          fieldType: 'number',
          currentValue: formData.co2_emissions,
          constraints: { min: 0, max: 500 },
          unit: 'g/km'
        },
        {
          fieldId: 'emission_class',
          fieldName: 'emission_class',
          fieldType: 'enum',
          currentValue: formData.emission_class,
          enumOptions: ['A', 'B', 'C', 'D', 'E', 'F', 'G']
        },
        // Priorität 3: Zusatzfelder
        {
          fieldId: 'displacement',
          fieldName: 'displacement',
          fieldType: 'number',
          currentValue: formData.displacement,
          constraints: { min: 500, max: 8000 },
          unit: 'ccm'
        },
        {
          fieldId: 'cylinder_count',
          fieldName: 'cylinder_count',
          fieldType: 'number',
          currentValue: formData.cylinder_count,
          constraints: { min: 1, max: 16 }
        },
        {
          fieldId: 'transmission_type_id',
          fieldName: 'transmission_type',
          fieldType: 'enum',
          currentValue: formData.transmission_type_id,
          enumOptions: transmissionTypes.map(t => t.name),
          lookupTable: transmissionTypes
        }
      ]
      
      // Bestimme ob E-Auto für spezielle Felder
      const isElectric = formData.fuel_type_id && 
        fuelTypes.find(f => f.id === formData.fuel_type_id)?.name?.toLowerCase().includes('elektr')
      
      // Füge fahrzeugtyp-spezifische Felder hinzu
      if (isElectric) {
        fieldsToResolve.push(
          {
            fieldId: 'fuel_consumption_electric',
            fieldName: 'fuel_consumption_electric',
            fieldType: 'number',
            currentValue: formData.fuel_consumption_electric,
            constraints: { min: 10, max: 40 },
            unit: 'kWh/100km'
          },
          {
            fieldId: 'battery_capacity_gross',
            fieldName: 'battery_capacity_gross',
            fieldType: 'number',
            currentValue: formData.battery_capacity_gross,
            constraints: { min: 10, max: 200 },
            unit: 'kWh'
          },
          {
            fieldId: 'battery_capacity_usable',
            fieldName: 'battery_capacity_usable',
            fieldType: 'number',
            currentValue: formData.battery_capacity_usable,
            constraints: { min: 10, max: 195 },
            unit: 'kWh'
          }
        )
      } else {
        fieldsToResolve.push({
          fieldId: 'fuel_consumption_fossil',
          fieldName: 'fuel_consumption_fossil',
          fieldType: 'number',
          currentValue: formData.fuel_consumption_fossil,
          constraints: { min: 2, max: 30 },
          unit: 'l/100km'
        })
      }
      
      // Filter nur leere Felder
      const fieldsToProcess = fieldsToResolve.filter(field => !field.currentValue)
      console.log(`📝 Technical fields that need resolution: ${fieldsToProcess.length}`)

      if (fieldsToProcess.length === 0) {
        console.log('✅ No technical fields need resolution')
        return
      }

      // Setze alle Loading-States auf einmal
      const loadingStates: Record<string, boolean> = {}
      fieldsToProcess.forEach(field => {
        loadingStates[field.fieldId] = true
      })
      setFieldLoadingStates(prev => ({ ...prev, ...loadingStates }))
      console.log(`⏳ Starting parallel resolution for ${fieldsToProcess.length} technical fields`)

      // Neuer Batch-API Call mit Streaming für technische Felder
      const response = await fetch('/api/wizard/batch-resolve-technical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: fieldsToProcess.map(f => ({
            fieldName: f.fieldName,
            fieldType: f.fieldType,
            enumOptions: f.enumOptions,
            constraints: f.constraints,
            unit: f.unit
          })),
          context: {
            extractedData,
            enrichedData: extractedData?.enriched_data,
            currentFormData: formData,
            vehicleType: formData.vehicle_type_id ? 
              fuelTypes.find(f => f.id === formData.fuel_type_id)?.name : null
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
                console.log(`✅ All technical fields resolved in ${totalTime}ms`)
                console.log(`   Success: ${data.successCount}/${data.totalProcessed}`)
                break
              }

              if (data.field && data.value !== undefined) {
                console.log(`🎯 [${data.index}/${data.total}] Received: ${data.field} = "${data.value}"${data.unit ? ' ' + data.unit : ''}`)
                console.log(`   Confidence: ${data.confidence}% | Response time: ${data.responseTime}ms`)
                
                // Find matching field configuration
                const fieldConfig = fieldsToResolve.find(f => f.fieldName === data.field)
                if (fieldConfig) {
                  // Update Loading State
                  setFieldLoadingStates(prev => ({
                    ...prev,
                    [fieldConfig.fieldId]: false
                  }))
                  
                  // Handle special case for transmission type (needs ID mapping)
                  if (fieldConfig.fieldId === 'transmission_type_id' && fieldConfig.lookupTable) {
                    const matchingItem = fieldConfig.lookupTable.find(t => 
                      t.name.toLowerCase() === data.value.toLowerCase()
                    )
                    
                    if (matchingItem) {
                      updateFormData({
                        [fieldConfig.fieldId]: matchingItem.id
                      }, true) // Mark as AI-filled
                      console.log(`✅ Applied ${fieldConfig.fieldId}: ${data.value} (ID: ${matchingItem.id})`)
                    } else {
                      console.warn(`⚠️ No match found for "${data.value}" in transmission types`)
                    }
                  } else {
                    // Direct value update for other fields
                    const value = fieldConfig.fieldType === 'number' ? Number(data.value) : data.value
                    updateFormData({
                      [fieldConfig.fieldId]: value
                    }, true) // Mark as AI-filled
                    
                    // Special handling for PS/KW conversion
                    if (fieldConfig.fieldId === 'power_ps' && !formData.power_kw) {
                      const kwValue = Math.round(value * 0.735499)
                      updateFormData({ power_kw: kwValue }, true)
                      console.log(`🔄 Auto-calculated KW from PS: ${kwValue} kW`)
                    } else if (fieldConfig.fieldId === 'power_kw' && !formData.power_ps) {
                      const psValue = Math.round(value * 1.35962)
                      updateFormData({ power_ps: psValue }, true)
                      console.log(`🔄 Auto-calculated PS from KW: ${psValue} PS`)
                    }
                    
                    console.log(`✅ Applied ${fieldConfig.fieldId}: ${value}${fieldConfig.unit ? ' ' + fieldConfig.unit : ''}`)
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
      console.error('❌ Batch technical field resolution failed:', error)
      // Remove all loading states on error
      setFieldLoadingStates({
        transmission_type_id: false,
        power_ps: false,
        power_kw: false,
        displacement: false,
        cylinder_count: false,
        fuel_consumption_combined: false,
        co2_emissions: false,
        emission_class: false,
        battery_capacity_gross: false,
        battery_capacity_usable: false
      })
    }
  }



  // Calculate KW from PS or vice versa
  const handlePSChange = (value: string) => {
    const ps = parseInt(value)
    if (!isNaN(ps)) {
      updateFormData({ 
        power_ps: ps,
        power_kw: Math.round(ps * 0.735499)
      })
    } else {
      updateFormData({ power_ps: undefined, power_kw: undefined })
    }
  }

  const handleKWChange = (value: string) => {
    const kw = parseInt(value)
    if (!isNaN(kw)) {
      updateFormData({ 
        power_kw: kw,
        power_ps: Math.round(kw * 1.35962)
      })
    } else {
      updateFormData({ power_ps: undefined, power_kw: undefined })
    }
  }

  const showElectricFields = formData.fuel_type_id && 
    fuelTypes.find(f => f.id === formData.fuel_type_id)?.name?.toLowerCase().includes('elektr')
  
  const showCombustionFields = formData.fuel_type_id && 
    !fuelTypes.find(f => f.id === formData.fuel_type_id)?.name?.toLowerCase().includes('elektr')

  // Energieeffizienzklassen-Mapping für Farben und Beschreibungen
  const getEnergyEfficiencyClass = (key: string) => {
    const classes = {
      A: { color: '#00A651', textColor: 'text-white', label: 'Energieeffizienzklasse A (sehr effizient)' },
      B: { color: '#39B54A', textColor: 'text-white', label: 'Energieeffizienzklasse B (effizient)' },
      C: { color: '#8CC63F', textColor: 'text-white', label: 'Energieeffizienzklasse C (mäßig effizient)' },
      D: { color: '#FFF200', textColor: 'text-black', label: 'Energieeffizienzklasse D (weniger effizient)' },
      E: { color: '#FDB913', textColor: 'text-white', label: 'Energieeffizienzklasse E (gering effizient)' },
      F: { color: '#F7941E', textColor: 'text-white', label: 'Energieeffizienzklasse F (sehr gering effizient)' },
      G: { color: '#ED1C24', textColor: 'text-white', label: 'Energieeffizienzklasse G (ineffizient)' }
    }
    return classes[key as keyof typeof classes]
  }

  return (
    <div className="space-y-6">
      {/* Fixer Container für Analysis Badge - verhindert Layout-Shift */}
      <div className="h-8 flex items-center">
        <AnalysisBadge 
          isAnalyzing={isAnalyzing}
          isSuccess={fieldsIdentified > 0}
        />
      </div>
      {/* Motor & Leistung */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Motor & Leistung</h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* 1. Leistung (PS) */}
          {isAnalyzing || fieldLoadingStates.power_ps ? (
            <SkeletonInput label="Leistung (PS) *" />
          ) : (
            <div>
              <Label htmlFor="powerPS">Leistung (PS) *</Label>
              <Input
                id="powerPS"
                type="number"
                placeholder="z.B. 150"
                value={formData.power_ps || ''}
                onChange={handlePSChange}
              />
              {aiFilledFields.has('power_ps') && formData.power_ps && (
                <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                  ✓ Automatisch vorausgefüllt
                </div>
              )}
            </div>
          )}
          
          {/* 2. Leistung (kW) */}
          {isAnalyzing || fieldLoadingStates.power_kw ? (
            <SkeletonInput label="Leistung (kW) *" />
          ) : (
            <div>
              <Label htmlFor="powerKW">Leistung (kW) *</Label>
              <Input
                id="powerKW"
                type="number"
                placeholder="z.B. 110"
                value={formData.power_kw || ''}
                onChange={handleKWChange}
              />
              {aiFilledFields.has('power_kw') && formData.power_kw && (
                <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                  ✓ Automatisch vorausgefüllt
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hubraum und Zylinder nur bei Verbrennern anzeigen */}
        {!formData.fuel_type_id ? (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ℹ️ Bitte wählen Sie zuerst die Kraftstoffart im vorherigen Schritt aus
            </p>
          </div>
        ) : showCombustionFields ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* 3. Hubraum */}
            {isAnalyzing || fieldLoadingStates.displacement ? (
              <SkeletonInput label="Hubraum (ccm)" />
            ) : (
              <div>
                <Label htmlFor="displacement">Hubraum (ccm)</Label>
                <Input
                  id="displacement"
                  type="number"
                  placeholder="z.B. 1998"
                  value={formData.displacement || ''}
                  onChange={(value) => updateFormData({ displacement: parseInt(value) || undefined })}
                />
                {aiFilledFields.has('displacement') && formData.displacement && (
                  <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                    ✓ Automatisch vorausgefüllt
                  </div>
                )}
              </div>
            )}
            
            {/* 4. Anzahl Zylinder */}
            {isAnalyzing || fieldLoadingStates.cylinder_count ? (
              <SkeletonInput label="Anzahl Zylinder" />
            ) : (
              <div>
                <Label htmlFor="cylinders">Anzahl Zylinder</Label>
                <Input
                  id="cylinders"
                  type="number"
                  placeholder="z.B. 4"
                  value={formData.cylinder_count || ''}
                  onChange={(value) => updateFormData({ cylinder_count: parseInt(value) || undefined })}
                />
                {aiFilledFields.has('cylinder_count') && formData.cylinder_count && (
                  <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                    ✓ Automatisch vorausgefüllt
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Antrieb & Getriebe */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Antrieb & Getriebe</h3>
        
        {/* Getriebeart */}
        {isAnalyzing || fieldLoadingStates.transmission_type_id ? (
          <SkeletonSelect label="Getriebeart" />
        ) : (
          <div>
            <Label htmlFor="transmission">Getriebeart</Label>
            <Select
              id="transmission"
              placeholder="Wählen Sie die Getriebeart"
              selectedKey={formData.transmission_type_id || null}
              onSelectionChange={(key) => updateFormData({ transmission_type_id: key as string })}
              disabled={loading}
            >
              {transmissionTypes.map((type) => (
                <Select.Item key={type.id} id={type.id} label={type.name} />
              ))}
            </Select>
            
            {aiFilledFields.has('transmission_type_id') && formData.transmission_type_id && (
              <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                ✓ Automatisch vorausgefüllt
              </div>
            )}
          </div>
        )}
      </div>

      {/* Verbrauch & Emission */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Verbrauch & Emission</h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* 7. Kraftstoffverbrauch */}
          {isAnalyzing || fieldLoadingStates.fuel_consumption_fossil || fieldLoadingStates.fuel_consumption_electric ? (
            <SkeletonInput label={showElectricFields ? 'Stromverbrauch (kWh/100km)' : 'Kraftstoffverbrauch (l/100km)'} />
          ) : (
            <div>
              <Label htmlFor="consumption">
                {showElectricFields ? 'Stromverbrauch (kWh/100km)' : 'Kraftstoffverbrauch (l/100km)'}
              </Label>
              <Input
                id="consumption"
                type="number"
                step="0.1"
                placeholder={showElectricFields ? 'z.B. 15.5' : 'z.B. 5.2'}
                value={showElectricFields ? formData.fuel_consumption_electric : formData.fuel_consumption_fossil || ''}
                onChange={(value) => {
                  const val = parseFloat(value) || undefined
                  if (showElectricFields) {
                    updateFormData({ fuel_consumption_electric: val })
                  } else {
                    updateFormData({ fuel_consumption_fossil: val })
                  }
                }}
              />
              {(aiFilledFields.has('fuel_consumption_fossil') || aiFilledFields.has('fuel_consumption_electric')) && 
               (showElectricFields ? formData.fuel_consumption_electric : formData.fuel_consumption_fossil) && (
                <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                  ✓ Automatisch vorausgefüllt
                </div>
              )}
            </div>
          )}
          
          {/* 8. CO₂-Emissionen */}
          {isAnalyzing || fieldLoadingStates.co2_emissions ? (
            <SkeletonInput label="CO₂-Emissionen (g/km)" />
          ) : (
            <div>
              <Label htmlFor="co2">CO₂-Emissionen (g/km)</Label>
              <Input
                id="co2"
                type="number"
                placeholder="z.B. 120"
                value={formData.co2_emissions ?? ''}
                onChange={(value) => updateFormData({ co2_emissions: value ? parseFloat(value) : undefined })}
              />
              {aiFilledFields.has('co2_emissions') && formData.co2_emissions !== undefined && (
                <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                  ✓ Automatisch vorausgefüllt
                </div>
              )}
            </div>
          )}
        </div>

        {/* 9. Energieeffizienzklasse */}
        {isAnalyzing || fieldLoadingStates.emission_class ? (
          <SkeletonSelect label="Energieeffizienzklasse" />
        ) : (
          <div>
            <Label htmlFor="emissionClass">Energieeffizienzklasse</Label>
            <Select
                id="emissionClass"
                placeholder="Energieeffizienzklasse wählen"
                selectedKey={formData.emission_class || null}
                onSelectionChange={(key) => updateFormData({ emission_class: key as string })}
                className="flex-1"
              >
              {/* Energieeffizienzklassen A-G mit offiziellen Farben nach PKW-EnVKV */}
              <Select.Item key="A" id="A" label="A - Sehr effizient">
                <div className="flex items-center gap-3">
                  <span 
                    className="inline-flex items-center justify-center w-8 h-6 rounded text-white font-bold text-sm"
                    style={{ backgroundColor: '#00A651' }}
                  >
                    A
                  </span>
                  <span>Energieeffizienzklasse A (sehr effizient)</span>
                </div>
              </Select.Item>
              <Select.Item key="B" id="B" label="B - Effizient">
                <div className="flex items-center gap-3">
                  <span 
                    className="inline-flex items-center justify-center w-8 h-6 rounded text-white font-bold text-sm"
                    style={{ backgroundColor: '#39B54A' }}
                  >
                    B
                  </span>
                  <span>Energieeffizienzklasse B (effizient)</span>
                </div>
              </Select.Item>
              <Select.Item key="C" id="C" label="C - Mäßig effizient">
                <div className="flex items-center gap-3">
                  <span 
                    className="inline-flex items-center justify-center w-8 h-6 rounded text-white font-bold text-sm"
                    style={{ backgroundColor: '#8CC63F' }}
                  >
                    C
                  </span>
                  <span>Energieeffizienzklasse C (mäßig effizient)</span>
                </div>
              </Select.Item>
              <Select.Item key="D" id="D" label="D - Weniger effizient">
                <div className="flex items-center gap-3">
                  <span 
                    className="inline-flex items-center justify-center w-8 h-6 rounded text-black font-bold text-sm"
                    style={{ backgroundColor: '#FFF200' }}
                  >
                    D
                  </span>
                  <span>Energieeffizienzklasse D (weniger effizient)</span>
                </div>
              </Select.Item>
              <Select.Item key="E" id="E" label="E - Gering effizient">
                <div className="flex items-center gap-3">
                  <span 
                    className="inline-flex items-center justify-center w-8 h-6 rounded text-white font-bold text-sm"
                    style={{ backgroundColor: '#FDB913' }}
                  >
                    E
                  </span>
                  <span>Energieeffizienzklasse E (gering effizient)</span>
                </div>
              </Select.Item>
              <Select.Item key="F" id="F" label="F - Sehr gering effizient">
                <div className="flex items-center gap-3">
                  <span 
                    className="inline-flex items-center justify-center w-8 h-6 rounded text-white font-bold text-sm"
                    style={{ backgroundColor: '#F7941E' }}
                  >
                    F
                  </span>
                  <span>Energieeffizienzklasse F (sehr gering effizient)</span>
                </div>
              </Select.Item>
              <Select.Item key="G" id="G" label="G - Ineffizient">
                <div className="flex items-center gap-3">
                  <span 
                    className="inline-flex items-center justify-center w-8 h-6 rounded text-white font-bold text-sm"
                    style={{ backgroundColor: '#ED1C24' }}
                  >
                    G
                  </span>
                  <span>Energieeffizienzklasse G (ineffizient)</span>
                </div>
              </Select.Item>
            </Select>
            
            {aiFilledFields.has('emission_class') && formData.emission_class && (
              <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                ✓ Automatisch vorausgefüllt
              </div>
            )}
          </div>
        )}
      </div>

      {/* Batterie (nur bei Elektrofahrzeugen) */}
      {showElectricFields && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Batterie</h3>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* 10. Batteriekapazität brutto */}
            {isAnalyzing || fieldLoadingStates.battery_capacity_gross ? (
              <SkeletonInput label="Batteriekapazität brutto (kWh)" />
            ) : (
              <div>
                <Label htmlFor="batteryGross">Batteriekapazität brutto (kWh)</Label>
                <Input
                  id="batteryGross"
                  type="number"
                  step="0.1"
                  placeholder="z.B. 75.0"
                  value={formData.battery_capacity_gross || ''}
                  onChange={(value) => updateFormData({ battery_capacity_gross: parseFloat(value) || undefined })}
                />
                {aiFilledFields.has('battery_capacity_gross') && formData.battery_capacity_gross && (
                  <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                    ✓ Automatisch vorausgefüllt
                  </div>
                )}
              </div>
            )}
            
            {/* 11. Batteriekapazität nutzbar */}
            {isAnalyzing || fieldLoadingStates.battery_capacity_usable ? (
              <SkeletonInput label="Batteriekapazität nutzbar (kWh)" />
            ) : (
              <div>
                <Label htmlFor="batteryUsable">Batteriekapazität nutzbar (kWh)</Label>
                <Input
                  id="batteryUsable"
                  type="number"
                  step="0.1"
                  placeholder="z.B. 70.0"
                  value={formData.battery_capacity_usable || ''}
                  onChange={(value) => updateFormData({ battery_capacity_usable: parseFloat(value) || undefined })}
                />
                {aiFilledFields.has('battery_capacity_usable') && formData.battery_capacity_usable && (
                  <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                    ✓ Automatisch vorausgefüllt
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}