'use client'

import { forwardRef } from 'react'
import { Select } from '@/components/base/select/select'
import { cx } from '@/utils/cx'

interface EmissionClassOption {
  id: string
  value: string
  label: string
  displayLabel: string
  colorClass: string
  textColorClass: string
  borderColorClass: string
}

// Using theme-defined colors instead of hardcoded hex values
const EMISSION_CLASSES: EmissionClassOption[] = [
  { 
    id: 'A',
    value: 'A', 
    label: 'Energieeffizienzklasse A',
    displayLabel: 'A', 
    colorClass: 'bg-efficiency-a',
    textColorClass: 'text-efficiency-a',
    borderColorClass: 'border-efficiency-a'
  },
  { 
    id: 'B',
    value: 'B', 
    label: 'Energieeffizienzklasse B',
    displayLabel: 'B',
    colorClass: 'bg-efficiency-b',
    textColorClass: 'text-efficiency-b',
    borderColorClass: 'border-efficiency-b'
  },
  { 
    id: 'C',
    value: 'C', 
    label: 'Energieeffizienzklasse C',
    displayLabel: 'C',
    colorClass: 'bg-efficiency-c',
    textColorClass: 'text-efficiency-c',
    borderColorClass: 'border-efficiency-c'
  },
  { 
    id: 'D',
    value: 'D', 
    label: 'Energieeffizienzklasse D',
    displayLabel: 'D',
    colorClass: 'bg-efficiency-d',
    textColorClass: 'text-efficiency-d',
    borderColorClass: 'border-efficiency-d'
  },
  { 
    id: 'E',
    value: 'E', 
    label: 'Energieeffizienzklasse E',
    displayLabel: 'E',
    colorClass: 'bg-efficiency-e',
    textColorClass: 'text-efficiency-e',
    borderColorClass: 'border-efficiency-e'
  },
  { 
    id: 'F',
    value: 'F', 
    label: 'Energieeffizienzklasse F',
    displayLabel: 'F',
    colorClass: 'bg-efficiency-f',
    textColorClass: 'text-efficiency-f',
    borderColorClass: 'border-efficiency-f'
  },
  { 
    id: 'G',
    value: 'G', 
    label: 'Energieeffizienzklasse G',
    displayLabel: 'G',
    colorClass: 'bg-efficiency-g',
    textColorClass: 'text-efficiency-g',
    borderColorClass: 'border-efficiency-g'
  }
]

interface EmissionClassSelectProps {
  value?: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
  id?: string
}

export const EmissionClassSelectV2 = forwardRef<HTMLDivElement, EmissionClassSelectProps>(
  ({ value, onChange, placeholder = "Emissionsklasse wählen", disabled, id }, ref) => {
    
    // Create items with color badges using theme classes
    const selectItems = EMISSION_CLASSES.map(option => ({
      id: option.id,
      label: option.label,
      icon: () => (
        <div 
          className={cx(
            'inline-flex items-center justify-center',
            'w-5 h-5 rounded text-xs font-semibold',
            option.colorClass,
            option.textColorClass
          )}
        >
          {option.displayLabel}
        </div>
      )
    }))

    return (
      <div ref={ref}>
        <Select
          id={id}
          placeholder={placeholder}
          selectedKey={value}
          onSelectionChange={(key) => onChange(key as string | null)}
          disabled={disabled}
          items={selectItems}
        >
          {(item) => (
            <Select.Item key={item.id} id={item.id} label={item.label} icon={item.icon}>
              {item.label}
            </Select.Item>
          )}
        </Select>
      </div>
    )
  }
)

EmissionClassSelectV2.displayName = 'EmissionClassSelectV2'