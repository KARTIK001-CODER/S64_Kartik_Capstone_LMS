import React from 'react'
import { cva } from 'class-variance-authority'

const badgeVariants = cva([
  'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
], {
  variants: {
    variant: {
      default: 'bg-primary/10 text-primary border border-primary/20',
      secondary: 'bg-secondary text-secondary-foreground',
      success: 'bg-success/10 text-success border border-success/20',
      warning: 'bg-warning/10 text-warning border border-warning/20',
      error: 'bg-error/10 text-error border border-error/20',
      neutral: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
      outline: 'border border-border text-foreground',
    },
    size: {
      sm: 'px-2 py-0.5 text-[11px]',
      md: 'px-2.5 py-0.5 text-xs',
      lg: 'px-3 py-1 text-sm',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
})

const Badge = React.forwardRef(({ className = '', variant, size, ...props }, ref) => {
  return (
    <span ref={ref} className={badgeVariants({ variant, size, className })} {...props} />
  )
})

Badge.displayName = 'Badge'

export { Badge, badgeVariants }
