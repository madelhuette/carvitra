'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/base/input/input'
import { Select } from '@/components/base/select/select'
import { Label } from '@/components/base/input/label'
import { Button } from '@/components/base/buttons/button'
import { Checkbox } from '@/components/base/checkbox/checkbox'
import { Plus, Trash02 } from '@untitledui/icons'
import { useWizardContext } from '../wizard-context'
import { createClient } from '@/lib/supabase/client'
import { CreditOfferData } from '@/types/wizard.types'
import { useAutoAnalysis } from '@/hooks/useAutoAnalysis'
import { SkeletonInput, SkeletonSelect, SkeletonCheckbox } from '@/components/base/skeleton/skeleton'

export function StepFinancing() {
  const { formData, updateFormData, autoFillWithAI, extractedData, setAnalysisState, stepAnalysisCompleted } = useWizardContext()
  const [creditInstitutions, setCreditInstitutions] = useState<any[]>([])
  const [creditOfferTypes, setCreditOfferTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creditOffers, setCreditOffers] = useState<CreditOfferData[]>(formData.credit_offers || [])
  const supabase = createClient()
  
  // Auto-Analyse beim ersten Betreten des Steps
  const { isAnalyzing } = useAutoAnalysis({
    stepNumber: 5,
    extractedData,
    autoFillFunction: autoFillWithAI,
    skipIfDataExists: creditOffers.length > 0 || stepAnalysisCompleted[5],
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
    loadSelectOptions()
  }, [])

  useEffect(() => {
    updateFormData({ credit_offers: creditOffers })
  }, [creditOffers])

  const loadSelectOptions = async () => {
    try {
      const [institutionsRes, typesRes] = await Promise.all([
        supabase.from('credit_institutions').select('*').order('company_name'),
        supabase.from('credit_offer_types').select('*').order('name')
      ])

      if (institutionsRes.data) setCreditInstitutions(institutionsRes.data)
      if (typesRes.data) setCreditOfferTypes(typesRes.data)
    } catch (error) {
      console.error('Error loading select options:', error)
    } finally {
      setLoading(false)
    }
  }


  const addCreditOffer = () => {
    const newOffer: CreditOfferData = {
      id: `temp-${Date.now()}`,
      institution_name: '',
      credit_type: '',
      duration_months: undefined,
      down_payment: undefined,
      monthly_rate: undefined,
      final_rate: undefined,
      total_amount: undefined,
      interest_rate: undefined,
      km_per_year: undefined,
      terms: {}
    }
    setCreditOffers([...creditOffers, newOffer])
  }

  const removeCreditOffer = (index: number) => {
    setCreditOffers(creditOffers.filter((_, i) => i !== index))
  }

  const updateCreditOffer = (index: number, field: keyof CreditOfferData, value: any) => {
    const updated = [...creditOffers]
    updated[index] = { ...updated[index], [field]: value }
    setCreditOffers(updated)
  }

  return (
    <div className="space-y-6">
      {/* Finanzierung verfügbar */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="financingAvailable"
          checked={formData.financing_available ?? false}
          onChange={(checked) => updateFormData({ financing_available: checked })}
        />
        <label htmlFor="financingAvailable" className="text-sm font-medium text-primary">
          Finanzierung/Leasing anbieten
        </label>
      </div>

      {formData.financing_available && (
        <>
          {/* Finanzierungsangebote */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-primary">Finanzierungsangebote</h3>
              <Button
                variant="secondary"
                size="sm"
                iconLeading={Plus}
                onClick={addCreditOffer}
              >
                Angebot hinzufügen
              </Button>
            </div>

            {creditOffers.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-secondary rounded-lg">
                <p className="text-secondary mb-4">Noch keine Finanzierungsangebote</p>
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeading={Plus}
                  onClick={addCreditOffer}
                >
                  Erstes Angebot hinzufügen
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {creditOffers.map((offer, index) => (
                  <div key={offer.id} className="p-4 border border-secondary rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-primary">Angebot {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        onClick={() => removeCreditOffer(index)}
                      >
                        <Trash02 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor={`institution-${index}`}>Finanzierungsinstitut</Label>
                        <Select
                          id={`institution-${index}`}
                          placeholder="Wählen Sie ein Institut"
                          selectedKey={offer.institution_name || null}
                          onSelectionChange={(key) => updateCreditOffer(index, 'institution_name', key as string)}
                          disabled={loading}
                        >
                          {creditInstitutions.map((inst) => (
                            <Select.Item key={inst.company_name} id={inst.company_name} label={inst.company_name} />
                          ))}
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor={`type-${index}`}>Angebotstyp</Label>
                        <Select
                          id={`type-${index}`}
                          placeholder="Wählen Sie einen Typ"
                          value={offer.credit_type || ''}
                          onSelectionChange={(value) => updateCreditOffer(index, 'credit_type', value)}
                          disabled={loading}
                        >
                          {creditOfferTypes.map((type) => (
                            <Select.Item key={type.id} id={type.name} label={type.name} />
                          ))}
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <Label htmlFor={`duration-${index}`}>Laufzeit (Monate)</Label>
                        <Input
                          id={`duration-${index}`}
                          type="number"
                          placeholder="z.B. 36"
                          value={offer.duration_months || ''}
                          onChange={(value) => updateCreditOffer(index, 'duration_months', parseInt(value) || undefined)}
                        />
                      </div>

                      <div>
                        <Label htmlFor={`downpayment-${index}`}>Anzahlung (€)</Label>
                        <Input
                          id={`downpayment-${index}`}
                          type="number"
                          step="0.01"
                          placeholder="z.B. 5000"
                          value={offer.down_payment || ''}
                          onChange={(value) => updateCreditOffer(index, 'down_payment', parseFloat(value) || undefined)}
                        />
                      </div>

                      <div>
                        <Label htmlFor={`kmyear-${index}`}>Km/Jahr</Label>
                        <Input
                          id={`kmyear-${index}`}
                          type="number"
                          placeholder="z.B. 10000"
                          value={offer.km_per_year || ''}
                          onChange={(value) => updateCreditOffer(index, 'km_per_year', parseInt(value) || undefined)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <Label htmlFor={`monthly-${index}`}>Monatsrate (€) *</Label>
                        <Input
                          id={`monthly-${index}`}
                          type="number"
                          step="0.01"
                          placeholder="z.B. 299"
                          value={offer.monthly_rate || ''}
                          onChange={(value) => updateCreditOffer(index, 'monthly_rate', parseFloat(value) || undefined)}
                        />
                      </div>

                      <div>
                        <Label htmlFor={`final-${index}`}>Schlussrate (€)</Label>
                        <Input
                          id={`final-${index}`}
                          type="number"
                          step="0.01"
                          placeholder="z.B. 15000"
                          value={offer.final_rate || ''}
                          onChange={(value) => updateCreditOffer(index, 'final_rate', parseFloat(value) || undefined)}
                        />
                      </div>

                      <div>
                        <Label htmlFor={`interest-${index}`}>Zinssatz (%)</Label>
                        <Input
                          id={`interest-${index}`}
                          type="number"
                          step="0.01"
                          placeholder="z.B. 3.99"
                          value={offer.interest_rate || ''}
                          onChange={(value) => updateCreditOffer(index, 'interest_rate', parseFloat(value) || undefined)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`total-${index}`}>Gesamtbetrag (€)</Label>
                      <Input
                        id={`total-${index}`}
                        type="number"
                        step="0.01"
                        placeholder="Wird automatisch berechnet"
                        value={offer.total_amount || ''}
                        onChange={(value) => updateCreditOffer(index, 'total_amount', parseFloat(value) || undefined)}
                        hint="Gesamtsumme aller Zahlungen über die Laufzeit"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}