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

export function StepVehicleBasics() {
  const { formData, updateFormData, autoFillWithAI, extractedData, setAnalysisState, stepAnalysisCompleted } = useWizardContext()
  const [makes, setMakes] = useState<any[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([])
  const [vehicleCategories, setVehicleCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  // Auto-Analyse beim ersten Betreten des Steps
  const { isAnalyzing, fieldsIdentified, confidence, error: analysisError } = useAutoAnalysis({
    stepNumber: 1,
    extractedData,
    autoFillFunction: autoFillWithAI,
    skipIfDataExists: !!formData.model || stepAnalysisCompleted[1],
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
  }, [])

  const loadSelectOptions = async () => {
    try {
      const [makesRes, typesRes, categoriesRes] = await Promise.all([
        supabase.from('makes').select('*').order('name'),
        supabase.from('vehicle_types').select('*').order('name'),
        supabase.from('vehicle_categories').select('*').order('name')
      ])

      if (makesRes.data) setMakes(makesRes.data)
      if (typesRes.data) setVehicleTypes(typesRes.data)
      if (categoriesRes.data) setVehicleCategories(categoriesRes.data)
    } catch (error) {
      console.error('Error loading select options:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Analyse-Indikator */}
      <AnalysisIndicator 
        isAnalyzing={isAnalyzing}
        fieldsIdentified={fieldsIdentified}
        totalFields={5}
        confidence={confidence}
        error={analysisError}
        variant="inline"
      />
      {/* Marke */}
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
        </div>
      )}

      {/* Modell */}
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
        </div>
      )}

      {/* Ausstattungsvariante */}
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
            hint="Optional: Spezielle Ausstattungslinie oder Variante"
          />
        </div>
      )}

      {/* Fahrzeugtyp */}
      {isAnalyzing ? (
        <SkeletonSelect label="Fahrzeugtyp" />
      ) : (
        <div>
          <Label htmlFor="vehicleType">Fahrzeugtyp</Label>
          <Select
            id="vehicleType"
            placeholder="Wählen Sie einen Fahrzeugtyp"
            selectedKey={formData.vehicle_type_id || null}
            onSelectionChange={(key) => updateFormData({ vehicle_type_id: key as string })}
            disabled={loading}
          >
            {vehicleTypes.map((type) => (
              <Select.Item key={type.id} id={type.id} label={type.name} />
            ))}
          </Select>
        </div>
      )}

      {/* Fahrzeugkategorie */}
      {isAnalyzing ? (
        <SkeletonSelect label="Fahrzeugkategorie" />
      ) : (
        <div>
          <Label htmlFor="vehicleCategory">Fahrzeugkategorie</Label>
          <Select
            id="vehicleCategory"
            placeholder="Wählen Sie eine Kategorie"
            selectedKey={formData.vehicle_category_id || null}
            onSelectionChange={(key) => updateFormData({ vehicle_category_id: key as string })}
            disabled={loading}
          >
            {vehicleCategories.map((category) => (
              <Select.Item key={category.id} id={category.id} label={category.name} />
            ))}
          </Select>
        </div>
      )}
    </div>
  )
}