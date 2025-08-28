'use client'

import {
    Disclosure,
    DisclosureButton,
    DisclosurePanel,
    Menu,
    MenuButton,
    MenuItem,
    MenuItems,
} from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import BankLogo from '@/components/BankLogo'
import BankLogoUploadModal from '@/components/BankLogoUploadModal'
import { makeAuthenticatedRequest } from '@/lib/auth/client-auth'
import LanguageSwitcher from './LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext'

export default function BankNavbar() {
    const router = useRouter()
    const pathname = usePathname()
    const [userInfo, setUserInfo] = useState(null)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [isLogoUploadModalOpen, setIsLogoUploadModalOpen] = useState(false)
    const { t } = useLanguage()

    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser)
                setUserInfo(parsedUser)
            } catch (error) {
                console.error('Error parsing user data:', error)
            }
        }
    }, [])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const button = event.target.closest('button')
            
            if (dropdownOpen && !button?.closest('.relative')) {
                setDropdownOpen(false)
            }
        }

        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [dropdownOpen])

    const navigation = [
        { name: t('nav.dashboard'), href: '/bankPortal' },
        { name: t('nav.leads'), href: '/bankPortal/bankLeads' },
    ]

    const userNavigation = [
        { name: t('nav.updateLogo'), action: 'updateLogo' },
        { name: t('nav.logout'), action: 'logout' },
    ]

    function classNames(...classes) {
        return classes.filter(Boolean).join(' ')
    }

    const handleNavigation = (item) => {
        if (item.action === 'logout') {
            localStorage.removeItem('user')
            router.push('/login')
        } else if (item.action === 'updateLogo') {
            setIsLogoUploadModalOpen(true)
        } else if (item.href) {
            router.push(item.href)
        }
    }

    const handleLogoUploadSuccess = async (newLogoUrl) => {
        try {
            // Update user info with new logo URL
            if (userInfo) {
                const updatedUserInfo = { ...userInfo, logo_url: newLogoUrl }
                setUserInfo(updatedUserInfo)
                localStorage.setItem('user', JSON.stringify(updatedUserInfo))
            }
        } catch (error) {
            console.error('Error updating logo in navbar:', error)
        }
    }

    return (
        <>
            <Disclosure as="nav" className="bg-[#1E1851]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                    <div className="flex">
                        <div className="-ml-2 ml-2 flex items-center md:hidden">
                            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                                <span className="absolute -inset-0.5" />
                                <span className="sr-only">Open main menu</span>
                                <Bars3Icon aria-hidden="true" className="block size-6 group-data-[open]:hidden" />
                                <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-[open]:block" />
                            </DisclosureButton>
                        </div>
                        <div className="flex shrink-0 items-center">
                            <img
                                alt="Your Company"
                                src="/logo/BnwLogo.png"
                                className="h-8 w-auto"
                            />
                        </div>
                        <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => router.push(item.href)}
                                        aria-current={isActive ? 'page' : undefined}
                                        className={classNames(
                                            isActive
                                                ? 'bg-purple-700 text-white'
                                                : 'text-gray-300 hover:bg-white-200 hover:text-white',
                                            'rounded-md px-3 py-2 text-sm font-medium',
                                        )}
                                    >
                                        {item.name}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className="hidden md:ml-4 md:flex md:shrink-0 md:items-center">
                            {/* Language Switcher */}
                            <div className="mr-4">
                                <LanguageSwitcher variant="minimal" />
                            </div>
                            
                            {/* Bank information */}
                            <div className="mr-4 text-white text-sm">
                                {userInfo ? `Bank: ${userInfo.entity_name || userInfo.email || 'Unknown Bank'}` : 'No user data'}
                            </div>

                            {/* Profile dropdown */}
                            <div className="relative ml-3">
                                <button 
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                                >
                                    <span className="absolute -inset-1.5" />
                                    <span className="sr-only">Open user menu</span>
                                    {userInfo ? (
                                        <>
                                            {userInfo.logo_url ? (
                                                <img
                                                    src={userInfo.logo_url}
                                                    alt={userInfo.entity_name}
                                                    className="size-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="size-8 rounded-full bg-blue-500 flex items-center justify-center">
                                                    <span className="text-white text-sm font-bold">
                                                        {userInfo.entity_name ? userInfo.entity_name.charAt(0).toUpperCase() : 'B'}
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="size-8 rounded-full bg-gray-600 flex items-center justify-center">
                                            <span className="text-white text-sm">?</span>
                                        </div>
                                    )}
                                </button>
                                
                                {/* Simple dropdown menu */}
                                {dropdownOpen && (
                                    <div 
                                        className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5"
                                    >
                                        {userNavigation.map((item) => (
                                            <button
                                                key={item.name}
                                                onClick={() => {
                                                    handleNavigation(item)
                                                    setDropdownOpen(false)
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                {item.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <DisclosurePanel className="md:hidden">
                <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <DisclosureButton
                                key={item.name}
                                as="button"
                                onClick={() => router.push(item.href)}
                                aria-current={isActive ? 'page' : undefined}
                                className={classNames(
                                    isActive
                                        ? 'bg-gray-900 text-white'
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                                    'block rounded-md px-3 py-2 text-base font-medium',
                                )}
                            >
                                {item.name}
                            </DisclosureButton>
                        )
                    })}
                </div>
                <div className="border-t border-gray-700 pb-3 pt-4">
                    <div className="flex items-center px-5 sm:px-6">
                        <div className="shrink-0">
                            {userInfo ? (
                                <BankLogo
                                    bankName={userInfo.entity_name}
                                    logoUrl={userInfo.logo_url}
                                    size="md"
                                />
                            ) : (
                                <div className="size-10 rounded-full bg-gray-600 flex items-center justify-center">
                                    <span className="text-white text-base">?</span>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            className="relative ml-auto shrink-0 rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                        >
                            <span className="absolute -inset-1.5" />
                            <span className="sr-only">View notifications</span>
                            <BellIcon aria-hidden="true" className="size-6" />
                        </button>
                    </div>
                    <div className="mt-3 space-y-1 px-2 sm:px-3">
                        {/* Language Switcher in mobile menu */}
                        <div className="px-3 py-2">
                            <LanguageSwitcher variant="default" />
                        </div>
                        {userNavigation.map((item) => (
                            <DisclosureButton
                                key={item.name}
                                as="button"
                                onClick={() => handleNavigation(item)}
                                className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
                            >
                                {item.name}
                            </DisclosureButton>
                        ))}
                    </div>
                </div>
            </DisclosurePanel>
        </Disclosure>

        {/* Logo Upload Modal */}
        <BankLogoUploadModal
            isOpen={isLogoUploadModalOpen}
            onClose={() => setIsLogoUploadModalOpen(false)}
            onUploadSuccess={handleLogoUploadSuccess}
            currentLogoUrl={userInfo?.logo_url}
            bankName={userInfo?.entity_name || 'Bank'}
        />
        </>
    )
}