'use client'

import { useState } from 'react'

export default function BankLogo({ 
    bankName, 
    logoUrl, 
    size = 'md', 
    className = '',
    showFallback = true 
}) {
    const [imageError, setImageError] = useState(false)
    
    // Size classes
    const sizeClasses = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
        xl: 'w-16 h-16 text-xl',
        '2xl': 'w-20 h-20 text-2xl'
    }
    
    // Generate fallback logo
    const generateFallbackLogo = (name) => {
        if (!name) return null
        
        // Get first letter of bank name
        const firstLetter = name.charAt(0).toUpperCase()
        
        // Generate consistent color based on bank name
        const colors = [
            'bg-blue-500',
            'bg-green-500', 
            'bg-purple-500',
            'bg-red-500',
            'bg-yellow-500',
            'bg-indigo-500',
            'bg-pink-500',
            'bg-teal-500',
            'bg-orange-500',
            'bg-cyan-500'
        ]
        
        const colorIndex = name.charCodeAt(0) % colors.length
        const bgColor = colors[colorIndex]
        
        return (
            <div className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-bold ${className}`}>
                {firstLetter}
            </div>
        )
    }
    
    // If no logo URL or image failed to load, show fallback
    if (!logoUrl || imageError || !showFallback) {
        return generateFallbackLogo(bankName)
    }
    
    // Show actual logo
    return (
        <img
            src={logoUrl}
            alt={`${bankName} logo`}
            className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
            onError={() => setImageError(true)}
        />
    )
}
