import { clsx } from 'clsx'

export function LogoCloud({ className }) {
    return (
        // <div className={`mt-12 ${className}`}>
        //     <div className="grid grid-cols-2 gap-8 sm:flex sm:justify-center sm:space-x-36">
        //         <img src="/partner-logo/emirates.png" alt="Logo 1" className="h-14 w-auto mx-auto sm:mx-0 object-contai" />
        //         <img src="/partner-logo/FAB.jpeg" alt="Logo 2" className="h-20 w-auto mx-auto sm:mx-0 object-contai" />
        //         <img src="/partner-logo/geidea.jpg" alt="Logo 3" className="h-16 w-auto mx-auto sm:mx-0 object-contai" />
        //         <img src="/partner-logo/LazyWait.png" alt="Logo 4" className="h-10 w-auto mx-auto sm:mx-0 object-contai" />
        //     </div>
        // </div>
        <div className="bg-white py-6 sm:py-8">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto mt-10 grid max-w-lg grid-cols-4 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-6 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-4">
                    <img
                        src="/partner-logo/LazyWait.png"
                        alt="LazyWait logo"
                        width={158}
                        height={48}
                        className="col-span-2 max-h-12 w-full object-contain sm:col-start-3 lg:col-span-1"
                    />
                <img
                    src="/partner-logo/FAB.jpeg"
                    alt="FAB logo"
                    width={158}
                    height={30}
                    className="col-span-2 max-h-13 object-contain lg:col-span-1"
                />
                <img
                    src="/partner-logo/geidea.jpg"
                    alt="Geidea logo"
                    width={158}
                        height={48}
                        className="col-span-2 max-h-13 object-contain lg:col-span-1"
                />

                    <img
                        src="/partner-logo/emirates.png"
                        alt="Emirates logo"
                        width={158}
                        height={48}
                        className="col-span-2 max-h-12 w-full object-contain lg:col-span-1"
                    />

                </div>
            </div>
        </div>
    );
}
