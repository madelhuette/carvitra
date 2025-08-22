"use client";

import { useState, useCallback } from 'react';
import { FileUpload } from '@/components/application/file-upload/file-upload-base';
import { AvatarCropEditor } from './avatar-crop-editor';
import { Button } from '@/components/base/buttons/button';
import { X, Upload01 } from '@untitledui/icons';
import { compressImage } from './utils/canvas-utils';

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: Blob) => Promise<void>;
  currentAvatar?: string;
}

type UploadStep = 'select' | 'crop' | 'uploading';

export function AvatarUploadModal({
  isOpen,
  onClose,
  onUpload,
  currentAvatar
}: AvatarUploadModalProps) {
  const [step, setStep] = useState<UploadStep>('select');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Bitte wählen Sie eine Bilddatei aus');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Die Datei darf maximal 5MB groß sein');
      return;
    }

    setError(null);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setStep('crop');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleCropComplete = useCallback(async (croppedBlob: Blob) => {
    setStep('uploading');
    setUploading(true);

    try {
      // Compress the image before upload
      const compressedBlob = await compressImage(
        new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' }),
        500,
        500,
        0.9
      );

      // Upload the compressed image
      await onUpload(compressedBlob);
      
      // Reset and close
      handleClose();
    } catch (error) {
      console.error('Upload error:', error);
      setError('Fehler beim Hochladen des Bildes');
      setStep('crop');
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const handleClose = () => {
    setStep('select');
    setSelectedImage(null);
    setError(null);
    setUploading(false);
    onClose();
  };

  const handleBack = () => {
    setStep('select');
    setSelectedImage(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-overlay backdrop-blur-sm"
        onClick={step === 'select' ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-primary rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary">
          <h2 className="text-lg font-semibold text-primary">
            {step === 'select' && 'Profilbild hochladen'}
            {step === 'crop' && 'Bild zuschneiden'}
            {step === 'uploading' && 'Wird hochgeladen...'}
          </h2>
          {step !== 'uploading' && (
            <Button
              size="sm"
              color="tertiary"
              onClick={handleClose}
              iconLeading={X}
            />
          )}
        </div>

        {/* Content */}
        <div className="overflow-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {step === 'select' && (
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-error-subtle border border-error-subtle">
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}

              <FileUpload.Root>
                <FileUpload.DropZone
                  hint="JPG, PNG oder GIF (max. 5MB)"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  maxSize={5 * 1024 * 1024}
                  onDropFiles={handleFileSelect}
                  allowsMultiple={false}
                />
              </FileUpload.Root>

              {currentAvatar && (
                <div className="mt-6">
                  <p className="text-sm text-tertiary mb-3">Aktuelles Profilbild:</p>
                  <div className="flex justify-center">
                    <img 
                      src={currentAvatar} 
                      alt="Aktuelles Profilbild"
                      className="size-32 rounded-full object-cover border-2 border-secondary"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'crop' && selectedImage && (
            <AvatarCropEditor
              image={selectedImage}
              onCropComplete={handleCropComplete}
              onCancel={handleBack}
            />
          )}

          {step === 'uploading' && (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center size-12 rounded-full bg-brand/10 mb-4">
                <Upload01 className="size-6 text-brand animate-pulse" />
              </div>
              <p className="text-sm text-secondary">Profilbild wird hochgeladen...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}