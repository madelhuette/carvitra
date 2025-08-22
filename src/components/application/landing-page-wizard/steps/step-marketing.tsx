'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/base/input/input'
import { TextArea } from '@/components/base/textarea/textarea'
import { Label } from '@/components/base/input/label'
import { Button } from '@/components/base/buttons/button'
import { CheckCircle, AlertCircle, Lightbulb04 } from '@untitledui/icons'
import { useWizardContext } from '../wizard-context'
import { createClient } from '@/lib/supabase/client'
import { useAutoAnalysis } from '@/hooks/useAutoAnalysis'
import { SkeletonInput, SkeletonTextArea } from '@/components/base/skeleton/skeleton'
import { SmartFieldService } from '@/services/smart-field.service'
import type { SmartFieldResult } from '@/services/smart-field.service'

export function StepMarketing() {
  const { formData, updateFormData, autoFillWithAI, extractedData, setAnalysisState, stepAnalysisCompleted, pdfDocumentId } = useWizardContext()
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [slugTimer, setSlugTimer] = useState<NodeJS.Timeout | null>(null)
  const [smartSuggestions, setSmartSuggestions] = useState<Record<string, SmartFieldResult>>({})
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const supabase = createClient()
  
  // Auto-Analyse beim ersten Betreten des Steps
  const { isAnalyzing } = useAutoAnalysis({
    stepNumber: 7,
    extractedData,
    autoFillFunction: autoFillWithAI,
    skipIfDataExists: !!formData.seo_title || stepAnalysisCompleted[7],
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
    if (pdfDocumentId) {
      loadSmartSuggestions()
    }
  }, [pdfDocumentId])

  const loadSmartSuggestions = async () => {
    if (!pdfDocumentId) return
    
    setLoadingSuggestions(true)
    try {
      const smartService = new SmartFieldService(supabase)
      await smartService.initialize(pdfDocumentId)
      
      const suggestions = await smartService.getMarketingSuggestions()
      setSmartSuggestions(suggestions)
    } catch (error) {
      console.error('Failed to load marketing smart suggestions:', error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  // Auto-Apply KI-Vorschläge für Marketing
  useEffect(() => {
    if (Object.keys(smartSuggestions).length === 0) return
    
    // SEO Title Auto-Apply
    if (smartSuggestions['seo_title']?.suggestions?.length > 0 && !formData.seo_title) {
      const titleSuggestion = smartSuggestions['seo_title'].suggestions[0]
      console.log(`🤖 Auto-applying SEO-Titel: ${titleSuggestion.value} (${titleSuggestion.confidence}%)`)
      updateFormData({ seo_title: titleSuggestion.value })
    }
    
    // SEO Description Auto-Apply
    if (smartSuggestions['seo_description']?.suggestions?.length > 0 && !formData.seo_description) {
      const descSuggestion = smartSuggestions['seo_description'].suggestions[0]
      console.log(`🤖 Auto-applying SEO-Beschreibung: ${descSuggestion.value} (${descSuggestion.confidence}%)`)
      updateFormData({ seo_description: descSuggestion.value })
    }
    
    // URL Slug Auto-Apply
    if (smartSuggestions['url_slug']?.suggestions?.length > 0 && !formData.slug) {
      const slugSuggestion = smartSuggestions['url_slug'].suggestions[0]
      console.log(`🤖 Auto-applying URL-Slug: ${slugSuggestion.value} (${slugSuggestion.confidence}%)`)
      updateFormData({ slug: slugSuggestion.value })
    }
    
  }, [smartSuggestions, formData, updateFormData])

  useEffect(() => {
    // Auto-generate slug from model and make when they change
    if (!formData.slug && formData.model) {
      const generatedSlug = generateSlug()
      updateFormData({ slug: generatedSlug })
    }
  }, [formData.model, formData.make_id])

  const generateSlug = () => {
    const parts = []
    
    // Add make name if available
    if (formData.make_id) {
      // TODO: Get make name from ID
      parts.push('bmw') // Placeholder
    }
    
    // Add model
    if (formData.model) {
      parts.push(formData.model)
    }
    
    // Add trim if available
    if (formData.trim) {
      parts.push(formData.trim)
    }
    
    // Add "leasing" if financing available
    if (formData.financing_available) {
      parts.push('leasing')
    }
    
    // Convert to slug format
    return parts
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const checkSlugAvailability = async (slug: string) => {
    if (!slug) {
      setSlugAvailable(null)
      return
    }

    setCheckingSlug(true)
    try {
      const { data, error } = await supabase
        .from('landingpages')
        .select('id')
        .eq('slug', slug)
        .single()

      setSlugAvailable(!data) // Available if no data found
    } catch (error: any) {
      // If error is "no rows", slug is available
      if (error?.code === 'PGRST116') {
        setSlugAvailable(true)
      } else {
        console.error('Error checking slug:', error)
        setSlugAvailable(null)
      }
    } finally {
      setCheckingSlug(false)
    }
  }

  const handleSlugChange = (value: string) => {
    // Format slug
    const formattedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    updateFormData({ slug: formattedSlug })
    
    // Debounce slug checking
    if (slugTimer) {
      clearTimeout(slugTimer)
    }
    const timer = setTimeout(() => {
      checkSlugAvailability(formattedSlug)
    }, 500)
    setSlugTimer(timer)
  }


  const generateMarketingText = async (field: string) => {
    // TODO: Implement AI text generation
    console.log('Generating text for:', field)
  }

  // Character counts
  const seoTitleLength = formData.seo_title?.length || 0
  const seoDescriptionLength = formData.seo_description?.length || 0

  return (
    <div className="space-y-6">
      {/* SEO-Optimierung */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">SEO-Optimierung</h3>
        
        <div>
          <Label htmlFor="seoTitle">SEO-Titel</Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                id="seoTitle"
                type="text"
                placeholder="BMW 320d Touring Leasing ab 299€ - Sofort verfügbar"
                value={formData.seo_title || ''}
                onChange={(value) => updateFormData({ seo_title: value })}
                maxLength={60}
                className="flex-1"
              />
              <Button
                variant="secondary"
                size="sm"
                iconLeading={Lightbulb04}
                onClick={() => generateMarketingText('seo_title')}
              >
                KI-Vorschlag
              </Button>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-secondary">
                Wird in Suchmaschinen angezeigt
              </span>
              <span className={seoTitleLength > 60 ? 'text-error-600' : 'text-secondary'}>
                {seoTitleLength}/60 Zeichen
              </span>
            </div>
            
            {/* KI-Indikator für SEO-Titel */}
            {smartSuggestions['seo_title']?.suggestions?.length > 0 && formData.seo_title && (
              <div className="text-xs text-green-600 dark:text-green-400">
                ✓ SEO-Titel automatisch generiert ({smartSuggestions['seo_title'].suggestions[0].confidence}%)
              </div>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="seoDescription">SEO-Beschreibung</Label>
          <div className="space-y-2">
            <TextArea
              placeholder="Attraktives Leasingangebot für den BMW 320d Touring. Profitieren Sie von günstigen Konditionen und sofortiger Verfügbarkeit..."
              value={formData.seo_description || ''}
              onChange={(value) => updateFormData({ seo_description: value })}
              rows={3}
              textAreaClassName="flex-1"
            />
            <div className="flex items-start gap-2">
              <Button
                variant="secondary"
                size="sm"
                iconLeading={Lightbulb04}
                onClick={() => generateMarketingText('seo_description')}
              >
                KI-Vorschlag
              </Button>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-secondary">
                Beschreibung für Suchmaschinen
              </span>
              <span className={seoDescriptionLength > 160 ? 'text-error-600' : 'text-secondary'}>
                {seoDescriptionLength}/160 Zeichen
              </span>
            </div>
            
            {/* KI-Indikator für SEO-Beschreibung */}
            {smartSuggestions['seo_description']?.suggestions?.length > 0 && formData.seo_description && (
              <div className="text-xs text-green-600 dark:text-green-400">
                ✓ SEO-Beschreibung automatisch generiert ({smartSuggestions['seo_description'].suggestions[0].confidence}%)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Marketing-Texte */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Marketing-Texte</h3>
        
        <div>
          <Label htmlFor="headline">Marketing-Headline</Label>
          <div className="flex gap-2">
            <Input
              id="headline"
              type="text"
              placeholder="Ihr neuer BMW 320d Touring wartet auf Sie!"
              value={formData.marketing_headline || ''}
              onChange={(value) => updateFormData({ marketing_headline: value })}
              className="flex-1"
            />
            <Button
              variant="secondary"
              size="sm"
              iconLeading={Lightbulb04}
              onClick={() => generateMarketingText('marketing_headline')}
            >
              KI-Vorschlag
            </Button>
          </div>
          <p className="mt-1 text-xs text-secondary">
            Hauptüberschrift auf der Landing Page
          </p>
        </div>

        <div>
          <Label htmlFor="description">Marketing-Beschreibung</Label>
          <div className="space-y-2">
            <TextArea
              placeholder="Erleben Sie die perfekte Kombination aus Sportlichkeit und Komfort..."
              value={formData.marketing_description || ''}
              onChange={(value) => updateFormData({ marketing_description: value })}
              rows={6}
            />
            <Button
              variant="secondary"
              size="sm"
              iconLeading={Lightbulb04}
              onClick={() => generateMarketingText('marketing_description')}
            >
              KI-Vorschlag generieren
            </Button>
          </div>
          <p className="mt-1 text-xs text-secondary">
            Detaillierte Beschreibung für Interessenten
          </p>
        </div>
      </div>

      {/* URL-Slug */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Landing Page URL</h3>
        
        <div>
          <Label htmlFor="slug">URL-Pfad</Label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-secondary">carvitra.de/l/</span>
              <Input
                id="slug"
                type="text"
                placeholder="bmw-320d-touring-leasing"
                value={formData.slug || ''}
                onChange={handleSlugChange}
                className="flex-1"
              />
              {checkingSlug && (
                <div className="animate-spin h-4 w-4 border-2 border-brand rounded-full border-t-transparent" />
              )}
              {!checkingSlug && slugAvailable === true && (
                <CheckCircle className="h-5 w-5 text-success-600" />
              )}
              {!checkingSlug && slugAvailable === false && (
                <AlertCircle className="h-5 w-5 text-error-600" />
              )}
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-secondary">
                Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt
              </span>
              {slugAvailable === true && (
                <span className="text-success-600">URL ist verfügbar</span>
              )}
              {slugAvailable === false && (
                <span className="text-error-600">URL bereits vergeben</span>
              )}
            </div>
            
            {/* KI-Indikator für URL-Slug */}
            {smartSuggestions['url_slug']?.suggestions?.length > 0 && formData.slug && (
              <div className="text-xs text-green-600 dark:text-green-400">
                ✓ URL-Slug automatisch generiert ({smartSuggestions['url_slug'].suggestions[0].confidence}%)
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const newSlug = generateSlug()
              updateFormData({ slug: newSlug })
              checkSlugAvailability(newSlug)
            }}
          >
            Automatisch generieren
          </Button>
        </div>
      </div>

      {/* Vorschau-Link */}
      {formData.slug && slugAvailable && (
        <div className="p-4 bg-secondary rounded-lg">
          <p className="text-sm font-medium text-primary mb-1">Ihre Landing Page URL:</p>
          <p className="text-sm text-brand-600 font-mono">
            https://carvitra.de/l/{formData.slug}
          </p>
        </div>
      )}
    </div>
  )
}