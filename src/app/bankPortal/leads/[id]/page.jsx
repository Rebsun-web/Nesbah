'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BankPortalLeadPage({ params }) {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated as bank user
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      router.push('/login')
      return
    }

    try {
      const user = JSON.parse(storedUser)
      if (user.user_type !== 'bank_user') {
        router.push('/login')
        return
      }

      // Redirect to the main leads page with the same ID
      router.push(`/leads/${params.id}`)
    } catch (error) {
      console.error('Error parsing user data:', error)
      router.push('/login')
    }
  }, [params.id, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to lead details...</p>
      </div>
    </div>
  )
}
