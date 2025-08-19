'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/base/buttons/button'
import { Badge } from '@/components/base/badges/badges'
import { EmptyState } from '@/components/application/empty-state/empty-state'
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator'
import { Modal } from '@/components/application/modals/modal'
import { FileUploadDropZone } from '@/components/application/file-upload/file-upload-base'
import { FileTrigger } from '@/components/base/file-upload-trigger/file-upload-trigger'
import { Upload01, File02, CheckCircle, AlertCircle, Clock, Plus, Eye, Trash02, Download01 } from '@untitledui/icons'
import { PdfDocument } from '@/types/pdf.types'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

export function PdfLibrary() {
  const [documents, setDocuments] = useState<PdfDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchDocuments()
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

  const handleFileSelect = (files: File[]) => {
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
      
      // Add new document to list
      setDocuments(prev => [result.document, ...prev])
      
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      uploaded: { label: 'Hochgeladen', color: 'gray' as const, icon: Upload01 },
      extracting: { label: 'Verarbeitung...', color: 'blue' as const, icon: Clock },
      ready: { label: 'Bereit', color: 'success' as const, icon: CheckCircle },
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
        <EmptyState
          icon={File02}
          title="Keine PDF-Dokumente"
          description="Laden Sie Ihr erstes Angebots-PDF hoch, um Landingpages zu erstellen."
          action={
            <Button
              size="lg"
              iconLeading={Upload01}
              onClick={() => setUploadModalOpen(true)}
            >
              PDF hochladen
            </Button>
          }
        />
        
        <Modal
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          title="PDF-Dokument hochladen"
          description="Laden Sie ein Angebots-PDF hoch, um es als Vorlage für Landingpages zu nutzen."
          actions={
            <div className="flex gap-3">
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
          }
        >
          <div className="p-4">
            <FileTrigger
              accept=".pdf"
              onChange={(e) => {
                const files = e.target.files
                if (files && files.length > 0) {
                  handleFileSelect(Array.from(files))
                }
              }}
            >
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer">
                <Upload01 className="h-10 w-10 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-900">PDF-Datei auswählen</p>
                <p className="text-xs text-gray-500 mt-1">oder per Drag & Drop hierher ziehen</p>
                <p className="text-xs text-gray-400 mt-2">PDF bis zu 10MB</p>
              </div>
            </FileTrigger>
          </div>
          
          {selectedFile && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <File02 className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <span className="text-sm text-gray-500">
                  ({formatFileSize(selectedFile.size)})
                </span>
              </div>
            </div>
          )}
        </Modal>
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              PDF-Bibliothek
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Document Icon and Status */}
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <File02 className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
                {getStatusBadge(doc.processing_status)}
              </div>

              {/* Document Info */}
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 truncate">
                {doc.file_name}
              </h3>
              
              <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <p>Größe: {formatFileSize(doc.file_size_bytes)}</p>
                {doc.page_count && <p>Seiten: {doc.page_count}</p>}
                <p>
                  Hochgeladen: {formatDistanceToNow(new Date(doc.created_at), {
                    addSuffix: true,
                    locale: de
                  })}
                </p>
              </div>

              {/* Extracted Data Preview */}
              {doc.extracted_data && doc.processing_status === 'ready' && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Extrahierte Daten:
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                    {doc.extracted_data.vehicle?.make && (
                      <p>• {doc.extracted_data.vehicle.make} {doc.extracted_data.vehicle.model}</p>
                    )}
                    {doc.extracted_data.pricing?.monthly_rate && (
                      <p>• Monatsrate: {doc.extracted_data.pricing.monthly_rate}€</p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  className="flex-1"
                  disabled={doc.processing_status !== 'ready'}
                >
                  Angebot erstellen
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  iconOnly
                  onClick={() => window.open(doc.file_url, '_blank')}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  iconOnly
                  destructive
                >
                  <Trash02 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="PDF-Dokument hochladen"
        description="Laden Sie ein Angebots-PDF hoch, um es als Vorlage für Landingpages zu nutzen."
        actions={
          <div className="flex gap-3">
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
        }
      >
        <div className="p-4">
          <FileTrigger
            accept=".pdf"
            onChange={(e) => {
              const files = e.target.files
              if (files && files.length > 0) {
                handleFileSelect(Array.from(files))
              }
            }}
          >
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer">
              <Upload01 className="h-10 w-10 text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-900">PDF-Datei auswählen</p>
              <p className="text-xs text-gray-500 mt-1">oder per Drag & Drop hierher ziehen</p>
              <p className="text-xs text-gray-400 mt-2">PDF bis zu 10MB</p>
            </div>
          </FileTrigger>
        </div>
        
        {selectedFile && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <File02 className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium">{selectedFile.name}</span>
              <span className="text-sm text-gray-500">
                ({formatFileSize(selectedFile.size)})
              </span>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}