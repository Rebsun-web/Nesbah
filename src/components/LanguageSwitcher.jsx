'use client'

import { useLanguage, LANGUAGES } from '@/contexts/LanguageContext'

export default function LanguageSwitcher({ className = '', variant = 'default' }) {
  const { currentLanguage, changeLanguage, t } = useLanguage()

  const handleLanguageChange = (language) => {
    changeLanguage(language)
  }

  // Different variants for different use cases
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center ${className}`}>
        <button
          onClick={() => handleLanguageChange(LANGUAGES.AR)}
          className={`px-2 py-1 text-sm font-medium rounded-l-md transition-colors ${
            currentLanguage === LANGUAGES.AR
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          AR
        </button>
        <div className="w-px h-4 bg-gray-300"></div>
        <button
          onClick={() => handleLanguageChange(LANGUAGES.EN)}
          className={`px-2 py-1 text-sm font-medium rounded-r-md transition-colors ${
            currentLanguage === LANGUAGES.EN
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          EN
        </button>
      </div>
    )
  }

  if (variant === 'button') {
    return (
      <div className={`flex items-center ${className}`}>
        <button
          onClick={() => handleLanguageChange(LANGUAGES.AR)}
          className={`px-3 py-2 text-sm font-medium rounded-l-md transition-colors ${
            currentLanguage === LANGUAGES.AR
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          AR
        </button>
        <div className="w-px h-6 bg-gray-300"></div>
        <button
          onClick={() => handleLanguageChange(LANGUAGES.EN)}
          className={`px-3 py-2 text-sm font-medium rounded-r-md transition-colors ${
            currentLanguage === LANGUAGES.EN
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          EN
        </button>
      </div>
    )
  }

  // Default variant
  return (
    <div className={`flex items-center ${className}`}>
      <button
        onClick={() => handleLanguageChange(LANGUAGES.AR)}
        className={`px-3 py-2 text-sm font-medium rounded-l-md transition-colors border ${
          currentLanguage === LANGUAGES.AR
            ? 'bg-purple-600 text-white border-purple-600'
            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
        }`}
      >
        AR
      </button>
      <div className="w-px h-6 bg-gray-300"></div>
      <button
        onClick={() => handleLanguageChange(LANGUAGES.EN)}
        className={`px-3 py-2 text-sm font-medium rounded-r-md transition-colors border ${
          currentLanguage === LANGUAGES.EN
            ? 'bg-purple-600 text-white border-purple-600'
            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
        }`}
      >
        EN
      </button>
    </div>
  )
}
