'use client'

import { useEffect, useState } from 'react'
import { Lightbulb04, CheckCircle } from '@untitledui/icons'
import { BadgeWithIcon } from '@/components/base/badges/badges'
import { cx } from '@/utils/cx'

interface AnalysisBadgeProps {
  isAnalyzing: boolean
  isSuccess?: boolean
  className?: string
}

export function AnalysisBadge({ 
  isAnalyzing, 
  isSuccess = false,
  className 
}: AnalysisBadgeProps) {
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Success-Badge für 3 Sekunden anzeigen
  useEffect(() => {
    if (isSuccess && !isAnalyzing) {
      setShowSuccess(true)
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [isSuccess, isAnalyzing])
  
  // Container mit fixer Höhe bleibt IMMER im DOM für Layout-Stabilität
  return (
    <div className={cx("min-h-[32px] flex items-center", className)}>
      {isAnalyzing && (
        <BadgeWithIcon 
          type="pill-color"
          color="blue" 
          size="md"
          iconLeading={Lightbulb04}
          className="animate-pulse"
        >
          KI-Analyse läuft...
        </BadgeWithIcon>
      )}
      
      {showSuccess && !isAnalyzing && (
        <BadgeWithIcon 
          type="pill-color"
          color="success" 
          size="md"
          iconLeading={CheckCircle}
          className="animate-in fade-in duration-300"
        >
          ✓ Felder ausgefüllt
        </BadgeWithIcon>
      )}
    </div>
  )
}