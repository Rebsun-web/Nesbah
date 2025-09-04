import * as Headless from '@headlessui/react'
import { clsx } from 'clsx'
import { Link } from './link'

const variants = {
  primary: clsx(
      'inline-flex items-center justify-center px-4 py-[calc(theme(spacing.2)-1px)]',
      'rounded-full border border-transparent bg-white shadow-md',
      'whitespace-nowrap text-base font-medium text-gray-950',
      'data-[disabled]:bg-white data-[disabled]:opacity-40', // Keep disabled styling separate
      'hover:bg-white/30 hover:shadow-lg hover:ring-2 hover:ring-white/30', // Light hover effect and glow
      'transition ease-in-out duration-200' // Smooth transition for hover effect
  ),
  secondary: clsx(
      'relative inline-flex items-center justify-center px-4 py-[calc(theme(spacing.2)-1px)]',
      'rounded-full border border-transparent bg-white/15 shadow-md ring-1 ring-[#D15052]/15',
      'after:absolute after:inset-0 after:rounded-full after:shadow-[inset_0_0_2px_1px_#ffffff4d]',
      'whitespace-nowrap text-base font-medium text-gray-950',
      'data-[disabled]:bg-white data-[disabled]:opacity-40',
      'hover:bg-white/30 hover:shadow-lg hover:ring-2 hover:ring-white/30',
      'transition ease-in-out duration-200'
  ),
  outline: clsx(
      'inline-flex items-center justify-center px-2 py-[calc(theme(spacing.[1.5])-1px)]',
      'rounded-lg border border-transparent shadow ring-1 ring-black/10',
      'whitespace-nowrap text-sm font-medium text-gray-950',
      'data-[disabled]:bg-white data-[disabled]:opacity-40',
      'hover:bg-white/30 hover:shadow-lg hover:ring-2 hover:ring-white/30',
      'transition ease-in-out duration-200'
  ),
}


export function Button({ variant = 'primary', className, ...props }) {
  className = clsx(className, variants[variant])

  if (typeof props.href === 'undefined') {
    return <Headless.Button {...props} className={className} />
  }

  return <Link {...props} className={className} />
}

// TouchTarget component for better touch accessibility
export function TouchTarget({ className, ...props }) {
  return (
    <span
      {...props}
      className={clsx(
        className,
        'inline-flex items-center justify-center min-w-[44px] min-h-[44px]'
      )}
    />
  )
}
