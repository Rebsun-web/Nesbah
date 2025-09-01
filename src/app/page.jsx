'use client'

import { Button } from '@/components/button'
import { Container } from '@/components/container'
import { NewFooter } from '@/components/NewFooter'
import { Navbar } from '@/components/navbar'
import { Heading, Subheading } from '@/components/text'
import React, { useState, useEffect } from 'react';
import { CloudArrowUpIcon, LockClosedIcon, ServerIcon, CalculatorIcon, BanknotesIcon } from '@heroicons/react/20/solid'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { MinusSmallIcon, PlusSmallIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/contexts/LanguageContext'

function Hero() {
  const { t } = useLanguage()
  
  return (
    <div className="relative">
      <Container className="relative">
        <Navbar />
      </Container>
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mt-2 grid grid-cols-1 lg:mt-16 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          {/* Left Column - Text Content */}
          <div className="my-16 flex flex-col items-center lg:items-start lg:justify-center">
            <Heading
              as="h2"
              className="max-w-sm text-center tracking-wide font-medium text-2xl text-[#1E1851] lg:max-w-2xl lg:text-start lg:text-4xl xl:text-5xl 2xl:text-6xl"
            >
              {t('hero.mainTitle')}
            </Heading>
            <p className="my-6 tracking-wide max-w-xl font-normal text-center text-gray-700 lg:my-8 lg:max-w-2xl lg:text-start lg:text-lg">
              {t('hero.description')}
            </p>
            
            {/* POS Financing Button - Below Description Text */}
            <div className="flex justify-center lg:justify-start w-full">
              <Button
                href="/login"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-full px-8 py-4 text-lg font-medium text-white shadow-lg hover:scale-105 transition-transform duration-200"
                style={{
                  background:
                    'linear-gradient(90deg, #742CFF -9.53%, #1E1851 180.33%)',
                }}
              >
                <img
                  src="/characters/PosIcon.png"
                  className="h-6 w-6 object-contain"
                  alt="POS Icon"
                />
                {t('services.posFinancing')}
              </Button>
            </div>
          </div>
          
          {/* Right Column - Image Only */}
          <div className="flex flex-col items-center justify-center">
            <div className="h-[300px] sm:h-[400px] lg:h-[450px] xl:h-[500px] flex items-center justify-center">
              <img
                src="/characters/HomeCartoon.png"
                className="h-full w-full object-contain"
                alt="Hero Illustration"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BentoSection() {
  const { t } = useLanguage()
  
  return (
    <div className="relative bg-[#F5F5F5] bg-opacity-50 py-8 lg:py-16">
      {/* Statistics Section */}
      <div className="flex justify-center mb-8 lg:mb-12">
        <div className="flex justify-center">
          <img
            src="/company/NumberOfPartner.png"
            className="h-[130px] w-[380px] object-contain lg:h-[130px] lg:w-[635px]"
            alt="Partner Statistics"
          />
        </div>
      </div>

      {/* Our Services Button */}
      <div className="flex justify-center mb-12 lg:mb-16">
        <span className="rounded-md bg-white px-6 py-4 text-base font-medium text-[#742CFF] shadow-lg hover:shadow-xl transition-shadow duration-200">
          {t('services.ourServices')}
        </span>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* POS Financing Section - Primary Service */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Right Column - Image */}
          <div className="order-1 flex items-center justify-center lg:order-2">
            <img
              src="/characters/pos.PNG"
              className="h-auto w-[250px] object-contain lg:w-[400px] xl:w-[450px]"
              alt="POS Financing"
            />
          </div>

          {/* Left Column - Content */}
          <div className="order-2 flex flex-col items-center lg:items-start lg:order-1">
            <div className="text-center lg:text-start max-w-xl">
              {/* Heading */}
              <h2 className="mb-4 text-xl font-bold text-[#6B3FC4] lg:text-2xl xl:text-3xl">
                {t('services.posFinancing')}
              </h2>
              {/* Subheading */}
              <p className="mb-8 text-base lg:text-lg text-gray-700 leading-relaxed">
                {t('services.posFinancingDescription')}
              </p>

              {/* Features List */}
              <div className="mb-8 flex flex-col gap-6">
                <div className="flex items-center gap-4 justify-center lg:justify-start">
                  <img
                    src="/characters/PosOne.png"
                    alt="Transparent Comparison"
                    className="h-8 w-8 lg:h-10 lg:w-10 flex-shrink-0"
                  />
                  <span className="text-sm font-medium lg:text-lg">
                    {t('services.transparentComparison')}
                  </span>
                </div>
                <div className="flex items-center gap-4 justify-center lg:justify-start">
                  <img
                    src="/characters/PosTwo.png"
                    alt="Save Time"
                    className="h-8 w-8 lg:h-10 lg:w-10 flex-shrink-0"
                  />
                  <span className="text-sm font-medium lg:text-lg">
                    {t('services.saveTime')}
                  </span>
                </div>
                <div className="flex items-center gap-4 justify-center lg:justify-start">
                  <img
                    src="/characters/PosThree.png"
                    alt="Direct Communication"
                    className="h-8 w-8 lg:h-10 lg:w-10 flex-shrink-0"
                  />
                  <span className="text-sm font-medium lg:text-lg">
                    {t('services.directCommunication')}
                  </span>
                </div>
              </div>

              {/* Apply Now Button */}
              <div className="flex justify-center lg:justify-start">
                <Button
                  href="/login"
                  type="button"
                  className="rounded-full px-12 py-6 text-base font-medium text-white shadow-lg hover:scale-105 transition-transform duration-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  style={{
                    background:
                      'linear-gradient(87.69deg, #1E1851 -9.53%, #4436B7 89.33%)',
                  }}
                >
                  {t('services.applyForPosFinancing')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FAQ() {
  const { t } = useLanguage()
  const [openItems, setOpenItems] = useState(new Set())

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }

  const faqItems = [
    {
      question: t('faq.posFinancing.title'),
      answer: t('faq.posFinancing.content')
    },
    {
      question: t('faq.howItWorks.title'),
      answer: t('faq.howItWorks.content')
    },
    {
      question: t('faq.requirements.title'),
      answer: t('faq.requirements.content')
    }
  ]

  return (
    <div className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="mx-auto divide-y divide-gray-900/10">
          <h2 className="text-3xl font-bold leading-10 tracking-tight text-gray-900 text-center mb-12">
            {t('faq.title')}
          </h2>
          <dl className="mt-10 space-y-6 divide-y divide-gray-900/10">
            {faqItems.map((item, index) => (
              <Disclosure as="div" key={index} className="pt-6">
                {({ open }) => (
                  <>
                    <dt>
                      <DisclosureButton
                        className="flex w-full items-start justify-between text-left text-gray-900 hover:text-[#742CFF] transition-colors duration-200"
                        onClick={() => toggleItem(index)}
                      >
                        <span className="text-lg font-semibold leading-7 pr-4">
                          {item.question}
                        </span>
                        <span className="ml-6 flex h-7 items-center flex-shrink-0">
                          {openItems.has(index) ? (
                            <MinusSmallIcon className="h-6 w-6" aria-hidden="true" />
                          ) : (
                            <PlusSmallIcon className="h-6 w-6" aria-hidden="true" />
                          )}
                        </span>
                      </DisclosureButton>
                    </dt>
                    {openItems.has(index) && (
                      <dd className="mt-4 pr-12">
                        <p className="text-base leading-7 text-gray-600">
                          {item.answer}
                        </p>
                      </dd>
                    )}
                  </>
                )}
              </Disclosure>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}

function Newsletter() {
  const { t } = useLanguage()
  
  return (
    <div className="bg-[#1E1851] py-16 sm:py-20">
      <div className="mx-auto max-w-2xl px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          {t('newsletter.title')}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-gray-300 lg:text-xl">
          {t('newsletter.description')}
        </p>
        <form className="mx-auto mt-10 flex max-w-md gap-x-4">
          <label htmlFor="email-address" className="sr-only">
            Email address
          </label>
          <input
            id="email-address"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="min-w-0 flex-auto rounded-md border-0 bg-white/10 px-4 py-3 text-white shadow-sm ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 placeholder-gray-400"
            placeholder={t('newsletter.placeholder')}
          />
          <button
            type="submit"
            className="flex-none rounded-md bg-white px-4 py-3 text-sm font-semibold text-[#1E1851] shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors duration-200"
          >
            {t('newsletter.subscribe')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div className="w-full min-h-screen bg-no-repeat bg-contain" style={{
      backgroundImage: "url('/background/Backgrounds.png')", // 🔁 your actual image path
    }}>
      <Hero />
      <main>
        <Container className="mt-2"></Container>
        <div>
          <BentoSection />
          <FAQ />
          <Newsletter />
        </div>
      </main>
      <NewFooter />
    </div>
  )
}
