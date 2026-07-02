import React from 'react'

const Select = React.forwardRef(({ className = '', label, error, options, placeholder, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      <select
        ref={ref}
        className={`flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors hover:border-neutral-300 dark:hover:border-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
})
Select.displayName = 'Select'

export { Select }
