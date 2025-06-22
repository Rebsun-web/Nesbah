'use client'

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react'
import { Bars3Icon } from '@heroicons/react/24/solid'
import { motion } from 'framer-motion'
import { Link } from './link'
import { Logo } from './logo'
import { PlusGrid, PlusGridItem, PlusGridRow } from './plus-grid'
import {Button} from "@/components/button";


const links = [

  { href: '/', label: 'الصفحة رئيسية' },
  { href: '/contact', label: 'شركائنا' },
  { href: '/about', label: 'من نحن' },
  { href: '/calculator', label: 'الحاسبة' },
  { href: 'https://news.nesbah.com.sa/', label: 'الاخبار' },
]

function DesktopNav() {
  return (
      <nav className="relative hidden lg:flex">
        {links.map(({ href, label }) => (
            <PlusGridItem key={href} className="relative flex">
              <Link
                  href={href}
                  className="flex items-center px-4 py-3 text-base font-medium text-[#1E1851] bg-blend-multiply data-[hover]:bg-gray-950/[2.5%] border-none outline-none"
              >
                {label}
              </Link>
            </PlusGridItem>
        ))}
        <div className="flex items-center pr-2 gap-4">

          <Button href="/login" type="button" className="rounded-full sm:border-2 sm:border-purple-800 !bg-transparent px-2 py-1 text-sm font-semibold sm:text-black shadow-sm sm:hover:bg-purple-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            تسجيل
          </Button>
        </div>
      </nav>
  )
}

function MobileNavButton() {
  return (
      <DisclosureButton
          className="flex size-12 items-center justify-center self-center rounded-lg data-[hover]:bg-black/5 lg:hidden"
          aria-label="Open main menu"
      >
        <Bars3Icon className="size-6" />
      </DisclosureButton>
  )
}

function MobileNavLoginButton() {
  return (
      <button
          type="button"
          href= "https://nesbah-638895547402.me-central2.run.app/login"
          className="rounded-md px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-purple-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          style={{
            background:
              'linear-gradient(90deg, #742CFF -9.53%, #1E1851 180.33%)',
          }}
      >
        تسجيل
      </button>
  )
}

function MobileNav() {
  return (
      <DisclosurePanel className="lg:hidden bg-white/20 rounded-xl px-3">
        <div className="flex flex-col gap-6 py-5">
          {links.map(({href, label}, linkIndex) => (
              <motion.div
                  initial={{opacity: 0, rotateX: -90}}
                  animate={{opacity: 1, rotateX: 0}}
                  transition={{
                    duration: 0.15,
                    ease: 'easeInOut',
                    rotateX: {duration: 0.3, delay: linkIndex * 0.1},
                  }}
                  key={href}
              >
                <Link href={href} className="text-base font-medium text-gray-950">
                  {label}
                </Link>
              </motion.div>
          ))}
        </div>

        <div className="absolute left-1/2 w-screen -translate-x-1/2">
          <div className="absolute inset-x-0 top-0 border-t border-black/5" />
          <div className="absolute inset-x-0 top-2 border-t border-black/5" />
        </div>
      </DisclosurePanel>
  )
}

export function Navbar({banner}) {
  return (
      <Disclosure as="header" className="pt-6 sm:pt-8">
        <PlusGrid>
          <PlusGridRow className="relative flex justify-between">
            <div className="relative flex gap-6">
              <PlusGridItem className="py-3">
                <Link href="/" title="Home">
                  <Logo className="h-9" />
                </Link>
              </PlusGridItem>
              {banner && <div className="relative hidden items-center py-3 lg:flex">{banner}</div>}
            </div>
            <DesktopNav />
            <div className="flex items-center gap-4 lg:hidden">
              <MobileNavLoginButton />
              <MobileNavButton />
            </div>
          </PlusGridRow>
        </PlusGrid>
        <MobileNav />
      </Disclosure>
  )
}