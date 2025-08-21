'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/base/input/input'
import { Label } from '@/components/base/input/label'
import { Button } from '@/components/base/buttons/button'
import { Lightbulb04, CheckCircle, AlertCircle, HelpCircle, RefreshCw05 } from '@untitledui/icons'
import { cx } from '@/utils/cx'
import { SmartFieldService } from '@/services/smart-field.service'
import type { FieldSuggestion, SmartFieldResult } from '@/services/smart-field.service'

interface ConfidenceInputProps {
  id: string
  label: string
  placeholder?: string
  value: string | number | undefined
  onChange: (value: string) => void
  type?: string
  suggestions?: SmartFieldResult
  onRefreshSuggestions?: () => void
  disabled?: boolean
  suffix?: string
}

export function ConfidenceInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  suggestions,
  onRefreshSuggestions,
  disabled,
  suffix
}: ConfidenceInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<FieldSuggestion | null>(null)
  
  // Auto-apply suggestion if high confidence and no user input
  useEffect(() => {
    if (suggestions && !value && suggestions.suggestions.length > 0) {
      const topSuggestion = suggestions.suggestions[0]
      if (topSuggestion.confidence >= 85 && topSuggestion.source !== 'user_input') {
        // Auto-apply high confidence suggestions
        onChange(String(topSuggestion.value))
        setSelectedSuggestion(topSuggestion)
      }
    }
  }, [suggestions])
  
  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 90) return CheckCircle
    if (confidence >= 70) return AlertCircle
    return HelpCircle
  }
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 dark:text-green-400'
    if (confidence >= 70) return 'text-yellow-600 dark:text-yellow-400'
    if (confidence >= 50) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }
  
  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      'ai_extraction': 'PDF-Extraktion',
      'enrichment': 'Web-Recherche',
      'pattern_matching': 'Muster-Erkennung',
      'database_lookup': 'Datenbank',
      'user_input': 'Ihre Eingabe'
    }
    return labels[source] || source
  }
  
  const applySuggestion = (suggestion: FieldSuggestion) => {
    onChange(String(suggestion.value))
    setSelectedSuggestion(suggestion)
    setShowSuggestions(false)
  }
  
  const currentConfidence = selectedSuggestion?.confidence || 
    (suggestions?.suggestions.find(s => String(s.value) === String(value))?.confidence)
  
  const ConfidenceIcon = currentConfidence ? getConfidenceIcon(currentConfidence) : null
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {suggestions && suggestions.suggestions.length > 0 && (
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className={cx(
              'flex items-center gap-1 text-xs font-medium transition-colors',
              'hover:text-brand-600 dark:hover:text-brand-400',
              showSuggestions ? 'text-brand-600 dark:text-brand-400' : 'text-secondary'
            )}
          >
            <Lightbulb04 className="h-3 w-3" />
            {suggestions.suggestions.length} Vorschlag{suggestions.suggestions.length > 1 ? 'e' : ''}
          </button>
        )}
      </div>
      
      <div className="relative">
        <div className="relative">
          <Input
            id={id}
            type={type}
            placeholder={placeholder}
            value={value || ''}
            onChange={onChange}
            disabled={disabled}
            className={cx(
              suffix && 'pr-16',
              currentConfidence && 'pr-10'
            )}
          />
          
          {/* Confidence indicator inside input */}
          {currentConfidence && ConfidenceIcon && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {suffix && (
                <span className="text-sm text-secondary mr-2">{suffix}</span>
              )}
              <ConfidenceIcon 
                className={cx('h-4 w-4', getConfidenceColor(currentConfidence))}
                title={`${currentConfidence}% Konfidenz`}
              />
            </div>
          )}
          
          {/* Suffix without confidence */}
          {suffix && !currentConfidence && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="text-sm text-secondary">{suffix}</span>
            </div>
          )}
        </div>
        
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions && suggestions.suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-primary/10">
            <div className="p-2 space-y-1">
              {suggestions.suggestions.map((suggestion, index) => {
                const Icon = getConfidenceIcon(suggestion.confidence)
                const isSelected = String(suggestion.value) === String(value)
                
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applySuggestion(suggestion)}
                    className={cx(
                      'w-full flex items-center justify-between gap-2 p-2 rounded-md transition-colors',
                      'hover:bg-gray-50 dark:hover:bg-gray-800',
                      isSelected && 'bg-gray-50 dark:bg-gray-800'
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Icon className={cx('h-4 w-4 flex-shrink-0', getConfidenceColor(suggestion.confidence))} />
                      <div className="text-left">
                        <div className="text-sm font-medium text-primary">
                          {suggestion.value}
                          {suffix && <span className="text-secondary ml-1">{suffix}</span>}
                        </div>
                        <div className="text-xs text-secondary">
                          {getSourceLabel(suggestion.source)}
                          {suggestion.reasoning && ` • ${suggestion.reasoning}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-secondary">
                      {suggestion.confidence}%
                    </div>
                  </button>
                )
              })}
            </div>
            
            {onRefreshSuggestions && (
              <div className="border-t border-primary/10 p-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onRefreshSuggestions}
                  iconLeading={RefreshCw05}
                  className="w-full justify-center"
                >
                  Vorschläge aktualisieren
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Confidence hint below input */}
      {selectedSuggestion && !showSuggestions && (
        <p className={cx('text-xs', getConfidenceColor(selectedSuggestion.confidence))}>
          {getSourceLabel(selectedSuggestion.source)} • {selectedSuggestion.confidence}% Konfidenz
        </p>
      )}
    </div>
  )
}

// Export type for use in other components
export type { SmartFieldResult, FieldSuggestion } from '@/services/smart-field.service'