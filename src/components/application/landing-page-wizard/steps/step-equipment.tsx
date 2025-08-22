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
import { AnalysisBadge } from '../analysis-badge'
import { translateEquipmentCategory } from '@/utils/equipment-translations'
import { SmartFieldService } from '@/services/smart-field.service'
import type { SmartFieldResult } from '@/services/smart-field.service'

interface EquipmentItem {
  id: string
  name: string
  category: string
  icon?: string
  display_order?: number
}

export function StepEquipment() {
  const { formData, updateFormData, autoFillWithAI, extractedData, setAnalysisState, stepAnalysisCompleted, pdfDocumentId } = useWizardContext()
  const [equipment, setEquipment] = useState<EquipmentItem[]>([])
  const [equipmentByCategory, setEquipmentByCategory] = useState<Record<string, EquipmentItem[]>>({})
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(formData.equipment || [])
  const [customEquipment, setCustomEquipment] = useState<string[]>(formData.custom_equipment || [])
  const [newEquipmentInput, setNewEquipmentInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [smartSuggestions, setSmartSuggestions] = useState<Record<string, SmartFieldResult>>({})
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [streamingEquipment, setStreamingEquipment] = useState(false)
  const [equipmentProgress, setEquipmentProgress] = useState({ current: 0, total: 0 })
  const [aiThoughts, setAiThoughts] = useState<string[]>([])
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
    if (pdfDocumentId) {
      console.log('🔍 Step 3: PDF Document ID verfügbar, lade Smart Suggestions...', pdfDocumentId)
      loadSmartSuggestions()
    } else {
      console.log('⚠️ Step 3: Kein PDF Document ID verfügbar für Smart Suggestions')
    }
  }, [pdfDocumentId])

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

  const loadSmartSuggestions = async () => {
    if (!pdfDocumentId) {
      console.log('❌ Step 3: loadSmartSuggestions - Kein pdfDocumentId')
      return
    }
    
    console.log('🚀 Step 3: Starte loadSmartSuggestions mit ID:', pdfDocumentId)
    setLoadingSuggestions(true)
    try {
      const smartService = new SmartFieldService(supabase)
      console.log('🔧 Step 3: SmartFieldService erstellt, initialisiere...')
      await smartService.initialize(pdfDocumentId)
      
      console.log('🎯 Step 3: Service initialisiert, lade Equipment-Suggestions...')
      
      // Lade normale Felder (Farben, Türen, etc.)
      const suggestions = await smartService.getEquipmentSuggestions()
      console.log('✅ Step 3: Equipment-Suggestions geladen:', suggestions)
      setSmartSuggestions(suggestions)
      
      // Starte Streaming für Equipment-Items wenn noch keine vorhanden
      if (selectedEquipment.length === 0 && suggestions['equipment_keywords']) {
        await loadEquipmentWithStreaming(pdfDocumentId)
      }
    } catch (error) {
      console.error('❌ Step 3: Failed to load equipment smart suggestions:', error)
    } finally {
      setLoadingSuggestions(false)
    }
  }
  
  /**
   * Lade Equipment mit KI-Agent und Streaming
   */
  const loadEquipmentWithStreaming = async (pdfId: string) => {
    console.log('🤖 Step 3: Starte KI Equipment Extraction mit Streaming')
    setStreamingEquipment(true)
    setAiThoughts([])
    
    try {
      const response = await fetch('/api/agents/equipment-extraction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream' // Request streaming
        },
        body: JSON.stringify({
          pdfDocumentId: pdfId,
          context: {
            pdfText: extractedData?.raw_text || '',
            extractedData: extractedData,
            enrichedData: extractedData?.enriched_data,
            vehicleInfo: {
              make: formData.make_id,
              model: formData.model,
              variant: formData.trim,
              year: extractedData?.ai_extracted?.vehicle?.year
            }
          },
          options: {
            enablePerplexity: true,
            confidenceThreshold: 70,
            includeCustomEquipment: true,
            language: 'de'
          }
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Handle Server-Sent Events
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) {
        throw new Error('No response body')
      }
      
      const selectedIds: string[] = []
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              console.log('✅ Step 3: Equipment Streaming abgeschlossen')
              break
            }
            
            try {
              const event = JSON.parse(data)
              
              // Handle verschiedene Event-Typen
              switch (event.type) {
                case 'thought':
                  console.log('💭 Agent denkt:', event.data.thought)
                  setAiThoughts(prev => [...prev, event.data.thought])
                  break
                  
                case 'equipment_found':
                  const item = event.data.item
                  console.log(`✅ Equipment gefunden: ${item.equipmentName} (${item.confidence}%)`)
                  
                  // Füge Equipment-ID zur Auswahl hinzu
                  if (!selectedIds.includes(item.equipmentId)) {
                    selectedIds.push(item.equipmentId)
                    setSelectedEquipment(prev => {
                      const newSelection = [...prev]
                      if (!newSelection.includes(item.equipmentId)) {
                        newSelection.push(item.equipmentId)
                      }
                      return newSelection
                    })
                  }
                  
                  // Update Progress
                  setEquipmentProgress(prev => ({
                    current: prev.current + 1,
                    total: prev.total || 20 // Geschätzt
                  }))
                  break
                  
                case 'extraction_complete':
                  const result = event.data
                  console.log(`🎆 Extraction komplett: ${result.mappedEquipment.length} Items, ${result.confidence.overall}% Konfidenz`)
                  
                  // Finale Updates
                  const finalIds = result.mappedEquipment.map((m: any) => m.equipmentId)
                  setSelectedEquipment(finalIds)
                  updateFormData({ equipment: finalIds })
                  
                  // Custom Equipment hinzufügen
                  if (result.customEquipment.length > 0) {
                    setCustomEquipment(result.customEquipment)
                    updateFormData({ custom_equipment: result.customEquipment })
                  }
                  break
                  
                case 'error':
                  console.error('❌ Agent Error:', event.data.error)
                  break
              }
            } catch (parseError) {
              console.error('Failed to parse SSE event:', parseError)
            }
          }
        }
      }
      
      // Update form data mit finaler Auswahl
      updateFormData({ equipment: selectedIds })
      
    } catch (error) {
      console.error('❌ Equipment Streaming fehlgeschlagen:', error)
    } finally {
      setStreamingEquipment(false)
      setEquipmentProgress({ current: 0, total: 0 })
    }
  }

  // Auto-Apply KI-Vorschläge für Ausstattung
  useEffect(() => {
    console.log('🔍 Step 3: Auto-Apply useEffect triggered, smartSuggestions:', Object.keys(smartSuggestions))
    if (Object.keys(smartSuggestions).length === 0) return
    
    // Exterior Color Auto-Apply
    if (smartSuggestions['exterior_color']?.suggestions?.length > 0 && !formData.exterior_color) {
      const colorSuggestion = smartSuggestions['exterior_color'].suggestions[0]
      console.log(`🤖 Auto-applying Außenfarbe: ${colorSuggestion.value} (${colorSuggestion.confidence}%)`)
      updateFormData({ exterior_color: colorSuggestion.value })
    }
    
    // Interior Color Auto-Apply
    if (smartSuggestions['interior_color']?.suggestions?.length > 0 && !formData.interior_color) {
      const interiorSuggestion = smartSuggestions['interior_color'].suggestions[0]
      console.log(`🤖 Auto-applying Innenraumfarbe: ${interiorSuggestion.value} (${interiorSuggestion.confidence}%)`)
      updateFormData({ interior_color: interiorSuggestion.value })
    }
    
    // Interior Material Auto-Apply
    if (smartSuggestions['interior_material']?.suggestions?.length > 0 && !formData.interior_material) {
      const materialSuggestion = smartSuggestions['interior_material'].suggestions[0]
      console.log(`🤖 Auto-applying Material: ${materialSuggestion.value} (${materialSuggestion.confidence}%)`)
      updateFormData({ interior_material: materialSuggestion.value })
    }
    
    // Door Count Auto-Apply
    if (smartSuggestions['door_count']?.suggestions?.length > 0 && !formData.door_count) {
      const doorSuggestion = smartSuggestions['door_count'].suggestions[0]
      console.log(`🤖 Auto-applying Türen: ${doorSuggestion.value} (${doorSuggestion.confidence}%)`)
      updateFormData({ door_count: doorSuggestion.value })
    }
    
    // Seat Count Auto-Apply
    if (smartSuggestions['seat_count']?.suggestions?.length > 0 && !formData.seat_count) {
      const seatSuggestion = smartSuggestions['seat_count'].suggestions[0]
      console.log(`🤖 Auto-applying Sitzplätze: ${seatSuggestion.value} (${seatSuggestion.confidence}%)`)
      updateFormData({ seat_count: seatSuggestion.value })
    }
    
  }, [smartSuggestions, formData, updateFormData])

  // Auto-Apply Equipment Keywords
  useEffect(() => {
    console.log('🔍 Step 3: Equipment Keywords Auto-Apply check, suggestions available:', smartSuggestions['equipment_keywords']?.suggestions?.length || 0)
    console.log('🔍 Step 3: Current selected equipment count:', selectedEquipment.length)
    console.log('🔍 Step 3: Total equipment items loaded:', equipment.length)
    
    if (smartSuggestions['equipment_keywords']?.suggestions?.length > 0 && selectedEquipment.length === 0) {
      const keywordSuggestion = smartSuggestions['equipment_keywords'].suggestions[0]
      const mappedEquipment = keywordSuggestion.value as Array<{id: string, name: string, confidence: number}>
      console.log('🎯 Step 3: Auto-applying mapped equipment:', mappedEquipment.map(e => `${e.name} (${e.confidence}%)`))
      
      // Die Equipment-IDs sind bereits gemappt - direkt verwenden
      const equipmentIds = mappedEquipment.map(item => item.id)
      console.log('🎯 Step 3: Equipment IDs für Auto-Apply:', equipmentIds)
      
      if (equipmentIds.length > 0) {
        console.log(`🤖 Auto-selecting equipment: ${equipmentIds.length} items (${keywordSuggestion.confidence}%)`)
        console.log('🤖 Equipment Namen:', mappedEquipment.map(e => e.name).join(', '))
        setSelectedEquipment(equipmentIds)
        updateFormData({ equipment: equipmentIds })
      }
    }
  }, [smartSuggestions, equipment, selectedEquipment, updateFormData])

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
      {/* Fixer Container für Analysis Badge - verhindert Layout-Shift */}
      <div className="h-8 flex items-center">
        <AnalysisBadge 
          isAnalyzing={isAnalyzing}
          isSuccess={fieldsIdentified > 0}
        />
      </div>
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
            {/* KI-Indikator für Außenfarbe */}
            {smartSuggestions['exterior_color']?.suggestions?.length > 0 && formData.exterior_color && (
              <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                ✓ Automatisch übernommen aus PDF ({smartSuggestions['exterior_color'].suggestions[0].confidence}%)
              </div>
            )}
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
            {/* KI-Indikator für Innenraumfarbe */}
            {smartSuggestions['interior_color']?.suggestions?.length > 0 && formData.interior_color && (
              <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                ✓ Automatisch übernommen aus PDF ({smartSuggestions['interior_color'].suggestions[0].confidence}%)
              </div>
            )}
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
          {/* KI-Indikator für Material */}
          {smartSuggestions['interior_material']?.suggestions?.length > 0 && formData.interior_material && (
            <div className="mt-1 text-xs text-green-600 dark:text-green-400">
              ✓ Automatisch übernommen aus PDF ({smartSuggestions['interior_material'].suggestions[0].confidence}%)
            </div>
          )}
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
            {/* KI-Indikator für Türen */}
            {smartSuggestions['door_count']?.suggestions?.length > 0 && formData.door_count && (
              <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                ✓ Automatisch übernommen ({smartSuggestions['door_count'].suggestions[0].confidence}%)
              </div>
            )}
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
            {/* KI-Indikator für Sitzplätze */}
            {smartSuggestions['seat_count']?.suggestions?.length > 0 && formData.seat_count && (
              <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                ✓ Automatisch übernommen ({smartSuggestions['seat_count'].suggestions[0].confidence}%)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ausstattungsmerkmale */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">Ausstattungsmerkmale</h3>
          <div className="flex items-center gap-4">
            {/* Streaming-Indikator */}
            {streamingEquipment && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 animate-pulse">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>KI analysiert Ausstattung...</span>
                {equipmentProgress.total > 0 && (
                  <span className="text-xs">({equipmentProgress.current}/{equipmentProgress.total})</span>
                )}
              </div>
            )}
            
            {/* KI-Equipment-Indikator mit Details */}
            {!streamingEquipment && smartSuggestions['equipment_keywords']?.suggestions?.length > 0 && selectedEquipment.length > 0 && (
              <div className="text-xs text-green-600 dark:text-green-400">
                <div className="flex items-center gap-1 mb-1">
                  ✓ {selectedEquipment.length} Merkmale automatisch erkannt ({smartSuggestions['equipment_keywords'].suggestions[0].confidence}%)
                </div>
                {(() => {
                  const mappedEquipment = smartSuggestions['equipment_keywords'].suggestions[0].value as Array<{id: string, name: string, confidence: number}>
                  return mappedEquipment.length > 0 && (
                    <div className="text-xs text-green-500 dark:text-green-400">
                      {mappedEquipment.slice(0, 5).map(e => e.name).join(', ')}
                      {mappedEquipment.length > 5 && ` +${mappedEquipment.length - 5} weitere`}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
        
        {/* AI Thoughts Display (nur während Streaming) */}
        {streamingEquipment && aiThoughts.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 space-y-1">
            <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">🤖 KI-Analyse läuft:</div>
            {aiThoughts.slice(-3).map((thought, index) => (
              <div key={index} className="text-xs text-blue-600 dark:text-blue-400">
                • {thought}
              </div>
            ))}
          </div>
        )}
        
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