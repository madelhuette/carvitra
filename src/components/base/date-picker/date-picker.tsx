import { Input } from '../input/input'

interface DatePickerProps {
  id?: string
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  hint?: string
  disabled?: boolean
  error?: string
  className?: string
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Select date',
  hint,
  disabled,
  error,
  className
}: DatePickerProps) {
  return (
    <Input
      id={id}
      type="date"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      hint={hint}
      disabled={disabled}
      error={error}
      className={className}
    />
  )
}