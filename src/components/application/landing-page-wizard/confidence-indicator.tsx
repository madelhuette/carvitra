'use client'

import { useState } from 'react'
import { InfoCircle } from '@untitledui/icons'
import { cx } from '@/utils/cx'
import { Tooltip } from '@/components/base/tooltip/tooltip'

interface ConfidenceIndicatorProps {
  confidence?: number
  fieldName?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ConfidenceIndicator({ 
  confidence, 
  fieldName,
  className,
  size = 'sm'
}: ConfidenceIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  
  if (!confidence || confidence === 100) return null
  
  // Determine confidence level
  const level = confidence >= 90 ? 'high' : confidence >= 70 ? 'medium' : 'low'
  
  // Size classes
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }
  
  // Color classes based on confidence level
  const colorClasses = {
    high: 'bg-success-500/80 border-success-600/50',
    medium: 'bg-warning-500/80 border-warning-600/50',
    low: 'bg-gray-400/80 border-gray-500/50'
  }
  
  // Tooltip content
  const getTooltipContent = () => {
    if (level === 'high') {
      return `Hohe Konfidenz (${confidence}%) - Wert wurde mit hoher Sicherheit erkannt`
    } else if (level === 'medium') {
      return `Mittlere Konfidenz (${confidence}%) - Bitte überprüfen Sie diesen Wert`
    } else {
      return `Niedrige Konfidenz (${confidence}%) - Manuelle Überprüfung empfohlen`
    }
  }
  
  return (
    <Tooltip content={getTooltipContent()}>
      <div
        className={cx(
          'inline-flex items-center justify-center',
          'rounded-full border',
          'transition-all duration-200',
          'cursor-help',
          sizeClasses[size],
          colorClasses[level],
          'hover:scale-110',
          className
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Pulse animation for low confidence */}
        {level === 'low' && (
          <div className="absolute inset-0 rounded-full bg-gray-400 animate-ping opacity-20" />
        )}
      </div>
    </Tooltip>
  )
}

interface FieldWithConfidenceProps {
  children: React.ReactNode
  confidence?: number
  fieldName?: string
  className?: string
}

export function FieldWithConfidence({ 
  children, 
  confidence,
  fieldName,
  className 
}: FieldWithConfidenceProps) {
  return (
    <div className={cx('relative', className)}>
      {children}
      {confidence && confidence < 100 && (
        <div className="absolute -top-1 -right-1 z-10">
          <ConfidenceIndicator 
            confidence={confidence} 
            fieldName={fieldName}
            size="sm"
          />
        </div>
      )}
    </div>
  )
}

interface ConfidenceSummaryProps {
  overallConfidence?: number
  fieldsWithLowConfidence?: string[]
  className?: string
}

export function ConfidenceSummary({
  overallConfidence,
  fieldsWithLowConfidence = [],
  className
}: ConfidenceSummaryProps) {
  if (!overallConfidence) return null
  
  const level = overallConfidence >= 90 ? 'high' : overallConfidence >= 70 ? 'medium' : 'low'
  
  return (
    <div className={cx(
      'rounded-lg border p-3',
      level === 'high' ? 'bg-success-50/50 border-success-200' :
      level === 'medium' ? 'bg-warning-50/50 border-warning-200' :
      'bg-gray-50/50 border-gray-200',
      className
    )}>
      <div className="flex items-start gap-2">
        <InfoCircle className={cx(
          'h-4 w-4 mt-0.5 flex-shrink-0',
          level === 'high' ? 'text-success-600' :
          level === 'medium' ? 'text-warning-600' :
          'text-gray-600'
        )} />
        <div className="flex-1 space-y-1">
          <p className={cx(
            'text-sm font-medium',
            level === 'high' ? 'text-success-900' :
            level === 'medium' ? 'text-warning-900' :
            'text-gray-900'
          )}>
            Gesamt-Konfidenz: {overallConfidence}%
          </p>
          {fieldsWithLowConfidence.length > 0 && (
            <p className="text-xs text-secondary">
              Bitte überprüfen Sie: {fieldsWithLowConfidence.join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}