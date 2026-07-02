import React from 'react'
import { cva } from 'class-variance-authority'

const inputVariants = cva([
  'flex w-full rounded-lg border bg-background px-3 py-2 text-sm',
  'placeholder:text-muted-foreground',
  'transition-colors duration-200',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'file:border-0 file:bg-transparent file:text-sm file:font-medium',
], {
  variants: {
    variant: {
      default: 'border-input hover:border-neutral-300 dark:hover:border-neutral-600',
      error: 'border-error focus-visible:ring-error',
      ghost: 'border-transparent bg-transparent hover:bg-accent',
    },
    size: {
      sm: 'h-9 text-xs',
      md: 'h-10',
      lg: 'h-11 text-base',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
})

const Input = React.forwardRef(({ className = '', variant, size, ...props }, ref) => {
  return (
    <input ref={ref} className={inputVariants({ variant, size, className })} {...props} />
  )
})
Input.displayName = 'Input'

const InputWrapper = React.forwardRef(({ className = '', children, error, helperText, label, ...props }, ref) => (
  <div ref={ref} className={`flex flex-col gap-1.5 ${className}`} {...props}>
    {label && (
      <label className="text-sm font-medium text-foreground">{label}</label>
    )}
    {children}
    {error && (
      <p className="text-xs text-error">{error}</p>
    )}
    {helperText && !error && (
      <p className="text-xs text-muted-foreground">{helperText}</p>
    )}
  </div>
))
InputWrapper.displayName = 'InputWrapper'

export { Input, InputWrapper, inputVariants }
