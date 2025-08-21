'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/base/input/input'
import { Label } from '@/components/base/input/label'
import { Checkbox } from '@/components/base/checkbox/checkbox'
import { TextArea } from '@/components/base/textarea/textarea'
import { Button } from '@/components/base/buttons/button'
import { Plus, X } from '@untitledui/icons'
import { useWizardContext } from '../wizard-context'
import { createClient } from '@/lib/supabase/client'
import { useAutoAnalysis } from '@/hooks/useAutoAnalysis'
import { SkeletonInput, SkeletonCheckbox, SkeletonTextArea } from '@/components/base/skeleton/skeleton'
import { AnalysisIndicator } from '../analysis-indicator'
import { translateEquipmentCategory } from '@/utils/equipment-translations'

interface EquipmentItem {
  id: string
  name: string
  category: string
  icon?: string
  display_order?: number
}

export function StepEquipment() {
  const { formData, updateFormData, autoFillWithAI, extractedData, setAnalysisState, stepAnalysisCompleted } = useWizardContext()
  const [equipment, setEquipment] = useState<EquipmentItem[]>([])
  const [equipmentByCategory, setEquipmentByCategory] = useState<Record<string, EquipmentItem[]>>({})
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(formData.equipment || [])
  const [customEquipment, setCustomEquipment] = useState<string[]>(formData.custom_equipment || [])
  const [newEquipmentInput, setNewEquipmentInput] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  // Auto-Analyse beim ersten Betreten des Steps
  const { isAnalyzing, fieldsIdentified, confidence, error: analysisError } = useAutoAnalysis({
    stepNumber: 3,
    extractedData,
    autoFillFunction: autoFillWithAI,
    skipIfDataExists: !!formData.exterior_color || stepAnalysisCompleted[3],
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
    loadEquipment()
  }, [])

  const loadEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      
      if (data) {
        setEquipment(data)
        
        // Group by category and translate category names
        const grouped = data.reduce((acc, item) => {
          // Übersetze Kategorie-Namen
          const translatedCategory = translateEquipmentCategory(item.category)
          if (!acc[translatedCategory]) {
            acc[translatedCategory] = []
          }
          acc[translatedCategory].push(item)
          return acc
        }, {} as Record<string, EquipmentItem[]>)
        
        setEquipmentByCategory(grouped)
      }
    } catch (error) {
      console.error('Error loading equipment:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleEquipmentToggle = (equipmentId: string) => {
    const newSelection = selectedEquipment.includes(equipmentId)
      ? selectedEquipment.filter(id => id !== equipmentId)
      : [...selectedEquipment, equipmentId]
    
    setSelectedEquipment(newSelection)
    updateFormData({ equipment: newSelection })
  }

  const handleAddCustomEquipment = () => {
    if (newEquipmentInput.trim()) {
      const updatedCustomEquipment = [...customEquipment, newEquipmentInput.trim()]
      setCustomEquipment(updatedCustomEquipment)
      updateFormData({ custom_equipment: updatedCustomEquipment })
      setNewEquipmentInput('')
    }
  }

  const handleRemoveCustomEquipment = (index: number) => {
    const updatedCustomEquipment = customEquipment.filter((_, i) => i !== index)
    setCustomEquipment(updatedCustomEquipment)
    updateFormData({ custom_equipment: updatedCustomEquipment })
  }

  return (
    <div className="space-y-6">
      {/* Analyse-Indikator */}
      <AnalysisIndicator 
        isAnalyzing={isAnalyzing}
        fieldsIdentified={fieldsIdentified}
        totalFields={8}
        confidence={confidence}
        error={analysisError}
        variant="inline"
      />
      {/* Farben */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Farben</h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="exteriorColor">Außenfarbe</Label>
            <Input
              id="exteriorColor"
              type="text"
              placeholder="z.B. Alpinweiß"
              value={formData.exterior_color || ''}
              onChange={(value) => updateFormData({ exterior_color: value })}
            />
          </div>
          
          <div>
            <Label htmlFor="interiorColor">Innenraumfarbe</Label>
            <Input
              id="interiorColor"
              type="text"
              placeholder="z.B. Schwarz"
              value={formData.interior_color || ''}
              onChange={(value) => updateFormData({ interior_color: value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="interiorMaterial">Innenraummaterial</Label>
          <Input
            id="interiorMaterial"
            type="text"
            placeholder="z.B. Leder Dakota"
            value={formData.interior_material || ''}
            onChange={(value) => updateFormData({ interior_material: value })}
          />
        </div>
      </div>

      {/* Grundausstattung */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Grundausstattung</h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="doorCount">Anzahl Türen</Label>
            <Input
              id="doorCount"
              type="number"
              placeholder="z.B. 5"
              value={formData.door_count || ''}
              onChange={(value) => updateFormData({ door_count: parseInt(value) || undefined })}
            />
          </div>
          
          <div>
            <Label htmlFor="seatCount">Anzahl Sitzplätze</Label>
            <Input
              id="seatCount"
              type="number"
              placeholder="z.B. 5"
              value={formData.seat_count || ''}
              onChange={(value) => updateFormData({ seat_count: parseInt(value) || undefined })}
            />
          </div>
        </div>
      </div>

      {/* Ausstattungsmerkmale */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Ausstattungsmerkmale</h3>
        
        {loading ? (
          <div className="text-sm text-secondary">Lade Ausstattungsoptionen...</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(equipmentByCategory).map(([category, items]) => (
              <div key={category}>
                <h4 className="font-medium text-primary mb-3">{category}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`equipment-${item.id}`}
                        checked={selectedEquipment.includes(item.id)}
                        onChange={() => handleEquipmentToggle(item.id)}
                      />
                      <label 
                        htmlFor={`equipment-${item.id}`}
                        className="text-sm text-secondary cursor-pointer"
                      >
                        {item.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Eigene Ausstattung hinzufügen */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Eigene Ausstattung hinzufügen</h3>
        
        <div className="flex gap-2">
          <Input
            placeholder="Neue Ausstattung eingeben..."
            value={newEquipmentInput}
            onChange={setNewEquipmentInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddCustomEquipment()
              }
            }}
          />
          <Button
            onClick={handleAddCustomEquipment}
            iconLeading={Plus}
            disabled={!newEquipmentInput.trim()}
          >
            Hinzufügen
          </Button>
        </div>

        {customEquipment.length > 0 && (
          <div className="space-y-2">
            <Label>Ihre hinzugefügten Ausstattungen:</Label>
            <div className="flex flex-wrap gap-2">
              {customEquipment.map((item, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
                >
                  <span className="text-secondary">{item}</span>
                  <button
                    onClick={() => handleRemoveCustomEquipment(index)}
                    className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={`${item} entfernen`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sonderausstattung */}
      <div>
        <TextArea
          label="Zusätzliche Anmerkungen zur Ausstattung"
          placeholder="Weitere Details oder Besonderheiten zur Ausstattung..."
          rows={4}
          value={formData.special_equipment || ''}
          onChange={(value) => updateFormData({ special_equipment: value })}
        />
      </div>
    </div>
  )
}