'use client'

import { SelectHTMLAttributes, forwardRef } from 'react'
import { FiChevronDown } from 'react-icons/fi'

interface Option {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  options: Option[]
  error?: string
  onChange: (value: string) => void
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, onChange, className = '', value, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`
              w-full px-4 py-3 pr-10
              border-2 rounded-lg
              text-gray-900 bg-white
              appearance-none
              transition-all duration-200
              focus:outline-none focus:ring-0
              ${error
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-300 focus:border-blue-600'
              }
              ${className}
            `}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <FiChevronDown className="w-5 h-5 text-gray-500" />
          </div>
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
