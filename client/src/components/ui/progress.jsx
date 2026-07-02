import React from 'react'
import { cva } from 'class-variance-authority'

const progressVariants = cva('', {
  variants: {
    variant: {
      default: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      error: 'bg-error',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const ProgressBar = React.forwardRef(({
  className = '',
  value = 0,
  max = 100,
  variant,
  size = 'md',
  showLabel = false,
  label,
  ...props
}, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const sizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5',
    xl: 'h-3',
  }

  return (
    <div ref={ref} className={`flex flex-col gap-1 ${className}`} {...props}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
          <span className="text-xs font-medium text-foreground">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full rounded-full bg-muted overflow-hidden ${sizes[size] || sizes.md}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${progressVariants({ variant })}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
})
ProgressBar.displayName = 'ProgressBar'

export { ProgressBar }
