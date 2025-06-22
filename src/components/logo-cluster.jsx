import { clsx } from 'clsx'

function MainLogo() {
    return (
        <div className="absolute left-44 top-32 flex size-16 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5">
            <img src="../../images/logos/nesbahLogo.svg" alt="Nesbah Logo" className="h-9 fill-black" /> {/* Updated path */}
        </div>
    )
}

export function LogoCluster() {
    return (
        <div aria-hidden="true" className="relative h-full overflow-hidden">
            <div className="absolute left-1/2 h-full w-[26rem] -translate-x-1/2">
                <MainLogo />
                <img
                    src="../../images/logos/nesbahLogo.svg" // Updated path
                    alt="Nesbah Logo"
                    style={{ left: 360, top: 144 }}
                    className="absolute size-16 rounded-full bg-white shadow ring-1 ring-black/5"
                />
                {/* Repeat this with appropriate positions for additional logos, or remove extra logos */}
            </div>
        </div>
    )
}
