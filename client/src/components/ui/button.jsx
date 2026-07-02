import React from 'react'
import { cva } from 'class-variance-authority'

const buttonVariants = cva([
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  'disabled:pointer-events-none disabled:opacity-50',
  'select-none',
], {
  variants: {
    variant: {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      outline: 'border border-border bg-background hover:bg-accent hover:text-accent-foreground',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      danger: 'bg-error text-error-foreground hover:bg-error/90 shadow-sm',
      success: 'bg-success text-success-foreground hover:bg-success/90 shadow-sm',
      link: 'text-primary underline-offset-4 hover:underline',
    },
    size: {
      xs: 'h-8 px-2.5 text-xs',
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-11 px-5 text-base',
      xl: 'h-12 px-6 text-base',
      'icon-xs': 'h-8 w-8',
      'icon-sm': 'h-9 w-9',
      'icon-md': 'h-10 w-10',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
})

const Button = React.forwardRef(({
  className = '',
  variant,
  size,
  children,
  loading = false,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      className={buttonVariants({ variant, size, className })}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export { Button, buttonVariants }
