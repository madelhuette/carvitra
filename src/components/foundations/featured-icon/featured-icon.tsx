'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import * as Icons from '@untitledui/icons'

interface FeaturedIconProps {
  icon?: React.ComponentType<{ className?: string }>
  iconName?: keyof typeof Icons
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'gray'
  className?: string
  children?: React.ReactNode
}

const sizeClasses = {
  xs: 'w-8 h-8',
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-14 h-14',
  xl: 'w-16 h-16',
}

const iconSizeClasses = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-7 h-7',
  xl: 'w-8 h-8',
}

const variantClasses = {
  primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
  secondary: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  success: 'bg-success-100 text-success-600 dark:bg-success-900/20 dark:text-success-400',
  warning: 'bg-warning-100 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400',
  error: 'bg-error-100 text-error-600 dark:bg-error-900/20 dark:text-error-400',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export const FeaturedIcon: React.FC<FeaturedIconProps> = ({
  icon: IconComponent,
  iconName,
  size = 'md',
  variant = 'primary',
  className,
  children,
}) => {
  // Determine which icon to use
  let Icon = IconComponent
  
  if (!Icon && iconName && iconName in Icons) {
    Icon = Icons[iconName] as React.ComponentType<{ className?: string }>
  }
  
  // Default to AlertCircle if no icon provided
  if (!Icon && !children) {
    Icon = Icons.AlertCircle
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {children || (Icon && <Icon className={iconSizeClasses[size]} />)}
    </div>
  )
}

export default FeaturedIcon