'use client'

interface SliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  labels?: string[]
  disabled?: boolean
}

export function Slider({
  value,
  onChange,
  min = 1,
  max = 5,
  step = 1,
  labels,
  disabled = false
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="w-full">
      <div className="relative pt-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, #2563eb ${percentage}%, #e5e7eb ${percentage}%)`
          }}
        />
      </div>
      {labels && labels.length > 0 && (
        <div className="flex justify-between mt-2">
          {labels.map((label, index) => (
            <span
              key={index}
              className={`text-xs ${
                index + min === value
                  ? 'text-blue-600 font-medium'
                  : 'text-gray-500'
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
