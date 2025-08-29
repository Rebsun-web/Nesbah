import React from 'react'
import { render } from '@testing-library/react'
import { LanguageProvider } from '../../contexts/LanguageContext'

// Mock data for testing
export const mockUsers = {
  admin: {
    id: 1,
    email: 'admin@nesbah.com',
    role: 'admin',
    name: 'Admin User',
    permissions: ['read', 'write', 'delete', 'manage_users']
  },
  bankUser: {
    id: 2,
    email: 'bank@nesbah.com',
    role: 'bank',
    name: 'Bank User',
    permissions: ['read', 'write']
  },
  portalUser: {
    id: 3,
    email: 'user@nesbah.com',
    role: 'user',
    name: 'Portal User',
    permissions: ['read']
  }
}

export const mockApplications = {
  pending: {
    id: 1,
    status: 'pending',
    type: 'credit_card',
    userId: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  approved: {
    id: 2,
    status: 'approved',
    type: 'personal_loan',
    userId: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  rejected: {
    id: 3,
    status: 'rejected',
    type: 'pos',
    userId: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
}

export const mockOffers = [
  {
    id: 1,
    title: 'Credit Card Offer',
    description: 'Best credit card rates',
    type: 'credit_card',
    bank: 'Bank A',
    rate: '15.99%',
    annualFee: '$0'
  },
  {
    id: 2,
    title: 'Personal Loan Offer',
    description: 'Low interest personal loan',
    type: 'personal_loan',
    bank: 'Bank B',
    rate: '8.99%',
    term: '36 months'
  }
]

// Custom render function that includes providers
export function renderWithProviders(ui, options = {}) {
  const Wrapper = ({ children }) => (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  )

  return render(ui, { wrapper: Wrapper, ...options })
}

// Mock authentication context
export const mockAuthContext = {
  user: null,
  login: jest.fn(),
  logout: jest.fn(),
  isLoading: false,
  isAuthenticated: false
}

// Mock API responses
export const mockApiResponses = {
  login: {
    success: {
      success: true,
      token: 'mock-jwt-token',
      user: mockUsers.portalUser
    },
    failure: {
      success: false,
      message: 'Invalid credentials'
    }
  },
  applications: {
    list: {
      success: true,
      data: Object.values(mockApplications)
    },
    create: {
      success: true,
      data: mockApplications.pending
    },
    update: {
      success: true,
      data: { ...mockApplications.pending, status: 'approved' }
    }
  }
}

// Helper functions for testing
export const waitForElementToBeRemoved = (element) => {
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        observer.disconnect()
        resolve()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
  })
}

export const createMockFile = (name, size, type) => {
  const file = new File(['mock content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}
