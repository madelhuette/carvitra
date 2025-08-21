'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/base/input/input'
import { Select } from '@/components/base/select/select'
import { Label } from '@/components/base/input/label'
import { useWizardContext } from '../wizard-context'
import { createClient } from '@/lib/supabase/client'
import { useAutoAnalysis } from '@/hooks/useAutoAnalysis'
import { SkeletonInput, SkeletonSelect } from '@/components/base/skeleton/skeleton'
import { AnalysisIndicator } from '../analysis-indicator'
import { EmissionClassSelectV2 } from '../emission-class-select-v2'
import { ConfidenceInputV2 } from '../confidence-input-v2'
import { SmartFieldService } from '@/services/smart-field.service'
import type { SmartFieldResult } from '@/services/smart-field.service'

export function StepTechnicalDetails() {
  const { formData, updateFormData, autoFillWithAI, extractedData, setAnalysisState, stepAnalysisCompleted, pdfDocumentId } = useWizardContext()
  const [transmissionTypes, setTransmissionTypes] = useState<any[]>([])
  const [fuelTypes, setFuelTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [smartSuggestions, setSmartSuggestions] = useState<Record<string, SmartFieldResult>>({})
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const supabase = createClient()
  
  // Auto-Analyse beim ersten Betreten des Steps
  const { isAnalyzing, fieldsIdentified, confidence, error: analysisError } = useAutoAnalysis({
    stepNumber: 2,
    extractedData,
    autoFillFunction: autoFillWithAI,
    skipIfDataExists: !!formData.power_ps || stepAnalysisCompleted[2],
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

  useEffect(() => {
    loadSelectOptions()
    if (pdfDocumentId) {
      loadSmartSuggestions()
    }
  }, [pdfDocumentId])

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

  const loadSmartSuggestions = async () => {
    if (!pdfDocumentId) return
    
    setLoadingSuggestions(true)
    try {
      const smartService = new SmartFieldService(supabase)
      await smartService.initialize(pdfDocumentId)
      
      const suggestions = await smartService.getTechnicalDetailsSuggestions()
      setSmartSuggestions(suggestions)
    } catch (error) {
      console.error('Failed to load smart suggestions:', error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const refreshSuggestions = () => {
    loadSmartSuggestions()
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

  return (
    <div className="space-y-6">
      {/* Analyse-Indikator */}
      <AnalysisIndicator 
        isAnalyzing={isAnalyzing}
        fieldsIdentified={fieldsIdentified}
        totalFields={12}
        confidence={confidence}
        error={analysisError}
        variant="inline"
      />
      {/* Motor & Leistung */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Motor & Leistung</h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <ConfidenceInputV2
              id="powerPS"
              label="Leistung (PS)"
              placeholder="z.B. 150"
              value={formData.power_ps || ''}
              onChange={handlePSChange}
              type="number"
              suggestions={smartSuggestions['power_ps']}
              onRefreshSuggestions={refreshSuggestions}
              suffix="PS"
            />
          </div>
          
          <div>
            <ConfidenceInputV2
              id="powerKW"
              label="Leistung (KW)"
              placeholder="z.B. 110"
              value={formData.power_kw || ''}
              onChange={handleKWChange}
              type="number"
              suggestions={smartSuggestions['power_kw']}
              onRefreshSuggestions={refreshSuggestions}
              suffix="kW"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <ConfidenceInputV2
              id="displacement"
              label="Hubraum (ccm)"
              placeholder="z.B. 1998"
              value={formData.displacement || ''}
              onChange={(value) => updateFormData({ displacement: parseInt(value) || undefined })}
              type="number"
              suggestions={smartSuggestions['displacement']}
              onRefreshSuggestions={refreshSuggestions}
              suffix="ccm"
            />
          </div>
          
          <div>
            <ConfidenceInputV2
              id="cylinders"
              label="Anzahl Zylinder"
              placeholder="z.B. 4"
              value={formData.cylinder_count || ''}
              onChange={(value) => updateFormData({ cylinder_count: parseInt(value) || undefined })}
              type="number"
              suggestions={smartSuggestions['cylinders']}
              onRefreshSuggestions={refreshSuggestions}
            />
          </div>
        </div>
      </div>

      {/* Antrieb & Getriebe */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Antrieb & Getriebe</h3>
        
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
        </div>

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
        </div>
      </div>

      {/* Verbrauch & Emission */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Verbrauch & Emission</h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          </div>
          
          <div>
            <ConfidenceInputV2
              id="co2"
              label="CO₂-Emissionen (g/km)"
              type="number"
              placeholder="z.B. 120"
              value={formData.co2_emissions || ''}
              onChange={(value) => updateFormData({ co2_emissions: parseFloat(value) || undefined })}
              suggestions={smartSuggestions['co2_emissions']}
              onRefreshSuggestions={refreshSuggestions}
              suffix="g/km"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="emissionClass">Emissionsklasse</Label>
          <EmissionClassSelectV2
            id="emissionClass"
            value={formData.emission_class}
            onChange={(value) => updateFormData({ emission_class: value || '' })}
          />
        </div>
      </div>

      {/* Batterie (nur bei Elektrofahrzeugen) */}
      {showElectricFields && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Batterie</h3>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            </div>
            
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}