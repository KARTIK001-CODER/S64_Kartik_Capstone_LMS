import React from 'react'
import { cva } from 'class-variance-authority'

const avatarVariants = cva([
  'relative inline-flex items-center justify-center flex-shrink-0 overflow-hidden rounded-full bg-primary/10 text-primary font-semibold',
], {
  variants: {
    size: {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-xl',
      '2xl': 'h-20 w-20 text-2xl',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

const Avatar = React.forwardRef(({ className = '', size, src, alt, initials, ...props }, ref) => {
  const [imgError, setImgError] = React.useState(false)

  if (src && !imgError) {
    return (
      <div ref={ref} className={avatarVariants({ size, className })} {...props}>
        <img
          src={src}
          alt={alt || ''}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  return (
    <div ref={ref} className={avatarVariants({ size, className })} {...props}>
      {initials || alt?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'}
    </div>
  )
})
Avatar.displayName = 'Avatar'

export { Avatar }
