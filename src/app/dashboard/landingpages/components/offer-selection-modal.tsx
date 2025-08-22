'use client'

import { useState, useEffect } from 'react'
import { X, ArrowRight, File02, Calendar, Truck01 } from '@untitledui/icons'
import { Button } from '@/components/base/buttons/button'
import { Badge } from '@/components/base/badges/badges'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface Offer {
  id: string
  title: string
  make: string
  model: string
  variant: string
  status: string
  created_at: string
  has_landing_page?: boolean
}

interface OfferSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectOffer: (offerId: string) => void
}

export function OfferSelectionModal({
  isOpen,
  onClose,
  onSelectOffer
}: OfferSelectionModalProps) {
  const [offers, setOffers] = useState<Offer[]>([])
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadOffers()
    }
  }, [isOpen])

  const loadOffers = async () => {
    setLoading(true)
    try {
      const supabase = await createClient()
      
      // Hole alle Angebote - nur die wichtigsten Felder
      const { data: offersData, error } = await supabase
        .from('offer')
        .select('id, title, make_id, model, variant, status, created_at')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Fehler beim Laden der Angebote:', error)
        // Setze Demo-Daten falls Query fehlschlägt
        setOffers([
          {
            id: 'demo-1',
            title: 'BMW X5 xDrive40d M-Sport',
            make: 'BMW',
            model: 'X5',
            variant: 'xDrive40d M-Sport',
            status: 'active',
            created_at: new Date().toISOString(),
            has_landing_page: false
          }
        ])
        return
      }

      // Prüfe für jedes Angebot, ob eine Landing Page existiert
      const offersWithLandingPageStatus = await Promise.all(
        (offersData || []).map(async (offer) => {
          const { data: landingPage } = await supabase
            .from('landing_pages')
            .select('id')
            .eq('offer_id', offer.id)
            .maybeSingle() // Verwende maybeSingle statt single
          
          return {
            ...offer,
            has_landing_page: !!landingPage
          }
        })
      )

      // Transformiere die Daten
      const transformedOffers = offersWithLandingPageStatus.map(offer => ({
        id: offer.id,
        title: offer.title || `${offer.make_id || 'Unbekannt'} ${offer.model || ''}`,
        make: offer.make_id || 'Unbekannt',
        model: offer.model || '',
        variant: offer.variant || '',
        status: offer.status || 'draft',
        created_at: offer.created_at,
        has_landing_page: offer.has_landing_page
      }))

      setOffers(transformedOffers)
    } catch (error) {
      console.error('Fehler beim Laden der Angebote:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (selectedOfferId) {
      onSelectOffer(selectedOfferId)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-display-xs font-semibold text-gray-900">
                Angebot auswählen
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Wählen Sie ein Angebot als Basis für Ihre neue Landing Page
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                <p className="text-sm text-gray-600 mt-2">Lade Angebote...</p>
              </div>
            ) : offers.length === 0 ? (
              <div className="text-center py-8">
                <File02 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Keine Angebote vorhanden</p>
                <p className="text-sm text-gray-500 mt-1">
                  Erstellen Sie zuerst ein Angebot, um eine Landing Page zu generieren
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {offers.map((offer) => (
                  <label
                    key={offer.id}
                    className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedOfferId === offer.id
                        ? 'border-brand-600 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="offer"
                        value={offer.id}
                        checked={selectedOfferId === offer.id}
                        onChange={() => setSelectedOfferId(offer.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {offer.title}
                            </h3>
                            {offer.variant && (
                              <p className="text-sm text-gray-600 mt-0.5">
                                {offer.variant}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {offer.has_landing_page && (
                              <Badge color="info" type="pill" size="sm">
                                Hat Landing Page
                              </Badge>
                            )}
                            <Badge 
                              color={offer.status === 'active' ? 'success' : 'gray'} 
                              type="pill" 
                              size="sm"
                            >
                              {offer.status === 'active' ? 'Aktiv' : 'Entwurf'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Truck01 className="w-3.5 h-3.5" />
                            {offer.make} {offer.model}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(offer.created_at), 'dd. MMM yyyy', { locale: de })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <Button
              color="secondary"
              onClick={onClose}
            >
              Abbrechen
            </Button>
            <Button
              iconTrailing={ArrowRight}
              onClick={handleConfirm}
              disabled={!selectedOfferId}
            >
              Weiter zum Wizard
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}