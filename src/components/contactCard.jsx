import { EnvelopeIcon, EyeIcon } from '@heroicons/react/20/solid'

const people = [
    {
        name: 'Jane Cooper',
        title: 'Regional Paradigm Technician',
        role: 'Admin',
        email: 'janecooper@example.com',
        telephone: '+1-202-555-0170',
    },
    {
        name: 'Jane Cooper',
        title: 'Regional Paradigm Technician',
        role: 'Admin',
        email: 'janecooper@example.com',
        telephone: '+1-202-555-0170',
    },
    {
        name: 'Jane Cooper',
        title: 'Regional Paradigm Technician',
        role: 'Admin',
        email: 'janecooper@example.com',
        telephone: '+1-202-555-0170',
    },
    {
        name: 'Jane Cooper',
        title: 'Regional Paradigm Technician',
        role: 'Admin',
        email: 'janecooper@example.com',
        telephone: '+1-202-555-0170',
    },
    {
        name: 'Jane Cooper',
        title: 'Regional Paradigm Technician',
        role: 'Admin',
        email: 'janecooper@example.com',
        telephone: '+1-202-555-0170',
    },
    {
        name: 'Jane Cooper',
        title: 'Regional Paradigm Technician',
        role: 'Admin',
        email: 'janecooper@example.com',
        telephone: '+1-202-555-0170',
    },

    // More people...
]

export default function ContactCard() {
    return (
        <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((person) => (
                <li key={person.email} className="col-span-1 divide-y divide-gray-300 rounded-lg bg-white shadow">
                    <div className="flex w-full items-center justify-between space-x-6 p-6 bg-gray-50 rounded-t-lg">
                        <div className="flex-1 truncate">
                            <div className="flex items-center space-x-3">
                                <h3 className="truncate text-sm font-medium text-gray-700">{person.name}</h3>
                                <span className="inline-flex shrink-0 items-center rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  {person.role}
                </span>
                            </div>
                            <p className="mt-1 truncate text-sm text-gray-500">{person.title}</p>
                        </div>
                        {/* Removed image here */}
                    </div>
                    <div>
                        <div className="-mt-px flex ">
                            <div className="flex w-0 flex-1 bg-[#1E1851] rounded-br-lg">
                                <a
                                    href={`mailto:${person.email}`}
                                    className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-white"
                                >
                                    <EnvelopeIcon aria-hidden="true" className="size-5 text-white" />
                                    Email
                                </a>
                            </div>
                            <div className="-ml-px flex w-0 flex-1 divide-x divide-white bg-[#1E1851] rounded-bl-lg">
                                <a
                                    href={`tel:${person.telephone}`}
                                    className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-white"
                                >
                                    <EyeIcon aria-hidden="true" className="size-5 text-white" />
                                    View
                                </a>

                            </div>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    )
}
