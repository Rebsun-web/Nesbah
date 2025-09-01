'use client'

import { createContext, useContext, useState, useEffect, useMemo } from 'react'

// Language context
const LanguageContext = createContext()

// Available languages
export const LANGUAGES = {
  AR: 'ar',
  EN: 'en'
}

// Default language
const DEFAULT_LANGUAGE = LANGUAGES.AR

// Language direction mapping
export const LANGUAGE_DIRECTIONS = {
  [LANGUAGES.AR]: 'rtl',
  [LANGUAGES.EN]: 'ltr'
}

// Lazy load translations
const loadTranslations = async (language) => {
  try {
    const translationModule = await import(`@/translations/${language}.js`)
    return translationModule.default || translationModule
  } catch (error) {
    console.warn(`Failed to load translations for ${language}:`, error)
    // Fallback to basic translations
    return {
      'common.loading': language === 'ar' ? 'جاري التحميل...' : 'Loading...',
      'common.error': language === 'ar' ? 'خطأ' : 'Error',
      'common.success': language === 'ar' ? 'نجح' : 'Success',
    }
  }
}

export function LanguageProvider({ children }) {
  // Initialize with the same defaults as the server to prevent hydration mismatch
  const [currentLanguage, setCurrentLanguage] = useState(DEFAULT_LANGUAGE)
  const [direction, setDirection] = useState(LANGUAGE_DIRECTIONS[DEFAULT_LANGUAGE])
  const [translations, setTranslations] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize language immediately on mount
  useEffect(() => {
    setMounted(true)
    
    // Get the correct language from localStorage or use default
    const savedLanguage = localStorage.getItem('language')
    const initialLanguage = savedLanguage && Object.values(LANGUAGES).includes(savedLanguage) 
      ? savedLanguage 
      : DEFAULT_LANGUAGE
    
    // Only update if different from default to prevent hydration mismatch
    if (initialLanguage !== DEFAULT_LANGUAGE) {
      setCurrentLanguage(initialLanguage)
      setDirection(LANGUAGE_DIRECTIONS[initialLanguage])
      
      // Update document attributes
      if (document.documentElement) {
        document.documentElement.lang = initialLanguage
        document.documentElement.dir = LANGUAGE_DIRECTIONS[initialLanguage]
      }
    }
    
    setIsInitialized(true)
  }, [])

  // Load translations when language changes
  useEffect(() => {
    if (!currentLanguage) return
    
    const loadLanguageTranslations = async () => {
      setIsLoading(true)
      try {
        const loadedTranslations = await loadTranslations(currentLanguage)
        setTranslations(loadedTranslations)
      } catch (error) {
        console.error('Error loading translations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLanguageTranslations()
  }, [currentLanguage])

  // Update document direction when language changes (only on client)
  useEffect(() => {
    if (mounted && direction && currentLanguage) {
      // Only update if different from current to prevent unnecessary changes
      if (document.documentElement.dir !== direction) {
        document.documentElement.dir = direction
      }
      if (document.documentElement.lang !== currentLanguage) {
        document.documentElement.lang = currentLanguage
      }
    }
  }, [direction, currentLanguage, mounted])

  // Change language function
  const changeLanguage = (newLanguage) => {
    if (Object.values(LANGUAGES).includes(newLanguage)) {
      setCurrentLanguage(newLanguage)
      setDirection(LANGUAGE_DIRECTIONS[newLanguage])
      if (mounted) {
        localStorage.setItem('language', newLanguage)
      }
    }
  }

  // Translation function - memoized for performance
  const t = useMemo(() => {
    return (key) => {
      if (isLoading) {
        // Return a simple fallback while loading
        return key.includes('.') ? key.split('.').pop() : key
      }
      return translations[key] || key
    }
  }, [translations, isLoading])

  // Get current language info
  const getCurrentLanguageInfo = () => {
    return {
      code: currentLanguage,
      direction,
      isRTL: direction === 'rtl',
      isLTR: direction === 'ltr'
    }
  }

  const value = {
    currentLanguage,
    direction,
    changeLanguage,
    t,
    getCurrentLanguageInfo,
    LANGUAGES,
    isLoading,
    mounted,
    isInitialized
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
