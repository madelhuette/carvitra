'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/base/buttons/button'
import { Badge } from '@/components/base/badges/badges'
import { EmptyState } from '@/components/application/empty-state/empty-state'
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator'
import { ModalOverlay, Modal, Dialog } from '@/components/application/modals/modal'
import { PdfUploadDropZone } from '@/components/pdf/pdf-upload-dropzone'
import { FileTrigger } from '@/components/base/file-upload-trigger/file-upload-trigger'
import { Upload01, File02, CheckCircle, AlertCircle, Clock, Plus, Eye, Trash02, Download01, Lightbulb04, ArrowRight } from '@untitledui/icons'
import { PdfDocument } from '@/types/pdf.types'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

export function PdfLibrary() {
  const [documents, setDocuments] = useState<PdfDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState<string | null>(null)
  const [extractionResult, setExtractionResult] = useState<any>(null)
  const [extractionModalOpen, setExtractionModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<PdfDocument | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [progressMap, setProgressMap] = useState<Record<string, number>>({})
  const [pollingDocuments, setPollingDocuments] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    fetchDocuments()
    
    // Realtime-Subscription für pdf_documents Updates und Inserts
    const channel = supabase
      .channel('pdf-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'pdf_documents'
        },
        (payload: any) => {
          console.log('🔄 Realtime event received:', payload.eventType, payload)
          
          if (payload.eventType === 'UPDATE') {
            // Update das entsprechende Dokument in der Liste
            setDocuments(prevDocs => {
              const updatedDocs = prevDocs.map(doc => 
                doc.id === payload.new.id 
                  ? { ...doc, ...payload.new as PdfDocument }
                  : doc
              )
              console.log('✅ Documents updated:', updatedDocs)
              return updatedDocs
            })
            
            // Clear progress when ready
            const newStatus = payload.new.processing_status
            if (newStatus === 'ready' || newStatus === 'failed' || newStatus === 'needs_review') {
              setProgressMap(prev => {
                const newMap = { ...prev }
                delete newMap[payload.new.id]
                return newMap
              })
            }
          } else if (payload.eventType === 'INSERT') {
            // Neues Dokument zur Liste hinzufügen
            setDocuments(prevDocs => {
              // Prüfe ob Dokument schon existiert
              if (prevDocs.some(doc => doc.id === payload.new.id)) {
                console.log('⚠️ Document already exists, skipping INSERT')
                return prevDocs
              }
              const newDocs = [payload.new as PdfDocument, ...prevDocs]
              console.log('✅ Document inserted:', newDocs)
              return newDocs
            })
          } else if (payload.eventType === 'DELETE') {
            // Dokument aus der Liste entfernen
            setDocuments(prevDocs => 
              prevDocs.filter(doc => doc.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to realtime updates')
        }
      })
    
    // Cleanup bei Unmount
    return () => {
      console.log('🔌 Unsubscribing from realtime updates')
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('pdf_documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (files: FileList) => {
    if (files.length > 0) {
      setSelectedFile(files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/pdf/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      
      // Start progress animation
      startProgressAnimation(result.document.id)
      
      // Start polling als Fallback für Realtime
      startPollingForDocument(result.document.id)
      
      // Fallback: Manuell Dokument hinzufügen falls Realtime nicht funktioniert
      // Nach kurzer Verzögerung prüfen und ggf. manuell hinzufügen
      setTimeout(() => {
        setDocuments(prev => {
          if (!prev.some(doc => doc.id === result.document.id)) {
            console.log('⚠️ Document not received via realtime, adding manually')
            return [result.document, ...prev]
          }
          return prev
        })
      }, 500)
      
      // Close modal and reset
      setUploadModalOpen(false)
      setSelectedFile(null)
      
    } catch (error) {
      console.error('Upload error:', error)
      alert('Fehler beim Hochladen der Datei')
    } finally {
      setUploading(false)
    }
  }

  const handleExtractData = async (documentId: string) => {
    setExtracting(documentId)
    
    try {
      const response = await fetch('/api/pdf/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdf_document_id: documentId }),
      })

      if (!response.ok) {
        throw new Error('Extraktion fehlgeschlagen')
      }

      const result = await response.json()
      setExtractionResult(result)
      setExtractionModalOpen(true)
      
      // Update documents list
      await fetchDocuments()
      
    } catch (error) {
      console.error('Extraction error:', error)
      alert('Fehler bei der KI-Extraktion')
    } finally {
      setExtracting(null)
    }
  }

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return
    
    setDeleting(true)
    try {
      const response = await fetch('/api/pdf/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdf_document_id: documentToDelete.id }),
      })

      if (!response.ok) {
        throw new Error('Löschen fehlgeschlagen')
      }

      // Remove from documents list
      setDocuments(prev => prev.filter(doc => doc.id !== documentToDelete.id))
      
      // Close modal
      setDeleteModalOpen(false)
      setDocumentToDelete(null)
      
    } catch (error) {
      console.error('Delete error:', error)
      alert('Fehler beim Löschen der Datei')
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteModal = (doc: PdfDocument) => {
    setDocumentToDelete(doc)
    setDeleteModalOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      uploaded: { label: 'Wird analysiert', color: 'brand' as const, icon: Lightbulb04 },
      extracting: { label: 'KI-Analyse', color: 'brand' as const, icon: Lightbulb04 },
      ready: { label: 'Bereit', color: 'success' as const, icon: CheckCircle },
      needs_review: { label: 'Prüfung nötig', color: 'warning' as const, icon: AlertCircle },
      failed: { label: 'Fehler', color: 'error' as const, icon: AlertCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.uploaded
    
    return (
      <Badge
        color={config.color}
        iconLeading={config.icon}
        size="md"
      >
        {config.label}
      </Badge>
    )
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  // Animierte Progress-Simulation
  const startPollingForDocument = (documentId: string) => {
    console.log('🔄 Starting polling for document:', documentId)
    setPollingDocuments(prev => new Set(prev).add(documentId))
    
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('pdf_documents')
          .select('*')
          .eq('id', documentId)
          .single()
        
        if (!error && data) {
          console.log('🔄 Polling update for document:', data.processing_status)
          
          // Update document in list
          setDocuments(prevDocs => 
            prevDocs.map(doc => 
              doc.id === documentId ? data : doc
            )
          )
          
          // Stop polling wenn fertig
          if (data.processing_status === 'ready' || 
              data.processing_status === 'failed' || 
              data.processing_status === 'needs_review') {
            console.log('✅ Polling complete for document:', documentId)
            clearInterval(pollInterval)
            setPollingDocuments(prev => {
              const newSet = new Set(prev)
              newSet.delete(documentId)
              return newSet
            })
            setProgressMap(prev => {
              const newMap = { ...prev }
              delete newMap[documentId]
              return newMap
            })
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 2000) // Poll alle 2 Sekunden
    
    // Nach 60 Sekunden aufhören
    setTimeout(() => {
      clearInterval(pollInterval)
      setPollingDocuments(prev => {
        const newSet = new Set(prev)
        newSet.delete(documentId)
        return newSet
      })
      console.log('⚠️ Polling timeout for document:', documentId)
    }, 60000)
  }
  
  const startProgressAnimation = (documentId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5 // Zufälliger Fortschritt zwischen 5-20%
      
      if (progress >= 90) {
        progress = 90 // Bei 90% stoppen und auf echtes Ergebnis warten
        clearInterval(interval)
      }
      
      setProgressMap(prev => ({ ...prev, [documentId]: Math.min(progress, 90) }))
    }, 800) // Update alle 800ms
    
    // Nach 30 Sekunden aufräumen falls keine Antwort
    setTimeout(() => {
      clearInterval(interval)
      setProgressMap(prev => {
        const newMap = { ...prev }
        delete newMap[documentId]
        return newMap
      })
    }, 30000)
  }

  const getVehicleTitle = (doc: PdfDocument) => {
    const aiData = doc.extracted_data?.ai_extracted
    if (aiData?.vehicle?.make && aiData?.vehicle?.model) {
      return `${aiData.vehicle.make} ${aiData.vehicle.model}`
    }
    return doc.file_name.replace('.pdf', '')
  }
  
  const getVehicleVariant = (doc: PdfDocument) => {
    const aiData = doc.extracted_data?.ai_extracted
    return aiData?.vehicle?.variant || null
  }

  const getMonthlyRate = (doc: PdfDocument) => {
    const aiData = doc.extracted_data?.ai_extracted
    if (aiData?.leasing?.monthly_rate) {
      return aiData.leasing.monthly_rate
    }
    return null
  }

  const getYear = (doc: PdfDocument) => {
    const aiData = doc.extracted_data?.ai_extracted
    return aiData?.vehicle?.year || null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingIndicator size="lg" />
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <>
        <EmptyState size="lg">
          <EmptyState.FeaturedIcon icon={File02} />
          <EmptyState.Content>
            <EmptyState.Title>Keine PDF-Dokumente</EmptyState.Title>
            <EmptyState.Description>Laden Sie Ihr erstes Angebots-PDF hoch, um Landingpages zu erstellen.</EmptyState.Description>
          </EmptyState.Content>
          <EmptyState.Footer>
            <Button
              size="lg"
              iconLeading={Upload01}
              onClick={() => setUploadModalOpen(true)}
            >
              PDF hochladen
            </Button>
          </EmptyState.Footer>
        </EmptyState>
        
        <ModalOverlay isOpen={uploadModalOpen} onOpenChange={setUploadModalOpen}>
          <Modal>
            <Dialog>
              <div className="bg-primary rounded-lg shadow-xl max-w-lg w-full p-6">
                <h2 className="text-lg font-semibold text-primary mb-2">
                  PDF-Dokument hochladen
                </h2>
                <p className="text-sm text-secondary mb-6">
                  Laden Sie ein Angebots-PDF hoch, um es als Vorlage für Landingpages zu nutzen.
                </p>
          <div className="p-4">
            <PdfUploadDropZone
              accept=".pdf"
              allowsMultiple={false}
              maxSize={10 * 1024 * 1024}
              hint="PDF bis zu 10MB"
              onDropFiles={handleFileSelect}
            />
          </div>
          
                {selectedFile && (
                  <div className="mt-4 p-3 bg-secondary rounded-lg">
                    <div className="flex items-center gap-2">
                      <File02 className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-medium">{selectedFile.name}</span>
                      <span className="text-sm text-gray-500">
                        ({formatFileSize(selectedFile.size)})
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4 border-t border-secondary">
                  <Button
                    variant="secondary"
                    onClick={() => setUploadModalOpen(false)}
                    disabled={uploading}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    loading={uploading}
                  >
                    Hochladen
                  </Button>
                </div>
              </div>
            </Dialog>
          </Modal>
        </ModalOverlay>
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-primary">
              PDF-Bibliothek
            </h2>
            <p className="mt-1 text-sm text-secondary">
              Ihre hochgeladenen Angebots-PDFs als Vorlagen für Landingpages
            </p>
          </div>
          <Button
            size="lg"
            iconLeading={Plus}
            onClick={() => setUploadModalOpen(true)}
          >
            PDF hochladen
          </Button>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-primary rounded-xl border border-secondary overflow-hidden hover:shadow-lg hover:border-brand transition-all duration-200"
            >
              {/* Header with Vehicle Info */}
              <div className="p-5 border-b border-secondary">
                {/* Status Badge in oberer rechter Ecke */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    {/* Fahrzeugdaten, nur wenn verfügbar */}
                    {(doc.processing_status === 'uploaded' || doc.processing_status === 'extracting') ? (
                      // Ladeanimation während KI-Analyse
                      <div className="space-y-3">
                        <div className="animate-pulse flex-1">
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
                          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        </div>
                        {/* Progress Bar während der Analyse */}
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-brand h-2 rounded-full transition-all duration-300 ease-out"
                              style={{ 
                                width: `${progressMap[doc.id] || 0}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* Marke & Modell */}
                        <h3 className="font-semibold text-primary text-lg mb-1">
                          {getVehicleTitle(doc)}
                        </h3>
                        
                        {/* Ausstattungslinie wenn vorhanden */}
                        {getVehicleVariant(doc) && (
                          <p className="text-sm text-secondary mb-2">
                            {getVehicleVariant(doc)}
                          </p>
                        )}
                        
                        {/* Leasingrate prominent anzeigen */}
                        {getMonthlyRate(doc) && (
                          <div className="mt-2">
                            <Badge color="brand" size="md">
                              ab {getMonthlyRate(doc)}€/Monat
                            </Badge>
                          </div>
                        )}
                        
                        {/* Jahr wenn vorhanden */}
                        {getYear(doc) && (
                          <p className="text-xs text-secondary mt-2">
                            Baujahr {getYear(doc)}
                          </p>
                        )}
                        
                        {/* Confidence Score wenn vorhanden */}
                        {doc.extracted_data?.ai_extracted?.metadata?.confidence_score && (
                          <div className="mt-2 flex items-center gap-2">
                            <Badge 
                              color={
                                doc.extracted_data.ai_extracted.metadata.confidence_score > 70 
                                  ? 'success' 
                                  : doc.extracted_data.ai_extracted.metadata.confidence_score > 40 
                                    ? 'warning' 
                                    : 'error'
                              } 
                              size="sm"
                            >
                              {doc.extracted_data.ai_extracted.metadata.confidence_score}% Konfidenz
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    {getStatusBadge(doc.processing_status)}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                {/* File Meta Info */}
                <div className="flex items-center justify-between text-xs text-secondary mb-4">
                  <span>{formatFileSize(doc.file_size_bytes)}</span>
                  {doc.page_count && (
                    <>
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>{doc.page_count} Seiten</span>
                    </>
                  )}
                  <span>
                    {formatDistanceToNow(new Date(doc.created_at), {
                      addSuffix: true,
                      locale: de
                    })}
                  </span>
                </div>

                {/* Main Action */}
                {doc.processing_status === 'ready' ? (
                  <Button
                    size="md"
                    variant="primary"
                    className="w-full mb-3"
                    iconTrailing={ArrowRight}
                  >
                    Landingpage erstellen
                  </Button>
                ) : doc.processing_status === 'needs_review' ? (
                  <Button
                    size="md"
                    variant="secondary"
                    className="w-full mb-3"
                    iconTrailing={AlertCircle}
                  >
                    Daten überprüfen
                  </Button>
                ) : doc.processing_status === 'failed' ? (
                  <Button
                    size="md"
                    variant="secondary"
                    className="w-full mb-3"
                    iconLeading={Lightbulb04}
                    onClick={() => handleExtractData(doc.id)}
                    loading={extracting === doc.id}
                    disabled={extracting === doc.id}
                  >
                    Erneut analysieren
                  </Button>
                ) : (doc.processing_status === 'extracting' || doc.processing_status === 'uploaded') ? (
                  <div className="mb-3">
                    <Button
                      size="md"
                      variant="secondary"
                      className="w-full cursor-not-allowed opacity-50"
                      disabled
                    >
                      <div className="flex items-center gap-2">
                        <Lightbulb04 className="h-4 w-4 animate-pulse" />
                        <span>Wird analysiert...</span>
                      </div>
                    </Button>
                  </div>
                ) : null}

                {/* Secondary Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="secondary"
                    iconLeading={Eye}
                    onClick={() => window.open(doc.file_url, '_blank')}
                  />
                  <Button
                    size="sm"
                    color="secondary"
                    iconLeading={Trash02}
                    onClick={() => openDeleteModal(doc)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      <ModalOverlay isOpen={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <Modal>
          <Dialog>
            <div className="bg-primary rounded-lg shadow-xl max-w-lg w-full p-6">
              <h2 className="text-lg font-semibold text-primary mb-2">
                PDF-Dokument hochladen
              </h2>
              <p className="text-sm text-secondary mb-6">
                Laden Sie ein Angebots-PDF hoch, um es als Vorlage für Landingpages zu nutzen.
              </p>
        <div className="p-4">
          <PdfUploadDropZone
            accept=".pdf"
            allowsMultiple={false}
            maxSize={10 * 1024 * 1024}
            hint="PDF bis zu 10MB"
            onDropFiles={handleFileSelect}
          />
        </div>
        
              {selectedFile && (
                <div className="mt-4 p-3 bg-secondary rounded-lg">
                  <div className="flex items-center gap-2">
                    <File02 className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-sm text-gray-500">
                      ({formatFileSize(selectedFile.size)})
                    </span>
                  </div>
                </div>
              )}
                
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="secondary"
                  onClick={() => setUploadModalOpen(false)}
                  disabled={uploading}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  loading={uploading}
                >
                  Hochladen
                </Button>
              </div>
            </div>
            </Dialog>
          </Modal>
        </ModalOverlay>

      {/* Extraction Results Modal */}
      <ModalOverlay isOpen={extractionModalOpen} onOpenChange={setExtractionModalOpen}>
        <Modal>
          <Dialog>
            <div className="bg-primary rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-primary mb-2">
                KI-Extraktionsergebnisse
              </h2>
              <p className="text-sm text-secondary mb-6">
                Claude Sonnet hat Ihr PDF analysiert und folgende Daten extrahiert:
              </p>
              
              {extractionResult && (
                <div className="space-y-6">
            {/* Status & Confidence */}
            <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
              <div>
                <p className="font-medium text-primary">
                  {extractionResult.message}
                </p>
                <p className="text-sm text-gray-500">
                  Confidence Score: {extractionResult.confidence_score}%
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {extractionResult.tokens_used} Tokens verwendet
              </div>
            </div>

            {/* Extracted Vehicle Data */}
            {extractionResult.ai_data?.vehicle && Object.keys(extractionResult.ai_data.vehicle).length > 0 && (
              <div>
                <h4 className="font-semibold text-primary mb-3">
                  🚗 Fahrzeugdaten
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(extractionResult.ai_data.vehicle).map(([key, value]) => 
                    value && (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-secondary capitalize">
                          {key.replace('_', ' ')}:
                        </span>
                        <span className="font-medium text-primary">
                          {value}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Extracted Leasing Data */}
            {extractionResult.ai_data?.leasing && Object.keys(extractionResult.ai_data.leasing).length > 0 && (
              <div>
                <h4 className="font-semibold text-primary mb-3">
                  💰 Leasingkonditionen
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(extractionResult.ai_data.leasing).map(([key, value]) => 
                    value && (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-secondary capitalize">
                          {key.replace('_', ' ')}:
                        </span>
                        <span className="font-medium text-primary">
                          {typeof value === 'number' && key.includes('rate') ? (value + '€') : value}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Extracted Dealer Data */}
            {extractionResult.ai_data?.dealer && Object.keys(extractionResult.ai_data.dealer).length > 0 && (
              <div>
                <h4 className="font-semibold text-primary mb-3">
                  🏢 Händlerinformationen
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(extractionResult.ai_data.dealer).map(([key, value]) => 
                    value && (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-secondary capitalize">
                          {key.replace('_', ' ')}:
                        </span>
                        <span className="font-medium text-primary">
                          {value}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Warnings */}
            {extractionResult.validation?.warnings && extractionResult.validation.warnings.length > 0 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  ⚠️ Warnungen
                </h4>
                <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                  {extractionResult.validation.warnings.map((warning: string, index: number) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

                  <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setExtractionModalOpen(false)
                        setExtractionResult(null)
                      }}
                    >
                      Schließen
                    </Button>
                    {extractionResult?.success && (
                      <Button variant="primary">
                        Angebot erstellen
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>

      {/* Delete Confirmation Modal */}
      <ModalOverlay isOpen={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <Modal>
          <Dialog>
            <div className="bg-primary rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <Trash02 className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-primary mb-1">
                    PDF löschen
                  </h2>
                  <p className="text-sm text-secondary">
                    Sind Sie sicher, dass Sie dieses PDF löschen möchten?
                  </p>
                </div>
              </div>

              {documentToDelete && (
                <div className="mb-6 p-3 bg-secondary rounded-lg">
                  <p className="text-sm font-medium text-primary">
                    {getVehicleTitle(documentToDelete)}
                  </p>
                  <p className="text-xs text-secondary mt-1">
                    Diese Aktion kann nicht rückgängig gemacht werden.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDeleteModalOpen(false)
                    setDocumentToDelete(null)
                  }}
                  disabled={deleting}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button
                  variant="primary"
                  destructive
                  onClick={handleDeleteDocument}
                  loading={deleting}
                  disabled={deleting}
                  className="flex-1"
                >
                  Löschen
                </Button>
              </div>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  )
}