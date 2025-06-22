import { clsx } from 'clsx'

export function Logo({ className }) {
    return (
        <img
            src="/logo/NewNesbahLogo.png"
            alt="Logo"
            className={clsx(className, 'h-9')}
        />
    )
}

export function Mark({ className }) {
    return (
        <img
            src="/logo/NewNesbahLogo.png"
            alt="Mark"
            className={clsx(className, 'h-9')}
        />
    )
}
