'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/base/input/input'
import { Label } from '@/components/base/input/label'
import { Button } from '@/components/base/buttons/button'
import { Select } from '@/components/base/select/select'
import { Lightbulb04, CheckCircle, AlertCircle, HelpCircle, RefreshCw05, ChevronDown } from '@untitledui/icons'
import { cx } from '@/utils/cx'
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

// Helper functions
const getConfidenceIcon = (confidence: number) => {
  if (confidence >= 90) return CheckCircle
  if (confidence >= 70) return AlertCircle
  return HelpCircle
}

const getConfidenceColorClass = (confidence: number) => {
  // Using semantic color classes that will be defined in theme
  if (confidence >= 90) return 'text-success-600 dark:text-success-400'
  if (confidence >= 70) return 'text-warning-600 dark:text-warning-400'
  if (confidence >= 50) return 'text-warning-700 dark:text-warning-500'
  return 'text-error-600 dark:text-error-400'
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

export function ConfidenceInputV2({
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
  const [inputValue, setInputValue] = useState(value || '')
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Update internal value when prop changes
  useEffect(() => {
    setInputValue(value || '')
  }, [value])
  
  // Auto-apply high confidence suggestions
  useEffect(() => {
    if (suggestions && !value && suggestions.suggestions.length > 0) {
      const topSuggestion = suggestions.suggestions[0]
      if (topSuggestion.confidence >= 85 && topSuggestion.source !== 'user_input') {
        onChange(String(topSuggestion.value))
        setSelectedSuggestion(topSuggestion)
      }
    }
  }, [suggestions, value, onChange])
  
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
    onChange(newValue)
    // Reset selected suggestion if user types manually
    setSelectedSuggestion(null)
  }
  
  const applySuggestion = (suggestion: FieldSuggestion) => {
    const valueStr = String(suggestion.value)
    setInputValue(valueStr)
    onChange(valueStr)
    setSelectedSuggestion(suggestion)
    setShowSuggestions(false)
  }
  
  const currentConfidence = selectedSuggestion?.confidence || 
    suggestions?.suggestions.find(s => String(s.value) === String(inputValue))?.confidence
  
  const ConfidenceIcon = currentConfidence ? getConfidenceIcon(currentConfidence) : null
  
  // Create select items for suggestions
  const suggestionItems = suggestions?.suggestions.map((suggestion, index) => {
    const Icon = getConfidenceIcon(suggestion.confidence)
    return {
      id: `${suggestion.value}-${index}`,
      label: String(suggestion.value) + (suffix ? ` ${suffix}` : ''),
      supportingText: `${getSourceLabel(suggestion.source)} (${suggestion.confidence}%)`,
      icon: Icon
    }
  }) || []
  
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
      
      <div className="space-y-2">
        {/* Main Input Field */}
        <div className="relative">
          <Input
            id={id}
            type={type}
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            disabled={disabled}
          />
          
          {/* Confidence indicator overlay */}
          {currentConfidence && ConfidenceIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
              {suffix && (
                <span className="text-sm text-secondary">{suffix}</span>
              )}
              <ConfidenceIcon 
                className={cx('h-4 w-4', getConfidenceColorClass(currentConfidence))}
                title={`${currentConfidence}% Konfidenz`}
              />
            </div>
          )}
        </div>
        
        {/* Suggestions using Select (when toggled) */}
        {showSuggestions && suggestions && suggestions.suggestions.length > 0 && (
          <div className="border border-primary/10 rounded-lg p-3 bg-secondary/5">
            <div className="mb-2 text-xs font-medium text-secondary">
              Verfügbare Vorschläge:
            </div>
            <Select
              placeholder="Vorschlag wählen..."
              items={suggestionItems}
              selectedKey={null}
              onSelectionChange={(key) => {
                if (key) {
                  const index = suggestionItems.findIndex(item => item.id === key)
                  if (index >= 0 && suggestions.suggestions[index]) {
                    applySuggestion(suggestions.suggestions[index])
                  }
                }
              }}
              size="sm"
            >
              {(item) => (
                <Select.Item 
                  key={item.id} 
                  id={item.id} 
                  label={item.label}
                  supportingText={item.supportingText}
                  icon={item.icon}
                >
                  {item.label}
                </Select.Item>
              )}
            </Select>
            
            {onRefreshSuggestions && (
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onRefreshSuggestions}
                  iconLeading={RefreshCw05}
                  className="w-full"
                >
                  Vorschläge aktualisieren
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Vereinfachtes Auto-Fill Label */}
      {selectedSuggestion && !showSuggestions && (
        <p className="text-xs text-green-600 dark:text-green-400">
          ✓ Automatisch vorausgefüllt
        </p>
      )}
    </div>
  )
}