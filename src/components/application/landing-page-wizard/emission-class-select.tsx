'use client'

import { forwardRef } from 'react'
import { Select } from '@/components/base/select/select'
import { cx } from '@/utils/cx'

interface EmissionClassOption {
  id: string
  value: string
  label: string
  displayLabel: string
  color: string
  bgColor: string
  borderColor: string
}

const EMISSION_CLASSES: EmissionClassOption[] = [
  { 
    id: 'A',
    value: 'A', 
    label: 'Energieeffizienzklasse A',
    displayLabel: 'A', 
    color: 'text-white',
    bgColor: 'bg-[#00923F]',
    borderColor: 'border-[#00923F]'
  },
  { 
    id: 'B',
    value: 'B', 
    label: 'Energieeffizienzklasse B',
    displayLabel: 'B',
    color: 'text-white',
    bgColor: 'bg-[#4FB948]',
    borderColor: 'border-[#4FB948]'
  },
  { 
    id: 'C',
    value: 'C', 
    label: 'Energieeffizienzklasse C',
    displayLabel: 'C',
    color: 'text-gray-900',
    bgColor: 'bg-[#8ED644]',
    borderColor: 'border-[#8ED644]'
  },
  { 
    id: 'D',
    value: 'D', 
    label: 'Energieeffizienzklasse D',
    displayLabel: 'D',
    color: 'text-gray-900',
    bgColor: 'bg-[#F3E73F]',
    borderColor: 'border-[#F3E73F]'
  },
  { 
    id: 'E',
    value: 'E', 
    label: 'Energieeffizienzklasse E',
    displayLabel: 'E',
    color: 'text-gray-900',
    bgColor: 'bg-[#FBBA3C]',
    borderColor: 'border-[#FBBA3C]'
  },
  { 
    id: 'F',
    value: 'F', 
    label: 'Energieeffizienzklasse F',
    displayLabel: 'F',
    color: 'text-white',
    bgColor: 'bg-[#F37B38]',
    borderColor: 'border-[#F37B38]'
  },
  { 
    id: 'G',
    value: 'G', 
    label: 'Energieeffizienzklasse G',
    displayLabel: 'G',
    color: 'text-white',
    bgColor: 'bg-[#ED1C24]',
    borderColor: 'border-[#ED1C24]'
  }
]

interface EmissionClassSelectProps {
  value?: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
  id?: string
}

const EmissionClassBadge = ({ option }: { option: EmissionClassOption }) => {
  return (
    <div className="flex items-center gap-2">
      <div 
        className={cx(
          'inline-flex items-center justify-center',
          'w-6 h-6 rounded text-xs font-semibold',
          option.bgColor,
          option.color
        )}
      >
        {option.displayLabel}
      </div>
      <span className="text-primary">{option.label}</span>
    </div>
  )
}

export const EmissionClassSelect = forwardRef<HTMLDivElement, EmissionClassSelectProps>(
  ({ value, onChange, placeholder = "Emissionsklasse wählen", disabled, id }, ref) => {
    const selectedOption = EMISSION_CLASSES.find(opt => opt.value === value)

    // Erstelle eine erweiterte Items-Liste mit dem Farbindikator im Label
    const selectItems = EMISSION_CLASSES.map(option => ({
      id: option.id,
      label: option.label,
      icon: () => (
        <div 
          className={cx(
            'inline-flex items-center justify-center',
            'w-5 h-5 rounded text-xs font-semibold',
            option.bgColor,
            option.color
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

EmissionClassSelect.displayName = 'EmissionClassSelect'