'use client'

import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import { useEffect, useRef } from 'react'

export function AnimatedNumber({ start, end, decimals = 0 }) {
  let ref = useRef(null)
  let isInView = useInView(ref, { once: true, amount: 0.5 })

  // Enhanced data sanitization to handle various input types
  const sanitizeNumber = (value) => {
    if (value === null || value === undefined) return 0
    if (typeof value === 'number' && !isNaN(value)) return value
    if (typeof value === 'string') {
      // Remove any non-numeric characters except decimal point and minus sign
      const cleaned = value.replace(/[^\d.-]/g, '')
      const parsed = parseFloat(cleaned)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }

  const safeStart = sanitizeNumber(start)
  const safeEnd = sanitizeNumber(end)
  const safeDecimals = typeof decimals === 'number' && !isNaN(decimals) ? Math.max(0, Math.min(10, decimals)) : 0

  let value = useMotionValue(safeStart)
  let spring = useSpring(value, { damping: 30, stiffness: 100 })
  let display = useTransform(spring, (num) => {
    try {
      // Ensure num is a valid number
      const validNum = typeof num === 'number' && !isNaN(num) ? num : 0
      return validNum.toFixed(safeDecimals)
    } catch (error) {
      console.error('AnimatedNumber display error:', error, { num, safeDecimals })
      return '0'
    }
  })

  useEffect(() => {
    try {
      // Ensure values are within reasonable bounds
      const clampedStart = Math.max(-1000000, Math.min(1000000, safeStart))
      const clampedEnd = Math.max(-1000000, Math.min(1000000, safeEnd))
      value.set(isInView ? clampedEnd : clampedStart)
    } catch (error) {
      console.error('AnimatedNumber value set error:', error, { isInView, safeEnd, safeStart })
      // Fallback to safe values
      value.set(0)
    }
  }, [safeStart, safeEnd, isInView, value])

  // Add error boundary for the component
  try {
    return <motion.span ref={ref}>{display}</motion.span>
  } catch (error) {
    console.error('AnimatedNumber render error:', error)
    return <span>{safeEnd}</span>
  }
}

