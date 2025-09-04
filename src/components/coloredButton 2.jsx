import * as Headless from '@headlessui/react'
import { clsx } from 'clsx'
import { Link } from './link'

const variants = {
    primary: clsx(
        'inline-flex items-center justify-center px-4 py-[calc(theme(spacing.2)-1px)]',
        'rounded-full border border-transparent bg-[#2F164B] shadow-md',
        'whitespace-nowrap text-base font-medium text-white',
        'data-[disabled]:bg-[#2F164B] data-[hover]:bg-[#2F164B]/40 data-[disabled]:opacity-40',
    ),
    secondary: clsx(
        'relative inline-flex items-center justify-center px-4 py-[calc(theme(spacing.2)-1px)]',
        'rounded-full border border-transparent bg-[#2F164B]/15 shadow-md ring-1 ring-[#D15052]/15',
        'after:absolute after:inset-0 after:rounded-full after:shadow-[inset_0_0_2px_1px_#ffffff4d]',
        'whitespace-nowrap text-base font-medium text-white',
        'data-[disabled]:bg-[#2F164B] data-[hover]:bg-[#2F164B]/40 data-[disabled]:opacity-40',
    ),
    outline: clsx(
        'inline-flex items-center justify-center px-2 py-[calc(theme(spacing.[1.5])-1px)]',
        'rounded-lg border border-transparent shadow ring-1 ring-black/10',
        'whitespace-nowrap text-base font-medium text-white',
        'data-[disabled]:bg-[#2F164B] data-[hover]:bg-[#2F164B]/40 data-[disabled]:opacity-40',
    ),
}


export function coloredButton({ variant = 'primary', className, ...props }) {
    className = clsx(className, variants[variant])

    if (typeof props.href === 'undefined') {
        return <Headless.coloredButton {...props} className={className} />
    }

    return <Link {...props} className={className} />
}
