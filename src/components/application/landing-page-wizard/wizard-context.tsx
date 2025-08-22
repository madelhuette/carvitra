'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WizardContextType, WizardStep, OfferWizardData, AnalysisResult } from '@/types/wizard.types'
import { useRouter } from 'next/navigation'

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    label: 'Fahrzeugdaten',
    description: 'Grundlegende Fahrzeuginformationen',
    completed: false,
    current: true
  },
  {
    id: 2,
    label: 'Technische Details',
    description: 'Motor, Antrieb und Verbrauch',
    completed: false,
    current: false
  },
  {
    id: 3,
    label: 'Ausstattung',
    description: 'Farben und Ausstattungsmerkmale',
    completed: false,
    current: false
  },
  {
    id: 4,
    label: 'Verfügbarkeit',
    description: 'Preise und Liefertermin',
    completed: false,
    current: false
  },
  {
    id: 5,
    label: 'Finanzierung',
    description: 'Leasing- und Finanzierungsangebote',
    completed: false,
    current: false
  },
  {
    id: 6,
    label: 'Ansprechpartner',
    description: 'Verkäufer auswählen',
    completed: false,
    current: false
  },
  {
    id: 7,
    label: 'Marketing',
    description: 'Texte und URL festlegen',
    completed: false,
    current: false
  }
]

const WizardContext = createContext<WizardContextType | undefined>(undefined)

export function useWizardContext() {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error('useWizardContext must be used within WizardProvider')
  }
  return context
}

interface WizardProviderProps {
  children: React.ReactNode
  offerId?: string
  pdfDocumentId?: string
  initialData?: OfferWizardData
  extractedData?: any
}

export function WizardProvider({
  children,
  offerId,
  pdfDocumentId,
  initialData = {},
  extractedData
}: WizardProviderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [steps, setSteps] = useState(WIZARD_STEPS)
  const [formData, setFormData] = useState<OfferWizardData>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null)
  const [stepAnalysisCompleted, setStepAnalysisCompleted] = useState<Record<number, boolean>>({})
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)
  const [smartSuggestionsCache, setSmartSuggestionsCache] = useState<Record<number, Record<string, any>>>({})
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set())

  // Update steps when currentStep changes
  useEffect(() => {
    setSteps(prevSteps => 
      prevSteps.map(step => ({
        ...step,
        current: step.id === currentStep,
        completed: step.id < currentStep
      }))
    )
  }, [currentStep])

  // Auto-save every 30 seconds (only if we have an offerId)
  useEffect(() => {
    // Skip auto-save if no offerId
    if (!offerId) return
    
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }

    const timer = setTimeout(() => {
      saveProgress()
    }, 30000) // 30 seconds

    setAutoSaveTimer(timer)

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [formData, offerId])

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= WIZARD_STEPS.length) {
      setCurrentStep(step)
    }
  }, [])

  const goNext = useCallback(() => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep])

  const goPrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const updateFormData = useCallback((data: Partial<OfferWizardData>, isAiFilled: boolean = false) => {
    setFormData(prev => ({ ...prev, ...data }))
    // Track AI-filled fields with functional update to preserve existing fields
    if (isAiFilled) {
      setAiFilledFields(prev => {
        const newAiFields = new Set(prev)
        Object.keys(data).forEach(key => {
          newAiFields.add(key)
          console.log(`🤖 Marking field as AI-filled: ${key}`)
        })
        console.log(`📊 Total AI-filled fields: ${newAiFields.size}`, Array.from(newAiFields))
        return newAiFields
      })
    }
  }, [])

  const saveProgress = useCallback(async () => {
    if (!offerId) {
      console.log('No offerId available, skipping save')
      return
    }

    setIsSaving(true)
    try {
      // Prepare data for the offer table
      const updateData: any = {
        // Vehicle basics (Step 1)
        make_id: formData.make_id || null,
        model: formData.model || null,
        trim: formData.trim || null,
        vehicle_category_id: formData.vehicle_category_id || null,
        vehicle_type_id: formData.vehicle_type_id || null,
        
        // Technical details (Step 2)
        fuel_type_id: formData.fuel_type_id || null,
        transmission_type_id: formData.transmission_type_id || null,
        power_ps: formData.power_ps || null,
        power_kw: formData.power_kw || null,
        displacement: formData.displacement || null,
        cylinder_count: formData.cylinder_count || null,
        fuel_consumption_fossil: formData.fuel_consumption_fossil || null,
        fuel_consumption_electric: formData.fuel_consumption_electric || null,
        co2_emissions: formData.co2_emissions || null,
        emission_class: formData.emission_class || null,
        battery_capacity_gross: formData.battery_capacity_gross || null,
        battery_capacity_usable: formData.battery_capacity_usable || null,
        
        // Equipment & Colors (Step 3)
        exterior_color: formData.exterior_color || null,
        interior_color: formData.interior_color || null,
        interior_material: formData.interior_material || null,
        door_count: formData.door_count || null,
        seat_count: formData.seat_count || null,
        
        // Availability & Prices (Step 4)
        availability_type_id: formData.availability_type_id || null,
        availability_date: formData.availability_date || null,
        list_price_gross: formData.list_price_gross || null,
        list_price_net: formData.list_price_net || null,
        first_registration: formData.first_registration || null,
        mileage_count: formData.mileage_count || null,
        owner_count: formData.owner_count || null,
        accident_free: formData.accident_free || null,
        
        // Contact (Step 6)
        sales_person_id: formData.sales_person_id || null,
        
        // Marketing (Step 7)
        seo_title: formData.seo_title || null,
        seo_description: formData.seo_description || null,
        marketing_headline: formData.marketing_headline || null,
        marketing_description: formData.marketing_description || null,
        slug: formData.slug || null,
        
        // Meta
        offer_type_id: formData.offer_type_id || null,
        financing_available: formData.financing_available || false,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('offer')
        .update(updateData)
        .eq('id', offerId)
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('No data returned from update')

      // Save credit offers if present (Step 5)
      if (formData.credit_offers && formData.credit_offers.length > 0) {
        // First delete existing credit offers
        await supabase
          .from('credit_offers')
          .delete()
          .eq('offer_id', offerId)

        // Then insert new ones
        const creditOffersData = formData.credit_offers.map(co => ({
          ...co,
          offer_id: offerId
        }))

        const { error: creditError } = await supabase
          .from('credit_offers')
          .insert(creditOffersData)

        if (creditError) {
          console.error('Error saving credit offers:', creditError)
        }
      }

      // Save equipment selection if present (Step 3)
      if (formData.equipment && formData.equipment.length > 0) {
        // First delete existing equipment associations
        await supabase
          .from('offer_equipment')
          .delete()
          .eq('offer_id', offerId)

        // Then insert new ones
        const equipmentData = formData.equipment.map(equipmentId => ({
          offer_id: offerId,
          equipment_id: equipmentId
        }))

        const { error: equipmentError } = await supabase
          .from('offer_equipment')
          .insert(equipmentData)

        if (equipmentError) {
          console.error('Error saving equipment:', equipmentError)
        }
      }
      
      console.log('Progress saved successfully for offer:', offerId)
    } catch (error) {
      console.error('Error saving progress for offer', offerId, ':', error)
    } finally {
      setIsSaving(false)
    }
  }, [offerId, formData, currentStep, supabase])

  const publishLandingPage = useCallback(async () => {
    if (!offerId) {
      console.error('No offerId available for publishing')
      return false
    }

    setIsSaving(true)
    try {
      // First save all current progress
      await saveProgress()

      // Then mark the wizard as completed and create the landing page
      const { data, error } = await supabase
        .from('offer')
        .update({
          wizard_completed: true,
          wizard_current_step: 7,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId)
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('No data returned from publish')

      // Create landing page entry
      const { data: landingPage, error: lpError } = await supabase
        .from('landing_pages')
        .insert({
          offer_id: offerId,
          organization_id: data.organization_id,
          title: formData.seo_title || `${formData.make} ${formData.model}`,
          slug: formData.slug || `${formData.make}-${formData.model}`.toLowerCase().replace(/\s+/g, '-'),
          status: 'published',
          published_at: new Date().toISOString()
        })
        .select()
        .single()

      if (lpError) {
        console.error('Error creating landing page:', lpError)
        // Don't throw here, the offer is saved at least
      }

      console.log('Landing page published successfully:', landingPage)
      return true
    } catch (error) {
      console.error('Error publishing landing page:', error)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [offerId, formData, saveProgress, supabase])

  const autoFillWithAI = useCallback(async (step: number) => {
    if (!extractedData) return
    
    // Mark step as analyzed
    setStepAnalysisCompleted(prev => ({ ...prev, [step]: true }))

    setIsLoading(true)
    try {
      const response = await fetch('/api/wizard/autofill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          step,
          currentData: formData,
          extractedData
        })
      })

      if (!response.ok) throw new Error('Failed to auto-fill')

      const result = await response.json()
      updateFormData(result.fields, true) // Mark as AI-filled
      
      // Return analysis metadata
      return {
        fieldsIdentified: result.fieldsIdentified || 0,
        confidence: result.confidence || 0,
        fieldConfidences: result.fieldConfidences || {},
        mappingResults: result.mappingResults || {}
      }
      
    } catch (error) {
      console.error('Error auto-filling with AI:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [extractedData, formData])
  
  const setAnalysisState = useCallback((analyzing: boolean, results?: AnalysisResult | null) => {
    setIsAnalyzing(analyzing)
    if (results !== undefined) {
      setAnalysisResults(results)
    }
  }, [])

  // Smart Suggestions Cache Management
  const getCachedSuggestions = useCallback((stepNumber: number) => {
    return smartSuggestionsCache[stepNumber] || {}
  }, [smartSuggestionsCache])

  const setCachedSuggestions = useCallback((stepNumber: number, suggestions: Record<string, any>) => {
    setSmartSuggestionsCache(prev => ({
      ...prev,
      [stepNumber]: suggestions
    }))
  }, [])

  const value: WizardContextType = {
    currentStep,
    steps,
    formData,
    offerId,
    pdfDocumentId,
    extractedData,
    isLoading,
    isSaving,
    isAnalyzing,
    analysisResults,
    stepAnalysisCompleted,
    aiFilledFields,
    goToStep,
    goNext,
    goPrevious,
    updateFormData,
    saveProgress,
    publishLandingPage,
    autoFillWithAI,
    setAnalysisState,
    getCachedSuggestions,
    setCachedSuggestions
  }

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  )
}