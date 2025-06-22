import { clsx } from 'clsx'

function Logo({ label, src, className }) {
  return (
      <div
          className={clsx(
              className,
              'absolute top-2 grid grid-cols-[1rem,1fr] items-center gap-2 whitespace-nowrap px-3 py-1',
              'rounded-full bg-gradient-to-t from-gray-800 from-50% to-gray-700 ring-1 ring-inset ring-white/10',
          )}
      >
        <img alt="" src={src} className="size-4" />
        <span className="text-sm/6 font-medium text-white">{label}</span>
      </div>
  )
}

export function LogoTimeline() {
  return (
      <div aria-hidden="true" className="relative h-full overflow-hidden">
        <div className="absolute inset-0 top-8 z-10 flex items-center justify-center">
          <div className="relative flex size-24 items-center justify-center rounded-xl bg-gradient-to-t from-white/5 to-white/25 shadow outline outline-offset-[-5px] outline-white/5 ring-1 ring-inset ring-white/10">
            <img src="../../images/logos/nesbahLogo.svg" alt="Nesbah Logo" className="h-9 fill-white" /> {/* Updated path */}
          </div>
        </div>
        <div className="absolute inset-0 grid grid-cols-1 pt-8">
          <div className="group relative">
            <Logo
                label="Nesbah"
                src="../../images/logos/nesbahLogo.svg" // Updated path
                className=""
            />
            {/* Repeat or remove other logos as needed */}
          </div>
        </div>
      </div>
  )
}
