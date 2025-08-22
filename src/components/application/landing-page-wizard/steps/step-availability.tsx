'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/base/input/input'
import { Select } from '@/components/base/select/select'
import { Label } from '@/components/base/input/label'
import { Checkbox } from '@/components/base/checkbox/checkbox'
import { DatePicker } from '@/components/base/date-picker/date-picker'
import { useWizardContext } from '../wizard-context'
import { createClient } from '@/lib/supabase/client'
import { useAutoAnalysis } from '@/hooks/useAutoAnalysis'
import { SkeletonInput, SkeletonSelect, SkeletonCheckbox } from '@/components/base/skeleton/skeleton'
import { SmartFieldService } from '@/services/smart-field.service'
import type { SmartFieldResult } from '@/services/smart-field.service'

export function StepAvailability() {
  const { formData, updateFormData, autoFillWithAI, extractedData, setAnalysisState, stepAnalysisCompleted, pdfDocumentId } = useWizardContext()
  const [availabilityTypes, setAvailabilityTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [smartSuggestions, setSmartSuggestions] = useState<Record<string, SmartFieldResult>>({})
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const supabase = createClient()
  
  // Auto-Analyse beim ersten Betreten des Steps
  const { isAnalyzing } = useAutoAnalysis({
    stepNumber: 4,
    extractedData,
    autoFillFunction: autoFillWithAI,
    skipIfDataExists: !!formData.list_price_gross || stepAnalysisCompleted[4],
    onAnalysisStart: () => {
      setAnalysisState(true)
    },
    onAnalysisComplete: (fields) => {
      setAnalysisState(false, {
        fieldsIdentified: fields,
        confidence: 95,
        timestamp: new Date()
      })
    },
    onAnalysisError: () => {
      setAnalysisState(false, null)
    }
  })

  useEffect(() => {
    loadAvailabilityTypes()
    if (pdfDocumentId) {
      loadSmartSuggestions()
    }
  }, [pdfDocumentId])

  const loadAvailabilityTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('availability_types')
        .select('*')
        .order('name')

      if (error) throw error
      if (data) setAvailabilityTypes(data)
    } catch (error) {
      console.error('Error loading availability types:', error)
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
      
      const suggestions = await smartService.getAvailabilitySuggestions()
      setSmartSuggestions(suggestions)
    } catch (error) {
      console.error('Failed to load availability smart suggestions:', error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  // Auto-Apply KI-Vorschläge für Verfügbarkeit
  useEffect(() => {
    if (Object.keys(smartSuggestions).length === 0) return
    
    // Price Auto-Apply (Gross)
    if (smartSuggestions['list_price_gross']?.suggestions?.length > 0 && !formData.list_price_gross) {
      const priceSuggestion = smartSuggestions['list_price_gross'].suggestions[0]
      console.log(`🤖 Auto-applying Bruttopreis: ${priceSuggestion.value}€ (${priceSuggestion.confidence}%)`)
      updateFormData({ 
        list_price_gross: priceSuggestion.value,
        list_price_net: Math.round((priceSuggestion.value / 1.19) * 100) / 100
      })
    }
    
    // Mileage Auto-Apply
    if (smartSuggestions['mileage_count']?.suggestions?.length > 0 && !formData.mileage_count) {
      const mileageSuggestion = smartSuggestions['mileage_count'].suggestions[0]
      console.log(`🤖 Auto-applying Kilometerstand: ${mileageSuggestion.value} km (${mileageSuggestion.confidence}%)`)
      updateFormData({ mileage_count: mileageSuggestion.value })
    }
    
    // First Registration Auto-Apply
    if (smartSuggestions['first_registration']?.suggestions?.length > 0 && !formData.first_registration) {
      const regSuggestion = smartSuggestions['first_registration'].suggestions[0]
      console.log(`🤖 Auto-applying Erstzulassung: ${regSuggestion.value} (${regSuggestion.confidence}%)`)
      updateFormData({ first_registration: regSuggestion.value })
    }
    
    // Owner Count Auto-Apply
    if (smartSuggestions['owner_count']?.suggestions?.length > 0 && !formData.owner_count) {
      const ownerSuggestion = smartSuggestions['owner_count'].suggestions[0]
      console.log(`🤖 Auto-applying Vorbesitzer: ${ownerSuggestion.value} (${ownerSuggestion.confidence}%)`)
      updateFormData({ owner_count: ownerSuggestion.value })
    }
    
  }, [smartSuggestions, formData, updateFormData])

  // Auto-Apply für Availability Type ID
  useEffect(() => {
    if (smartSuggestions['availability_type_id']?.suggestions?.length > 0 && !formData.availability_type_id && availabilityTypes.length > 0) {
      const availSuggestion = smartSuggestions['availability_type_id'].suggestions[0]
      const matchingAvailType = availabilityTypes.find(a => a.name === availSuggestion.value)
      if (matchingAvailType) {
        console.log(`🤖 Auto-applying Status: ${availSuggestion.value} (${availSuggestion.confidence}%)`)
        updateFormData({ availability_type_id: matchingAvailType.id })
      }
    }
  }, [smartSuggestions, availabilityTypes, formData.availability_type_id, updateFormData])

  // Calculate net from gross or vice versa (assuming 19% VAT)
  const handleGrossPriceChange = (value: string) => {
    const gross = parseFloat(value)
    if (!isNaN(gross)) {
      updateFormData({ 
        list_price_gross: gross,
        list_price_net: Math.round((gross / 1.19) * 100) / 100
      })
    } else {
      updateFormData({ list_price_gross: undefined, list_price_net: undefined })
    }
  }

  const handleNetPriceChange = (value: string) => {
    const net = parseFloat(value)
    if (!isNaN(net)) {
      updateFormData({ 
        list_price_net: net,
        list_price_gross: Math.round(net * 1.19 * 100) / 100
      })
    } else {
      updateFormData({ list_price_gross: undefined, list_price_net: undefined })
    }
  }

  return (
    <div className="space-y-6">
      {/* Verfügbarkeit */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Verfügbarkeit</h3>
        
        <div>
          <Label htmlFor="availabilityType">Verfügbarkeitsstatus *</Label>
          <Select
            id="availabilityType"
            placeholder="Wählen Sie den Status"
            selectedKey={formData.availability_type_id || null}
            onSelectionChange={(key) => updateFormData({ availability_type_id: key as string })}
            disabled={loading}
          >
            {availabilityTypes.map((type) => (
              <Select.Item key={type.id} id={type.id} label={type.name} />
            ))}
          </Select>
          
          {/* Smart Suggestions für Verfügbarkeitsstatus */}
          {smartSuggestions['availability_type_id']?.suggestions && smartSuggestions['availability_type_id'].suggestions.length > 0 && (
            <div className="mt-2 p-2 bg-secondary/5 border border-primary/10 rounded-lg">
              <div className="text-xs font-medium text-secondary mb-1">KI-Einschätzung:</div>
              <div className="text-sm">
                {smartSuggestions['availability_type_id'].suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="font-medium">{suggestion.value}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      suggestion.confidence >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      suggestion.confidence >= 70 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                      'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {suggestion.confidence}%
                    </span>
                    <span className="text-xs text-tertiary">{suggestion.reasoning}</span>
                  </div>
                ))}
              </div>
              {formData.availability_type_id && (
                <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                  ✓ Automatisch übernommen
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="availabilityDate">Liefertermin</Label>
          <DatePicker
            id="availabilityDate"
            value={formData.availability_date || ''}
            onChange={(value) => updateFormData({ availability_date: value })}
            placeholder="Wählen Sie ein Datum"
            hint="Voraussichtlicher Liefertermin oder Verfügbarkeitsdatum"
          />
        </div>
      </div>

      {/* Preise */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Preise</h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="priceGross">Listenpreis brutto (€) *</Label>
            <Input
              id="priceGross"
              type="number"
              step="0.01"
              placeholder="z.B. 45000.00"
              value={formData.list_price_gross || ''}
              onChange={handleGrossPriceChange}
            />
            {/* KI-Indikator für Preis */}
            {smartSuggestions['list_price_gross']?.suggestions?.length > 0 && formData.list_price_gross && (
              <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                ✓ Preis automatisch aus PDF extrahiert ({smartSuggestions['list_price_gross'].suggestions[0].confidence}%)
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="priceNet">Listenpreis netto (€)</Label>
            <Input
              id="priceNet"
              type="number"
              step="0.01"
              placeholder="z.B. 37815.13"
              value={formData.list_price_net || ''}
              onChange={handleNetPriceChange}
            />
          </div>
        </div>
      </div>

      {/* Fahrzeughistorie */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Fahrzeughistorie</h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="firstRegistration">Erstzulassung</Label>
            <DatePicker
              id="firstRegistration"
              value={formData.first_registration || ''}
              onChange={(value) => updateFormData({ first_registration: value })}
              placeholder="Wählen Sie ein Datum"
            />
          </div>
          
          <div>
            <Label htmlFor="mileage">Kilometerstand</Label>
            <Input
              id="mileage"
              type="number"
              placeholder="z.B. 15000"
              value={formData.mileage_count || ''}
              onChange={(value) => updateFormData({ mileage_count: parseInt(value) || undefined })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="ownerCount">Anzahl Vorbesitzer</Label>
            <Input
              id="ownerCount"
              type="number"
              placeholder="z.B. 1"
              value={formData.owner_count || ''}
              onChange={(value) => updateFormData({ owner_count: parseInt(value) || undefined })}
            />
          </div>
          
          <div>
            <Label htmlFor="inspection">HU/AU gültig bis</Label>
            <DatePicker
              id="inspection"
              value={formData.general_inspection_date || ''}
              onChange={(value) => updateFormData({ general_inspection_date: value })}
              placeholder="Wählen Sie ein Datum"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="accidentFree"
            checked={formData.accident_free ?? true}
            onChange={(checked) => updateFormData({ accident_free: checked })}
          />
          <label htmlFor="accidentFree" className="text-sm text-secondary">
            Unfallfrei
          </label>
        </div>
      </div>
    </div>
  )
}