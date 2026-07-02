import React from 'react'
import { cva } from 'class-variance-authority'

const cardVariants = cva([
  'rounded-xl border bg-card text-card-foreground transition-all duration-200',
], {
  variants: {
    variant: {
      default: 'border-border shadow-sm',
      elevated: 'border-border shadow-md hover:shadow-lg',
      ghost: 'border-transparent',
      interactive: 'border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
    },
    padding: {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
  },
})

const Card = React.forwardRef(({ className = '', variant, padding, ...props }, ref) => {
  return (
    <div ref={ref} className={cardVariants({ variant, padding, className })} {...props} />
  )
})
Card.displayName = 'Card'

const CardHeader = React.forwardRef(({ className = '', ...props }, ref) => (
  <div ref={ref} className={`flex flex-col gap-1.5 ${className}`} {...props} />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef(({ className = '', as: Tag = 'h3', ...props }, ref) => (
  <Tag ref={ref} className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props} />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef(({ className = '', ...props }, ref) => (
  <p ref={ref} className={`text-sm text-muted-foreground ${className}`} {...props} />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef(({ className = '', ...props }, ref) => (
  <div ref={ref} className={className} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef(({ className = '', ...props }, ref) => (
  <div ref={ref} className={`flex items-center pt-4 ${className}`} {...props} />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
