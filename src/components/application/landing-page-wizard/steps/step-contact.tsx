'use client'

import { useEffect, useState } from 'react'
import { Select } from '@/components/base/select/select'
import { Input } from '@/components/base/input/input'
import { Label } from '@/components/base/input/label'
import { Button } from '@/components/base/buttons/button'
import { Plus, User01 } from '@untitledui/icons'
import { useWizardContext } from '../wizard-context'
import { createClient } from '@/lib/supabase/client'

interface SalesPerson {
  id: string
  salutation?: string
  first_name?: string
  last_name: string
  email?: string
  phone?: string
  mobile?: string
  position?: string
}

interface Dealer {
  id: string
  company_name: string
  street?: string
  street_number?: string
  postal_code?: string
  city?: string
  phone?: string
  email?: string
  website?: string
}

export function StepContact() {
  const { formData, updateFormData } = useWizardContext()
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([])
  const [dealer, setDealer] = useState<Dealer | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewSalesPersonForm, setShowNewSalesPersonForm] = useState(false)
  const [newSalesPerson, setNewSalesPerson] = useState<Partial<SalesPerson>>({})
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Get current user and organization
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (!userData?.organization_id) return

      // Load dealer info for the organization
      const { data: dealerData } = await supabase
        .from('dealers')
        .select('*')
        .eq('organization_id', userData.organization_id)
        .single()

      if (dealerData) {
        setDealer(dealerData)
      }

      // Load sales persons for the organization
      const { data: salesData } = await supabase
        .from('sales_persons')
        .select('*')
        .eq('organization_id', userData.organization_id)
        .order('last_name')

      if (salesData) {
        setSalesPersons(salesData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSalesPerson = async () => {
    if (!newSalesPerson.last_name) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (!userData?.organization_id) return

      const { data, error } = await supabase
        .from('sales_persons')
        .insert({
          ...newSalesPerson,
          organization_id: userData.organization_id,
          dealer_id: dealer?.id
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setSalesPersons([...salesPersons, data])
        updateFormData({ sales_person_id: data.id })
        setShowNewSalesPersonForm(false)
        setNewSalesPerson({})
      }
    } catch (error) {
      console.error('Error adding sales person:', error)
    }
  }

  const formatSalesPersonName = (person: SalesPerson) => {
    const parts = []
    if (person.salutation) parts.push(person.salutation)
    if (person.first_name) parts.push(person.first_name)
    parts.push(person.last_name)
    if (person.position) parts.push(`(${person.position})`)
    return parts.join(' ')
  }

  return (
    <div className="space-y-6">
      {/* Händlerinformationen (Read-only) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-primary">Ihr Autohaus</h3>
        
        {loading ? (
          <div className="text-sm text-secondary">Lade Händlerinformationen...</div>
        ) : dealer ? (
          <div className="p-4 bg-secondary rounded-lg space-y-2">
            <p className="font-medium text-primary">{dealer.company_name}</p>
            {dealer.street && dealer.street_number && (
              <p className="text-sm text-secondary">
                {dealer.street} {dealer.street_number}
              </p>
            )}
            {dealer.postal_code && dealer.city && (
              <p className="text-sm text-secondary">
                {dealer.postal_code} {dealer.city}
              </p>
            )}
            {dealer.phone && (
              <p className="text-sm text-secondary">
                Tel: {dealer.phone}
              </p>
            )}
            {dealer.email && (
              <p className="text-sm text-secondary">
                E-Mail: {dealer.email}
              </p>
            )}
            {dealer.website && (
              <p className="text-sm text-secondary">
                Web: {dealer.website}
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
            <p className="text-sm text-warning-700 dark:text-warning-300">
              Noch keine Händlerinformationen hinterlegt. Bitte kontaktieren Sie Ihren Administrator.
            </p>
          </div>
        )}
      </div>

      {/* Ansprechpartner-Auswahl */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">Ansprechpartner</h3>
          {!showNewSalesPersonForm && (
            <Button
              variant="secondary"
              size="sm"
              iconLeading={Plus}
              onClick={() => setShowNewSalesPersonForm(true)}
            >
              Neuer Verkäufer
            </Button>
          )}
        </div>

        {!showNewSalesPersonForm ? (
          <div>
            <Label htmlFor="salesPerson">Verkäufer auswählen *</Label>
            <Select
              id="salesPerson"
              placeholder="Wählen Sie einen Ansprechpartner"
              value={formData.sales_person_id || ''}
              onSelectionChange={(value) => updateFormData({ sales_person_id: value })}
              disabled={loading || salesPersons.length === 0}
            >
              {salesPersons.map((person) => (
                <Select.Item key={person.id} id={person.id} label={formatSalesPersonName(person)} />
              ))}
            </Select>
            {salesPersons.length === 0 && !loading && (
              <p className="mt-2 text-sm text-secondary">
                Noch keine Verkäufer angelegt. Fügen Sie einen neuen Verkäufer hinzu.
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 border border-secondary rounded-lg space-y-4">
            <h4 className="font-medium text-primary flex items-center gap-2">
              <User01 className="h-4 w-4" />
              Neuen Verkäufer anlegen
            </h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="newSalutation">Anrede</Label>
                <Select
                  id="newSalutation"
                  placeholder="Wählen"
                  value={newSalesPerson.salutation || ''}
                  onSelectionChange={(value) => setNewSalesPerson({ ...newSalesPerson, salutation: value })}
                >
                  <Select.Item id="Herr" label="Herr" />
                  <Select.Item id="Frau" label="Frau" />
                  <Select.Item id="Dr." label="Dr." />
                  <Select.Item id="Prof." label="Prof." />
                </Select>
              </div>

              <div>
                <Label htmlFor="newPosition">Position</Label>
                <Input
                  id="newPosition"
                  type="text"
                  placeholder="z.B. Verkaufsberater"
                  value={newSalesPerson.position || ''}
                  onChange={(value) => setNewSalesPerson({ ...newSalesPerson, position: value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="newFirstName">Vorname</Label>
                <Input
                  id="newFirstName"
                  type="text"
                  placeholder="Max"
                  value={newSalesPerson.first_name || ''}
                  onChange={(value) => setNewSalesPerson({ ...newSalesPerson, first_name: value })}
                />
              </div>

              <div>
                <Label htmlFor="newLastName">Nachname *</Label>
                <Input
                  id="newLastName"
                  type="text"
                  placeholder="Mustermann"
                  value={newSalesPerson.last_name || ''}
                  onChange={(value) => setNewSalesPerson({ ...newSalesPerson, last_name: value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="newEmail">E-Mail</Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="max.mustermann@autohaus.de"
                  value={newSalesPerson.email || ''}
                  onChange={(value) => setNewSalesPerson({ ...newSalesPerson, email: value })}
                />
              </div>

              <div>
                <Label htmlFor="newPhone">Telefon</Label>
                <Input
                  id="newPhone"
                  type="tel"
                  placeholder="+49 30 12345678"
                  value={newSalesPerson.phone || ''}
                  onChange={(value) => setNewSalesPerson({ ...newSalesPerson, phone: value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="newMobile">Mobil</Label>
              <Input
                id="newMobile"
                type="tel"
                placeholder="+49 170 12345678"
                value={newSalesPerson.mobile || ''}
                onChange={(value) => setNewSalesPerson({ ...newSalesPerson, mobile: value })}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowNewSalesPersonForm(false)
                  setNewSalesPerson({})
                }}
              >
                Abbrechen
              </Button>
              <Button
                variant="primary"
                onClick={handleAddSalesPerson}
                disabled={!newSalesPerson.last_name}
              >
                Verkäufer speichern
              </Button>
            </div>
          </div>
        )}

        {/* Selected sales person details */}
        {formData.sales_person_id && !showNewSalesPersonForm && (
          <div className="mt-4">
            {(() => {
              const selected = salesPersons.find(p => p.id === formData.sales_person_id)
              if (!selected) return null
              
              return (
                <div className="p-4 bg-secondary rounded-lg space-y-2">
                  <p className="font-medium text-primary">
                    {formatSalesPersonName(selected)}
                  </p>
                  {selected.email && (
                    <p className="text-sm text-secondary">E-Mail: {selected.email}</p>
                  )}
                  {selected.phone && (
                    <p className="text-sm text-secondary">Tel: {selected.phone}</p>
                  )}
                  {selected.mobile && (
                    <p className="text-sm text-secondary">Mobil: {selected.mobile}</p>
                  )}
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}