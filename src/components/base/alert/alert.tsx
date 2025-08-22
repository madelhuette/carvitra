'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, AlertCircle, InfoCircle, AlertTriangle, X } from '@untitledui/icons'

export interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  showIcon?: boolean
  className?: string
  children?: React.ReactNode
  onDismiss?: () => void
  dismissible?: boolean
}

const variantStyles = {
  success: {
    container: 'bg-success-25 border-success-300',
    icon: 'text-success-600',
    title: 'text-success-900',
    description: 'text-success-700',
    defaultIcon: CheckCircle
  },
  error: {
    container: 'bg-error-25 border-error-300',
    icon: 'text-error-600',
    title: 'text-error-900',
    description: 'text-error-700',
    defaultIcon: AlertCircle
  },
  warning: {
    container: 'bg-warning-25 border-warning-300',
    icon: 'text-warning-600',
    title: 'text-warning-900',
    description: 'text-warning-700',
    defaultIcon: AlertTriangle
  },
  info: {
    container: 'bg-brand-25 border-brand-300',
    icon: 'text-brand-600',
    title: 'text-brand-900',
    description: 'text-brand-700',
    defaultIcon: InfoCircle
  }
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  description,
  icon: CustomIcon,
  showIcon = true,
  className,
  children,
  onDismiss,
  dismissible = false
}) => {
  const styles = variantStyles[variant]
  const Icon = CustomIcon || styles.defaultIcon

  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border px-4 py-3',
        styles.container,
        className
      )}
    >
      {showIcon && (
        <Icon className={cn('size-5 flex-shrink-0 mt-0.5', styles.icon)} />
      )}
      
      <div className="flex-1">
        {title && (
          <div className={cn('text-sm font-medium', styles.title)}>
            {title}
          </div>
        )}
        {description && (
          <div className={cn('text-sm', title ? 'mt-1' : '', styles.description)}>
            {description}
          </div>
        )}
        {children}
      </div>

      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className={cn('flex-shrink-0 hover:opacity-70 transition-opacity', styles.icon)}
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}