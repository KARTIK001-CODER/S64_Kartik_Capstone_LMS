import React from 'react'
import { cva } from 'class-variance-authority'

const skeletonVariants = cva('skeleton', {
  variants: {
    variant: {
      text: 'h-4 w-full',
      title: 'h-6 w-3/4',
      heading: 'h-8 w-1/2',
      avatar: 'rounded-full',
      thumbnail: 'aspect-video w-full rounded-lg',
      card: 'h-48 w-full rounded-xl',
      badge: 'h-6 w-16 rounded-md',
      button: 'h-10 w-24 rounded-lg',
    },
  },
  defaultVariants: {
    variant: 'text',
  },
})

const Skeleton = React.forwardRef(({ className = '', variant, ...props }, ref) => (
  <div ref={ref} className={skeletonVariants({ variant, className })} {...props} />
))
Skeleton.displayName = 'Skeleton'

const SkeletonCard = ({ className = '' }) => (
  <div className={`rounded-xl border border-border p-6 space-y-4 ${className}`}>
    <Skeleton variant="thumbnail" />
    <Skeleton variant="title" />
    <Skeleton variant="text" />
    <Skeleton variant="text" className="w-1/2" />
    <div className="flex justify-between pt-2">
      <Skeleton variant="badge" />
      <Skeleton variant="button" />
    </div>
  </div>
)

export { Skeleton, SkeletonCard }
