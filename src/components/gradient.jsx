import { clsx } from 'clsx'

export function Gradient({ className, ...props }) {
    return (
        <div
            {...props}
            className={clsx(
                className,
                'bg-[linear-gradient(115deg,var(--tw-gradient-stops))] from-[#1BE5DD] from-[33%] via-[#4986CE] via-[70%] to-[#654BC4] sm:bg-[linear-gradient(145deg,var(--tw-gradient-stops))]',
            )}
        />
    )
}

export function GradientBackground({ className }) {
    return (
        <div className={`relative mx-auto max-w-7xl ${className}`}>
            <div
                className={clsx(
                    'absolute -right-60 -top-44 h-60 w-[36rem] transform-gpu md:right-0',
                    'bg-[linear-gradient(115deg,var(--tw-gradient-stops))] from-[#1BE5DD] from-[33%] via-[#4986CE] via-[70%] to-[#654BC4]',
                    'rotate-[-10deg] rounded-full blur-3xl',
                    className // Apply the passed class
                )}
            />
        </div>
    )
}

