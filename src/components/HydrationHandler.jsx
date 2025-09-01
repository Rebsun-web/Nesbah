'use client'

import { useEffect } from 'react'

export default function HydrationHandler() {
  useEffect(() => {
    // Add hydrated class after component mounts (client-side only)
    document.body.classList.add('hydrated')
  }, [])

  // This component doesn't render anything visible
  return null
}
