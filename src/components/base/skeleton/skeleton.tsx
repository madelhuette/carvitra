'use client'

import { cx } from '@/utils/cx'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'rectangular' | 'circular'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
  children?: React.ReactNode
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  children
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700'
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700',
    none: ''
  }
  
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full'
  }
  
  const styles: React.CSSProperties = {
    width: width || (variant === 'circular' ? 40 : '100%'),
    height: height || (variant === 'text' ? 20 : variant === 'circular' ? 40 : 40)
  }
  
  return (
    <div
      className={cx(
        baseClasses,
        animationClasses[animation],
        variantClasses[variant],
        className
      )}
      style={styles}
    >
      {children && (
        <span className="opacity-0">{children}</span>
      )}
    </div>
  )
}

interface SkeletonInputProps {
  label?: string
  className?: string
  hint?: boolean
}

export function SkeletonInput({ label, className, hint }: SkeletonInputProps) {
  return (
    <div className={cx('space-y-1.5', className)}>
      {label && (
        <Skeleton variant="text" width="30%" height={16} className="mb-1.5" />
      )}
      <Skeleton variant="rectangular" height={40} className="rounded-lg" />
      {hint && (
        <Skeleton variant="text" width="60%" height={14} className="mt-1.5" />
      )}
    </div>
  )
}

interface SkeletonSelectProps {
  label?: string
  className?: string
}

export function SkeletonSelect({ label, className }: SkeletonSelectProps) {
  return (
    <div className={cx('space-y-1.5', className)}>
      {label && (
        <Skeleton variant="text" width="35%" height={16} className="mb-1.5" />
      )}
      <Skeleton variant="rectangular" height={40} className="rounded-lg" />
    </div>
  )
}

interface SkeletonCheckboxProps {
  label?: string
  className?: string
}

export function SkeletonCheckbox({ label, className }: SkeletonCheckboxProps) {
  return (
    <div className={cx('flex items-center gap-2', className)}>
      <Skeleton variant="rectangular" width={20} height={20} className="rounded" />
      {label && (
        <Skeleton variant="text" width="40%" height={16} />
      )}
    </div>
  )
}

interface SkeletonTextAreaProps {
  label?: string
  className?: string
  rows?: number
}

export function SkeletonTextArea({ label, className, rows = 4 }: SkeletonTextAreaProps) {
  return (
    <div className={cx('space-y-1.5', className)}>
      {label && (
        <Skeleton variant="text" width="25%" height={16} className="mb-1.5" />
      )}
      <Skeleton 
        variant="rectangular" 
        height={rows * 24 + 16} 
        className="rounded-lg" 
      />
    </div>
  )
}

// Add shimmer animation to tailwind.config if not present
// @keyframes shimmer {
//   0% { background-position: -1000px 0; }
//   100% { background-position: 1000px 0; }
// }
// animation: shimmer 2s infinite linear;