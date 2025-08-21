'use client'

import { useEffect, useState } from 'react'
import { Lightbulb04, CheckCircle, AlertCircle, InfoCircle } from '@untitledui/icons'
import { cx } from '@/utils/cx'

interface AnalysisIndicatorProps {
  isAnalyzing: boolean
  fieldsIdentified?: number | null
  totalFields?: number
  confidence?: number
  error?: Error | null
  className?: string
  variant?: 'inline' | 'floating'
}

export function AnalysisIndicator({ 
  isAnalyzing, 
  fieldsIdentified, 
  totalFields,
  confidence,
  error,
  className,
  variant = 'inline'
}: AnalysisIndicatorProps) {
  const [show, setShow] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  
  useEffect(() => {
    if (isAnalyzing) {
      setShow(true)
      setFadeOut(false)
    } else if (fieldsIdentified !== null && fieldsIdentified !== undefined) {
      // Zeige Erfolg für 5 Sekunden (länger als vorher)
      setShow(true)
      setFadeOut(false)
      
      const timer = setTimeout(() => {
        setFadeOut(true)
        setTimeout(() => setShow(false), 300)
      }, 5000)
      
      return () => clearTimeout(timer)
    } else if (error) {
      setShow(true)
      setFadeOut(false)
    } else {
      setShow(false)
    }
  }, [isAnalyzing, fieldsIdentified, error])
  
  if (!show) return null
  
  // Bestimme Erfolgsgrad basierend auf Konfidenz
  const getSuccessLevel = () => {
    if (!confidence) return 'unknown'
    if (confidence >= 90) return 'excellent'
    if (confidence >= 70) return 'good'
    if (confidence >= 50) return 'moderate'
    return 'low'
  }
  
  const successLevel = getSuccessLevel()
  
  // Inline-Variante für direkten Einbau in Steps
  if (variant === 'inline') {
    // Container mit fester Mindesthöhe um Layout-Verschiebungen zu vermeiden
    return (
      <div className="min-h-[60px] mb-4">
        <div 
          className={cx(
            'transition-all duration-500 ease-in-out',
            fadeOut ? 'opacity-0' : 'opacity-100',
            className
          )}
        >
          {show && (
            <>
              {isAnalyzing && (
                <div className={cx(
                  'flex items-start gap-3 p-4 rounded-lg',
                  'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                )}>
                  <InfoCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      KI analysiert Ihr Dokument
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Felder werden automatisch erkannt und ausgefüllt
                    </p>
                  </div>
                </div>
              )}
              
              {!isAnalyzing && fieldsIdentified !== null && !error && (
                <div className={cx(
                  'flex items-start gap-3 p-4 rounded-lg',
                  successLevel === 'excellent' || successLevel === 'good'
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                )}>
                  <CheckCircle className={cx(
                    'h-5 w-5 flex-shrink-0 mt-0.5',
                    successLevel === 'excellent' || successLevel === 'good'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  )} />
                  <div className="flex-1">
                    <p className={cx(
                      'text-sm font-medium',
                      successLevel === 'excellent' || successLevel === 'good'
                        ? 'text-green-900 dark:text-green-100'
                        : 'text-yellow-900 dark:text-yellow-100'
                    )}>
                      {successLevel === 'excellent' ? `Ausgezeichnet! ${fieldsIdentified} von ${totalFields || fieldsIdentified} Feldern erkannt` :
                       successLevel === 'good' ? `Gut! ${fieldsIdentified} Felder erfolgreich ausgefüllt` :
                       successLevel === 'moderate' ? `${fieldsIdentified} Felder identifiziert` :
                       successLevel === 'low' ? `Nur ${fieldsIdentified} Felder erkannt` :
                       `${fieldsIdentified} Felder automatisch ausgefüllt`}
                    </p>
                    {(successLevel === 'moderate' || successLevel === 'low' || confidence) && (
                      <p className={cx(
                        'text-sm mt-1',
                        successLevel === 'excellent' || successLevel === 'good'
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-yellow-700 dark:text-yellow-300'
                      )}>
                        {successLevel === 'moderate' || successLevel === 'low' 
                          ? 'Bitte überprüfen Sie die Werte'
                          : confidence ? `Konfidenz: ${confidence}%` : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {error && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                      Analyse konnte nicht durchgeführt werden
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Bitte füllen Sie die Felder manuell aus
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }
  
  // Floating-Variante (Original-Banner-Style)
  return (
    <div 
      className={cx(
        'fixed top-20 right-6 z-50 transition-all duration-300 ease-in-out',
        fadeOut ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0',
        className
      )}
    >
      <div className={cx(
        'relative overflow-hidden',
        'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md',
        'rounded-xl shadow-xl border border-primary/10',
        'min-w-[320px]'
      )}>
        {/* Animated gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-600/20 to-brand-400/20" style={{ animation: 'var(--animate-gradient)' }} />
        
        <div className="relative bg-white/90 dark:bg-gray-900/90 m-[1px] rounded-xl px-4 py-3">
          {isAnalyzing && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Lightbulb04 className="h-5 w-5 text-brand-600 animate-pulse" />
                <div className="absolute inset-0 bg-brand-400 opacity-30 rounded-full animate-ping" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">KI-Analyse läuft...</p>
                <p className="text-xs text-secondary mt-0.5">Dokument wird verarbeitet</p>
              </div>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-brand-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-brand-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-brand-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          
          {!isAnalyzing && fieldsIdentified !== null && !error && (
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-success-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">
                  {fieldsIdentified} Felder erkannt
                </p>
                <p className="text-xs text-secondary mt-0.5">
                  {confidence && confidence >= 90 ? 'Hohe Genauigkeit' :
                   confidence && confidence >= 70 ? 'Gute Erkennung' :
                   'Bitte Werte überprüfen'}
                </p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-error-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">Analyse fehlgeschlagen</p>
                <p className="text-xs text-secondary mt-0.5">Manuelle Eingabe erforderlich</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}