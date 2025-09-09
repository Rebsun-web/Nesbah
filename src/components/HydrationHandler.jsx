'use client'

import { useEffect } from 'react'

export default function HydrationHandler() {
  useEffect(() => {
    // Add hydrated class after component mounts (client-side only)
    const addHydratedClass = () => {
      if (typeof document !== 'undefined') {
        document.body.classList.add('hydrated')
        console.log('✅ HydrationHandler: Added hydrated class to body')
      }
    }

    // Add the class immediately
    addHydratedClass()

    // Also add it after a small delay to ensure it works even if there are timing issues
    const timeoutId = setTimeout(addHydratedClass, 100)

    // Cleanup timeout on unmount
    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  // This component doesn't render anything visible
  return null
}
