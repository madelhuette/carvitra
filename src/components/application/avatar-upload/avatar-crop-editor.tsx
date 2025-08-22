"use client";

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/base/buttons/button';
import { getCroppedImg, CroppedAreaPixels } from './utils/canvas-utils';
import { ZoomIn, ZoomOut, RefreshCw01 } from '@untitledui/icons';

interface AvatarCropEditorProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export function AvatarCropEditor({ 
  image, 
  onCropComplete, 
  onCancel
}: AvatarCropEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.2); // Start mit leichtem Zoom für bessere Füllung
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_: any, croppedAreaPixels: CroppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(3, prev + 0.1));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.8, prev - 0.1));
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom(prev => Math.min(3, Math.max(0.8, prev + delta)));
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setProcessing(true);
    try {
      const { blob } = await getCroppedImg(image, croppedAreaPixels, rotation);
      if (blob) {
        onCropComplete(blob);
      }
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Crop Area */}
      <div 
        className="relative flex-1 bg-secondary min-h-[400px]"
        onWheel={handleWheel}
      >
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          cropShape="round"
          objectFit="horizontal-cover"
          minZoom={0.8}
          maxZoom={3}
          zoomSpeed={0.1}
          onCropChange={onCropChange}
          onCropComplete={onCropCompleteCallback}
          onZoomChange={onZoomChange}
          showGrid={false}
          classes={{
            containerClassName: 'rounded-lg',
            mediaClassName: 'rounded-lg'
          }}
        />
      </div>

      {/* Controls */}
      <div className="p-6 space-y-4 bg-primary border-t border-secondary">
        {/* Zoom Controls */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-secondary">Zoom</label>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                color="secondary"
                onClick={handleZoomOut}
                disabled={zoom <= 0.8}
                iconLeading={ZoomOut}
                aria-label="Zoom out"
              />
              <span className="min-w-[60px] text-center text-sm font-medium text-secondary">
                {(zoom * 100).toFixed(0)}%
              </span>
              <Button
                size="sm"
                color="secondary"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                iconLeading={ZoomIn}
                aria-label="Zoom in"
              />
            </div>
            <p className="text-xs text-tertiary">Mausrad zum Zoomen verwenden</p>
          </div>
        </div>

        {/* Rotation Button */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-secondary">Rotation</span>
          <Button
            size="sm"
            color="secondary"
            iconLeading={RefreshCw01}
            onClick={handleRotate}
          >
            90° drehen
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-secondary">
          <Button
            color="secondary"
            onClick={onCancel}
            disabled={processing}
            className="flex-1"
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            loading={processing}
            disabled={processing}
            className="flex-1"
          >
            Übernehmen
          </Button>
        </div>
      </div>
    </div>
  );
}