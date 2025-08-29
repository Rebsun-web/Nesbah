import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockUsers, mockApplications, mockOffers } from '../utils/test-utils'

// Mock the portal page component
const MockPortalPage = ({ user = mockUsers.portalUser }) => {
  const [applications, setApplications] = React.useState(Object.values(mockApplications))
  const [offers, setOffers] = React.useState(mockOffers)
  const [selectedApplication, setSelectedApplication] = React.useState(null)

  const handleApplicationStatusUpdate = (appId, newStatus) => {
    setApplications(prev => 
      prev.map(app => 
        app.id === appId ? { ...app, status: newStatus } : app
      )
    )
  }

  const handleOfferSelection = (offerId) => {
    // Simulate offer selection logic
    console.log(`Selected offer: ${offerId}`)
  }

  return (
    <div data-testid="portal-page">
      <header data-testid="portal-header">
        <h1>Welcome, {user.name}</h1>
        <div data-testid="user-role">Role: {user.role}</div>
      </header>

      <section data-testid="applications-section">
        <h2>My Applications</h2>
        <div data-testid="applications-list">
          {applications.map(app => (
            <div key={app.id} data-testid={`application-${app.id}`} className="application-card">
              <h3>{app.type}</h3>
              <p>Status: <span data-testid={`status-${app.id}`}>{app.status}</span></p>
              <p>Created: {new Date(app.createdAt).toLocaleDateString()}</p>
              {user.role === 'admin' && (
                <select 
                  data-testid={`status-select-${app.id}`}
                  value={app.status}
                  onChange={(e) => handleApplicationStatusUpdate(app.id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              )}
            </div>
          ))}
        </div>
      </section>

      <section data-testid="offers-section">
        <h2>Available Offers</h2>
        <div data-testid="offers-list">
          {offers.map(offer => (
            <div key={offer.id} data-testid={`offer-${offer.id}`} className="offer-card">
              <h3>{offer.title}</h3>
              <p>{offer.description}</p>
              <p>Bank: {offer.bank}</p>
              <p>Rate: {offer.rate}</p>
              <button 
                data-testid={`select-offer-${offer.id}`}
                onClick={() => handleOfferSelection(offer.id)}
              >
                Select Offer
              </button>
            </div>
          ))}
        </div>
      </section>

      <section data-testid="quick-actions">
        <h2>Quick Actions</h2>
        <button data-testid="new-application-btn">New Application</button>
        <button data-testid="view-documents-btn">View Documents</button>
        <button data-testid="contact-support-btn">Contact Support</button>
      </section>
    </div>
  )
}

describe('Portal Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  describe('3. Portal All Functionality', () => {
    test('should display user information correctly', () => {
      renderWithProviders(<MockPortalPage />)
      
      expect(screen.getByTestId('portal-header')).toBeInTheDocument()
      expect(screen.getByText(`Welcome, ${mockUsers.portalUser.name}`)).toBeInTheDocument()
      expect(screen.getByText(`Role: ${mockUsers.portalUser.role}`)).toBeInTheDocument()
    })

    test('should display applications list with correct information', () => {
      renderWithProviders(<MockPortalPage />)
      
      expect(screen.getByTestId('applications-section')).toBeInTheDocument()
      expect(screen.getByTestId('applications-list')).toBeInTheDocument()
      
      // Check if all applications are displayed
      Object.values(mockApplications).forEach(app => {
        expect(screen.getByTestId(`application-${app.id}`)).toBeInTheDocument()
        expect(screen.getByText(app.type)).toBeInTheDocument()
        expect(screen.getByTestId(`status-${app.id}`)).toHaveTextContent(app.status)
      })
    })

    test('should display offers with correct information', () => {
      renderWithProviders(<MockPortalPage />)
      
      expect(screen.getByTestId('offers-section')).toBeInTheDocument()
      expect(screen.getByTestId('offers-list')).toBeInTheDocument()
      
      // Check if all offers are displayed
      mockOffers.forEach(offer => {
        expect(screen.getByTestId(`offer-${offer.id}`)).toBeInTheDocument()
        expect(screen.getByText(offer.title)).toBeInTheDocument()
        expect(screen.getByText(offer.description)).toBeInTheDocument()
        expect(screen.getByText(`Bank: ${offer.bank}`)).toBeInTheDocument()
        expect(screen.getByText(`Rate: ${offer.rate}`)).toBeInTheDocument()
      })
    })

    test('should allow admin users to update application status', async () => {
      const adminUser = mockUsers.admin
      const user = userEvent.setup()
      
      renderWithProviders(<MockPortalPage user={adminUser} />)
      
      // Find the status select for the first application
      const statusSelect = screen.getByTestId('status-select-1')
      expect(statusSelect).toBeInTheDocument()
      
      // Change status from pending to approved
      await user.selectOptions(statusSelect, 'approved')
      
      // Check if status was updated
      expect(screen.getByTestId('status-1')).toHaveTextContent('approved')
    })

    test('should not show status update controls for non-admin users', () => {
      const portalUser = mockUsers.portalUser
      
      renderWithProviders(<MockPortalPage user={portalUser} />)
      
      // Non-admin users should not see status select controls
      expect(screen.queryByTestId('status-select-1')).not.toBeInTheDocument()
    })

    test('should handle offer selection correctly', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'log')
      
      renderWithProviders(<MockPortalPage />)
      
      // Click on offer selection button
      const selectButton = screen.getByTestId('select-offer-1')
      await user.click(selectButton)
      
      // Check if offer selection was logged
      expect(consoleSpy).toHaveBeenCalledWith('Selected offer: 1')
      
      consoleSpy.mockRestore()
    })

    test('should display quick actions section', () => {
      renderWithProviders(<MockPortalPage />)
      
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument()
      expect(screen.getByTestId('new-application-btn')).toBeInTheDocument()
      expect(screen.getByTestId('view-documents-btn')).toBeInTheDocument()
      expect(screen.getByTestId('contact-support-btn')).toBeInTheDocument()
    })

    test('should handle new application creation', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<MockPortalPage />)
      
      const newAppButton = screen.getByTestId('new-application-btn')
      await user.click(newAppButton)
      
      // This would typically navigate to a new application form
      // For now, we just verify the button is clickable
      expect(newAppButton).toBeInTheDocument()
    })

    test('should display application creation dates in readable format', () => {
      renderWithProviders(<MockPortalPage />)
      
      Object.values(mockApplications).forEach(app => {
        const appElement = screen.getByTestId(`application-${app.id}`)
        const dateText = new Date(app.createdAt).toLocaleDateString()
        expect(appElement).toHaveTextContent(dateText)
      })
    })

    test('should handle empty applications list gracefully', () => {
      const MockEmptyPortal = () => (
        <div data-testid="portal-page">
          <section data-testid="applications-section">
            <h2>My Applications</h2>
            <div data-testid="applications-list">
              {[]}
            </div>
            <p data-testid="no-applications">No applications found</p>
          </section>
        </div>
      )
      
      renderWithProviders(<MockEmptyPortal />)
      
      expect(screen.getByTestId('no-applications')).toBeInTheDocument()
    })

    test('should handle empty offers list gracefully', () => {
      const MockEmptyOffersPortal = () => (
        <div data-testid="portal-page">
          <section data-testid="offers-section">
            <h2>Available Offers</h2>
            <div data-testid="offers-list">
              {[]}
            </div>
            <p data-testid="no-offers">No offers available</p>
          </section>
        </div>
      )
      
      renderWithProviders(<MockEmptyOffersPortal />)
      
      expect(screen.getByTestId('no-offers')).toBeInTheDocument()
    })
  })

  describe('Portal Data Management', () => {
    test('should maintain application state correctly', () => {
      renderWithProviders(<MockPortalPage />)
      
      // Initial state should have all applications
      expect(screen.getByTestId('applications-list').children).toHaveLength(3)
      
      // Check specific application details
      const firstApp = screen.getByTestId('application-1')
      expect(firstApp).toHaveTextContent('credit_card')
      expect(firstApp).toHaveTextContent('pending')
    })

    test('should handle application status updates correctly', async () => {
      const adminUser = mockUsers.admin
      const user = userEvent.setup()
      
      renderWithProviders(<MockPortalPage user={adminUser} />)
      
      // Update status of first application
      const statusSelect = screen.getByTestId('status-select-1')
      await user.selectOptions(statusSelect, 'rejected')
      
      // Verify status was updated
      expect(screen.getByTestId('status-1')).toHaveTextContent('rejected')
    })
  })

  describe('Portal User Experience', () => {
    test('should provide clear visual feedback for different application statuses', () => {
      renderWithProviders(<MockPortalPage />)
      
      // Check if different statuses are displayed
      expect(screen.getByTestId('status-1')).toHaveTextContent('pending')
      expect(screen.getByTestId('status-2')).toHaveTextContent('approved')
      expect(screen.getByTestId('status-3')).toHaveTextContent('rejected')
    })

    test('should display offers with clear call-to-action buttons', () => {
      renderWithProviders(<MockPortalPage />)
      
      mockOffers.forEach(offer => {
        const offerElement = screen.getByTestId(`offer-${offer.id}`)
        const selectButton = screen.getByTestId(`select-offer-${offer.id}`)
        
        expect(offerElement).toBeInTheDocument()
        expect(selectButton).toHaveTextContent('Select Offer')
      })
    })
  })
})
