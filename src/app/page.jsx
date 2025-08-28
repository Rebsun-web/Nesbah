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
        <div className="mt-2 grid grid-cols-1 lg:mt-16 lg:grid-cols-[800px_400px] lg:gap-12">
          <div className="my-16">
            <Heading
              as="h2"
              className="max-w-sm text-center tracking-wide font-medium text-xl text-[#1E1851] lg:max-w-lg lg:text-start"
            >
              {t('hero.mainTitle')}
            </Heading>
            <p className="my-6 tracking-wide max-w-xl font-normal text-center lg:my-12 lg:text-start">
              {t('hero.description')}
            </p>
            <div className="grid grid-cols-2 justify-start gap-2 sm:grid-cols-[auto_auto_auto]">
              {/* First Button */}
              <Button
                className="inline-flex w-auto items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-medium text-white shadow-sm"
                style={{
                  background:
                    'linear-gradient(90deg, #742CFF -9.53%, #1E1851 180.33%)',
                }}
              >
                <img
                  src="/characters/personalloanIcon.png"
                  className="h-5 w-5 object-contain"
                />
                {t('services.personalLoans')}
              </Button>

              {/* Second Button */}
              <Button
                className="inline-flex w-auto items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white shadow-sm"
                style={{
                  background:
                    'linear-gradient(90deg, #742CFF -9.53%, #1E1851 180.33%)',
                }}
              >
                <img
                  src="/characters/ccIcon.png"
                  className="h-5 w-5 object-contain"
                />
                {t('services.creditCards')}
              </Button>

              {/* Third Button - POS */}
              <Button
                className="col-span-2 inline-flex w-auto items-center gap-2 justify-self-center rounded-full px-6 py-3 text-sm font-medium text-white shadow-sm sm:col-span-1"
                style={{
                  background:
                    'linear-gradient(90deg, #742CFF -9.53%, #1E1851 180.33%)',
                }}
              >
                <img
                  src="/characters/PosIcon.png"
                  className="h-5 w-5 object-contain"
                />
                {t('services.pos')}
              </Button>
            </div>
          </div>
          <div className="grid grid-rows-[auto_auto] items-center justify-center gap-4">
            <div className="h-[300px] sm:h-auto">
              <img
                src="/characters/HomeCartoon.png"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <Button
                href="/login"
                type="button"
                className="w-full items-center rounded-full px-2 py-1 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                style={{
                  background:
                    'linear-gradient(87.69deg, #1E1851 -9.53%, #4436B7 89.33%)',
                }}
              >
                {t('nav.login')}
              </Button>
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
      <div className="flex justify-center">
        <div className="flex lg:justify-items-center  lg:pb-4">
          <img
            src="/company/NumberOfPartner.png"
            className="h-[130px] w-[380px] object-contain lg:h-[130px] lg:w-[635px]"
          />
        </div>
      </div>

      <div className="flex justify-center lg:pt-3 lg:pb-0 pb-8">
        <span className="rounded-md bg-white px-5 py-3 text-base font-medium text-[#742CFF] shadow-lg">
          {t('services.ourServices')}
        </span>
      </div>

      <div className="mx-auto max-w-7xl px-1 sm:px-2 lg:px-4">
        {/* ✅ First Grid (Existing Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_400px]">
          <div className="order-1 flex items-center justify-center lg:order-2">
            <img
              src="/characters/pos.PNG"
              className="h-auto w-[200px] object-contain lg:w-[350px]"
            />
          </div>

          <div className="order-2 grid grid-rows-[auto_auto_auto] lg:justify-start lg:items-start items-center justify-center lg:order-1">
            <div className="my-2 flex flex-col lg:items-start items-center px-4 text-[#1E1851] lg:my-16 pt-6">
              {/* Heading */}
              <h2 className="mb-2 text-center text-base font-bold text-[#6B3FC4] lg:text-xl">
                {t('services.pos')}
              </h2>
              {/* Subheading */}
              <p className="mb-6 max-w-xl lg:text-start text-center text-sm lg:text-lg">
                {t('services.posDescription')}
              </p>

              {/* Features List */}
              <div className="mb-8 flex flex-col justify-items-center gap-6">
                <div className="flex items-center gap-4">
                  <img
                    src="/characters/PosOne.png"
                    alt=""
                    className="h-7 w-7 lg:h-10 lg:w-10"
                  />
                  <span className="text-sm font-medium lg:text-lg">
                    {t('services.transparentComparison')}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <img
                    src="/characters/PosTwo.png"
                    alt=""
                    className="h-7 w-7 lg:h-10 lg:w-10"
                  />
                  <span className="text-sm font-medium lg:text-lg">
                    {t('services.saveTime')}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <img
                    src="/characters/PosThree.png"
                    alt=""
                    className="h-7 w-7 lg:h-10 lg:w-10"
                  />
                  <span className="text-sm font-medium lg:text-lg">
                    {t('services.directCommunication')}
                  </span>
                </div>
              </div>

              {/* Apply Now Button */}
              <Button
                href="https://nesbah.com.sa/register"
                type="button"
                className="rounded-full px-12 py-6 text-sm font-normal text-white shadow-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                style={{
                  background:
                    'linear-gradient(87.69deg, #1E1851 -9.53%, #4436B7 89.33%)',
                }}
              >
                {t('services.comparePOS')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SecondBentoSection() {
  const { t } = useLanguage()
  
  return (
    <div className="relative py-16 sm:py-16">
      <div className="mx-auto max-w-7xl px-1 sm:px-2 lg:px-4">
        {/* ✅ First Section - Credit Card */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[400px_auto]">
          {/* 🖼️ Column 2 - Image */}
          <div className="order-2 flex justify-center items-center lg:items-start lg:justify-start lg:order-1">
            <img
              src="/characters/creditcardHomepage.png"
              className="h-auto w-[200px] object-contain lg:w-[400px]"
              alt="Credit Card"
            />
          </div>
          {/* 📝 Column 1 - Text */}
          <div className="order-2 grid grid-rows-[auto_auto_auto] items-center justify-center lg:order-1 lg:pl-12">
            <div className="flex flex-col lg:items-start items-center px-4 text-[#1E1851] lg:my-16">
              <h2 className="mb-2 text-center text-base font-bold text-[#6B3FC4] lg:text-xl">
                {t('services.compareCreditCards')}
              </h2>
              <p className="mb-6 max-w-xl text-start text-sm lg:text-lg">
                {t('services.creditCardDescription')}
              </p>
              <div className="mb-8 flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <img
                    src="/characters/CreditcardOne.png"
                    alt=""
                    className="h-10 w-10"
                  />
                  <span className="text-sm font-medium lg:text-lg">
                    {t('services.personalizedRecommendations')}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <img
                    src="/characters/CreditcardTwo.png"
                    alt=""
                    className="h-10 w-10"
                  />
                  <span className="text-sm font-medium lg:text-lg">
                    {t('services.clearComparison')}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <img
                    src="/characters/CreditcardThree.png"
                    alt=""
                    className="h-10 w-10"
                  />
                  <span className="text-sm font-medium lg:text-lg">
                    {t('services.easyApplication')}
                  </span>
                </div>
              </div>
              <Button
                href="https://nesbah.com.sa/register"
                type="button"
                className="rounded-full px-12 py-3 text-sm font-normal text-white shadow-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                style={{
                  background:
                    'linear-gradient(87.69deg, #1E1851 -9.53%, #4436B7 89.33%)',
                }}
              >
                {t('services.applyEasily')}
              </Button>
            </div>
          </div>
        </div>

        {/* ✅ Second Section - Personal Loans */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-[auto_400px]">
          <div className="order-2 grid grid-rows-[auto_auto_auto] lg:justify-items-start justify-items-center pl-0 lg:order-2">
            <div className="my-2 flex flex-col lg:items-start items-center px-4 text-[#1E1851] lg:my-16">
              <h2 className="mb-2 text-center text-base font-bold text-[#6B3FC4] lg:text-xl">
                {t('services.comparePersonalLoans')}
              </h2>
              <p className="mb-6 max-w-xl lg:text-start text-center text-sm lg:text-lg">
                {t('services.personalLoanDescription')}
              </p>
              <div className="mb-8 flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <img
                    src="/characters/PersonalloanOne.png"
                    alt=""
                    className="h-10 w-10"
                  />
                  <span className="text-sm font-medium lg:text-lg">
                    {t('services.customOffers')}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <img
                    src="/characters/PersonalloanTwo.png"
                    alt=""
                    className="h-10 w-10"
                  />
                  <span className="text-sm font-medium lg:text-lg">
                    {t('services.instantComparison')}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <img
                    src="/characters/PersonalloanThree.png"
                    alt=""
                    className="h-10 w-10"
                  />
                  <span className="text-sm font-medium lg:text-lg">
                    {t('services.applyEasily')}
                  </span>
                </div>
              </div>
              <Button
                href="https://nesbah.com.sa/register"
                type="button"
                className="rounded-full px-12 py-3 text-sm font-normal text-white shadow-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                style={{
                  background:
                    'linear-gradient(87.69deg, #1E1851 -9.53%, #4436B7 89.33%)',
                }}
              >
                {t('services.applyEasily')}
              </Button>
            </div>
          </div>
          <div className="order-1 flex items-center justify-center lg:order-2 pb-6">
            <img
              src="/characters/moneyHomepage.png"
              className="h-auto w-[200px] object-contain lg:w-[400px]"
              alt="Personal Loans"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function CalculatorHome() {
  const { t } = useLanguage()
  
  return (
    <div className="overflow-hidden py-6 sm:py-10">
      <div className="mx-auto max-w-7xl md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:grid-cols-2 lg:items-start">
          <div className="px-6 lg:px-0 lg:pr-4 lg:pt-4">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-lg">
              <h2 className="text-base/7 font-semibold text-indigo-600">
                {t('calculator.title')}
              </h2>
              <p className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                {t('calculator.discoverTitle')}
              </p>
              <p className="mt-6 text-lg/8 text-gray-600">
                {t('calculator.description')}
              </p>
              <div className="mt-10 flex items-start justify-start gap-x-3">
                <p className="text-xs font-medium text-purple-800 md:text-sm">
                  {t('calculator.marketStatus')}
                </p>
                <span className="inline-flex items-center gap-x-1.5 rounded-md bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                  <svg
                    viewBox="0 0 6 6"
                    aria-hidden="true"
                    className="size-1.5 fill-yellow-500"
                  >
                    <circle r={3} cx={3} cy={3} />
                  </svg>
                  {t('calculator.marketStatusValue')}
                </span>
              </div>
              <dl className="mt-10 max-w-xl space-y-8 text-base/7 text-gray-600 lg:max-w-none">
                <div className="relative pr-9">
                  <dt className="inline font-semibold text-gray-900">
                    <CalculatorIcon
                      aria-hidden="true"
                      className="absolute right-1 top-1 size-5 text-indigo-600"
                    />
                  </dt>{' '}
                  <dd className="inline">
                    {t('calculator.feature1')}
                  </dd>
                </div>
                <div className="relative pr-9">
                  <dt className="inline font-semibold text-gray-900">
                    <BanknotesIcon
                      aria-hidden="true"
                      className="absolute right-1 top-1 size-5 text-indigo-600"
                    />

                  </dt>{' '}
                  <dd className="inline">
                    {t('calculator.feature2')}
                  </dd>
                </div>
              </dl>
              <div className="pt-12">
                <Button
                  href="https://nesbah.com.sa/register"
                  type="button"
                  className="focus-visible-outline focus-visible-outline-2 focus-visible-outline-offset-2 focus-visible-outline-indigo-600 w-full items-center rounded-full pt-2 text-sm font-semibold text-white shadow-sm"
                  style={{
                    background:
                      'linear-gradient(87.69deg, #1E1851 -9.53%, #4436B7 89.33%)',
                  }}
                >
                  {t('calculator.calculateNow')}
                </Button>
              </div>
            </div>
          </div>
          <div className="sm:px-6 lg:px-0">
            <div className="relative isolate overflow-hidden bg-indigo-500 px-6 pt-8 sm:mx-auto sm:max-w-2xl sm:rounded-3xl sm:pl-16 sm:pr-0 sm:pt-16 lg:mx-0 lg:max-w-none">
              <div
                aria-hidden="true"
                className="absolute -inset-y-px -left-3 -z-10 w-full origin-bottom-left skew-x-[-30deg] bg-indigo-100 opacity-20 ring-1 ring-inset ring-white"
              />
              <div className="mx-auto max-w-2xl sm:mx-0 sm:max-w-none">
                <img
                  alt="Product screenshot"
                  src="/screenshots/asucok.png"
                  width={2432}
                  height={1442}
                  className="-mb-12 w-[57rem] max-w-none rounded-tl-xl bg-gray-800 ring-1 ring-white/10"
                />
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10 sm:rounded-3xl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Newsletter() {
  const { t } = useLanguage()
  
  return (
    <div className=" py-16 sm:py-24">
      <div className="mx-auto max-w-7xl sm:px-3 lg:px-5">
        <div className="relative isolate flex flex-col gap-10 overflow-hidden bg-gray-900 px-6 py-24 shadow-2xl sm:rounded-3xl sm:px-24 xl:flex-row xl:items-center xl:py-32">
          <h2 className="max-w-xl text-balance tracking-wide text-3xl font-semibold text-white sm:text-4xl xl:flex-auto">
            {t('newsletter.title')}
          </h2>
          <form className="w-full max-w-md">
            <div className="flex gap-x-4">
              <label htmlFor="email-address" className="sr-only">
                {t('newsletter.emailLabel')}
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                placeholder={t('newsletter.emailPlaceholder')}
                autoComplete="email"
                className="min-w-0 flex-auto rounded-md bg-white/5 px-3.5 py-2 text-base text-white outline outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-white sm:text-sm/6"
              />
              <button
                type="submit"
                className="flex-none rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {t('newsletter.subscribeButton')}
              </button>
            </div>
            <p className="mt-4 text-sm/6 text-gray-300">
              {t('newsletter.privacyText')}{' '}
              <a href="#" className="font-semibold text-white">
                {t('newsletter.privacyLink')}
              </a>
              .
            </p>
          </form>
          <svg
            viewBox="0 0 1024 1024"
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 -z-10 size-[64rem] -translate-x-1/2"
          >
            <circle r={512} cx={512} cy={512} fill="url(#759c1415-0410-454c-8f7c-9a820de03641)" fillOpacity="0.7" />
            <defs>
              <radialGradient
                r={1}
                cx={0}
                cy={0}
                id="759c1415-0410-454c-8f7c-9a820de03641"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(512 512) rotate(90) scale(512)"
              >
                <stop stopColor="#742CFF" />
                <stop offset={1} stopColor="#461A99" stopOpacity={0} />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  )
}

function FAQ () {
  const { t } = useLanguage()

  const faqs = [
    {
      question: t('faq.question1'),
      answer: t('faq.answer1'),
    },
    {
      question: t('faq.question2'),
      answer: t('faq.answer2'),
    },
    {
      question: t('faq.question3'),
      answer: t('faq.answer3'),
    },
    {
      question: t('faq.question4'),
      answer: t('faq.answer4'),
    },
    {
      question: t('faq.question5'),
      answer: t('faq.answer5'),
    },
    {
      question: t('faq.question6'),
      answer: t('faq.answer6'),
    },
    {
      question: t('faq.question7'),
      answer: t('faq.answer7'),
    },
    {
      question: t('faq.question8'),
      answer: t('faq.answer8'),
    },
  ]

  return (
    <div className="">
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-pretty text-2xl font-semibold tracking-tight bg-gradient-to-r from-[#6250f2] via-[#4436B7] to-[#281B66] bg-clip-text text-transparent lg:text-4xl">
            {t('faq.title')}
          </h2>
          <dl className="mt-16 grid gap-x-8 gap-y-10 sm:grid-cols-1 lg:grid-cols-2">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <Disclosure as="div" className="space-y-2">
                  <dt>
                    <DisclosureButton className="group flex w-full items-center justify-between text-left text-gray-900">
                      <span className="text-start text-base font-semibold leading-7">{faq.question}</span>
                      <span className="ml-2 flex h-7 items-center">
              <PlusSmallIcon aria-hidden="true" className="size-6 group-data-[open]:hidden" />
              <MinusSmallIcon aria-hidden="true" className="size-6 group-[&:not([data-open])]:hidden" />
            </span>
                    </DisclosureButton>
                  </dt>
                  <DisclosurePanel as="dd" className="pl-2">
                    <p className="text-base leading-7 text-gray-600">{faq.answer}</p>
                  </DisclosurePanel>
                </Disclosure>
              </div>
            ))}
          </dl>


        </div>
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
          <SecondBentoSection />
          <CalculatorHome />
          <FAQ />
          <Newsletter />
        </div>
      </main>
      <NewFooter />
    </div>
  )
}
