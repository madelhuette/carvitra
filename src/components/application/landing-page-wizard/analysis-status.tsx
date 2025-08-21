'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Lightbulb04, AlertCircle } from '@untitledui/icons'
import { cx } from '@/utils/cx'

interface AnalysisStatusProps {
  isAnalyzing: boolean
  fieldsIdentified: number | null
  error?: Error | null
  className?: string
}

export function AnalysisStatus({ 
  isAnalyzing, 
  fieldsIdentified, 
  error,
  className 
}: AnalysisStatusProps) {
  const [show, setShow] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  
  useEffect(() => {
    if (isAnalyzing) {
      setShow(true)
      setFadeOut(false)
    } else if (fieldsIdentified !== null) {
      // Zeige Erfolg für 3 Sekunden
      setShow(true)
      setFadeOut(false)
      
      const timer = setTimeout(() => {
        setFadeOut(true)
        setTimeout(() => setShow(false), 300) // Wait for fade animation
      }, 3000)
      
      return () => clearTimeout(timer)
    } else if (error) {
      setShow(true)
      setFadeOut(false)
    } else {
      setShow(false)
    }
  }, [isAnalyzing, fieldsIdentified, error])
  
  if (!show) return null
  
  return (
    <div 
      className={cx(
        'fixed top-20 right-6 z-50 transition-all duration-300 ease-in-out',
        fadeOut ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0',
        className
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-primary rounded-lg shadow-lg border border-secondary min-w-[280px]">
        {isAnalyzing && (
          <>
            <div className="relative">
              <Lightbulb04 className="h-5 w-5 text-brand animate-pulse" />
              <div className="absolute inset-0 bg-brand opacity-20 rounded-full animate-ping" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">KI analysiert Dokument...</p>
              <p className="text-xs text-secondary mt-0.5">Felder werden automatisch befüllt</p>
            </div>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </>
        )}
        
        {!isAnalyzing && fieldsIdentified !== null && !error && (
          <>
            <CheckCircle className="h-5 w-5 text-success-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">
                {fieldsIdentified} Felder identifiziert
              </p>
              <p className="text-xs text-secondary mt-0.5">Automatisch ausgefüllt</p>
            </div>
          </>
        )}
        
        {error && (
          <>
            <AlertCircle className="h-5 w-5 text-error-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">Analyse fehlgeschlagen</p>
              <p className="text-xs text-secondary mt-0.5">Bitte manuell ausfüllen</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}