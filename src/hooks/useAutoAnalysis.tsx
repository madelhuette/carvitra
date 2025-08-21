'use client'

import { useEffect, useState, useRef } from 'react'

interface UseAutoAnalysisOptions {
  stepNumber: number
  extractedData: any
  onAnalysisStart?: () => void
  onAnalysisComplete?: (fieldsIdentified: number, confidence?: number) => void
  onAnalysisError?: (error: Error) => void
  autoFillFunction: (step: number) => Promise<{ fieldsIdentified?: number; confidence?: number } | void>
  skipIfDataExists?: boolean
}

interface AnalysisState {
  isAnalyzing: boolean
  fieldsIdentified: number | null
  confidence: number | null
  hasAnalyzed: boolean
  error: Error | null
  fieldConfidences?: Record<string, number>
}

export function useAutoAnalysis({
  stepNumber,
  extractedData,
  onAnalysisStart,
  onAnalysisComplete,
  onAnalysisError,
  autoFillFunction,
  skipIfDataExists = true
}: UseAutoAnalysisOptions) {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isAnalyzing: false,
    fieldsIdentified: null,
    confidence: null,
    hasAnalyzed: false,
    error: null,
    fieldConfidences: undefined
  })
  
  const hasRunRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Nur einmal pro Step ausführen
    if (hasRunRef.current) return
    
    // Nur wenn extracted data vorhanden
    if (!extractedData) return
    
    // Skip wenn gewünscht und Daten bereits vorhanden
    if (skipIfDataExists && analysisState.hasAnalyzed) return

    const runAutoAnalysis = async () => {
      hasRunRef.current = true
      
      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: true,
        error: null
      }))
      
      onAnalysisStart?.()
      
      // Minimum Ladezeit für bessere UX (1.5 Sekunden)
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1500))
      
      try {
        // Parallele Ausführung von KI-Analyse und Mindestladezeit
        const [analysisResult] = await Promise.all([
          autoFillFunction(stepNumber),
          minLoadingTime
        ])
        
        // Use actual result if available, otherwise use defaults
        let fieldsIdentified: number
        let confidence: number
        
        if (analysisResult && typeof analysisResult === 'object') {
          fieldsIdentified = analysisResult.fieldsIdentified || 0
          confidence = analysisResult.confidence || 70
        } else {
          // Fallback to simulated counts
          const fieldCounts: Record<number, number> = {
            1: 5,  // Fahrzeugdaten
            2: 12, // Technische Details
            3: 8,  // Ausstattung
            4: 7,  // Verfügbarkeit
            5: 9,  // Finanzierung
            6: 3,  // Ansprechpartner
            7: 4   // Marketing
          }
          fieldsIdentified = fieldCounts[stepNumber] || 0
          confidence = 85 // Default confidence
        }
        
        setAnalysisState({
          isAnalyzing: false,
          fieldsIdentified,
          confidence,
          hasAnalyzed: true,
          error: null
        })
        
        onAnalysisComplete?.(fieldsIdentified, confidence)
        
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Analyse fehlgeschlagen')
        
        setAnalysisState({
          isAnalyzing: false,
          fieldsIdentified: null,
          hasAnalyzed: true,
          error: err
        })
        
        onAnalysisError?.(err)
      }
    }
    
    // Kleine Verzögerung für smooth mounting
    timeoutRef.current = setTimeout(() => {
      runAutoAnalysis()
    }, 300)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [stepNumber, extractedData])
  
  const retryAnalysis = async () => {
    hasRunRef.current = false
    setAnalysisState({
      isAnalyzing: false,
      fieldsIdentified: null,
      confidence: null,
      hasAnalyzed: false,
      error: null,
      fieldConfidences: undefined
    })
  }
  
  return {
    ...analysisState,
    retryAnalysis
  }
}