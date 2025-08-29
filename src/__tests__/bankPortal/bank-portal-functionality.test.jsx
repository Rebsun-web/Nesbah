import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockUsers, mockApplications, mockOffers } from '../utils/test-utils'

// Mock the bank portal page component
const MockBankPortal = ({ user = mockUsers.bankUser }) => {
  const [applications, setApplications] = React.useState(Object.values(mockApplications))
  const [offers, setOffers] = React.useState(mockOffers)
  const [selectedApplication, setSelectedApplication] = React.useState(null)
  const [analytics, setAnalytics] = React.useState({
    totalApplications: applications.length,
    liveAuctionApplications: applications.filter(app => app.status === 'live_auction').length,
    completedApplications: applications.filter(app => app.status === 'completed').length,
    ignoredApplications: applications.filter(app => app.status === 'ignored').length
  })

  const handleApplicationReview = (appId, decision, notes) => {
    setApplications(prev => 
      prev.map(app => 
        app.id === appId ? { 
          ...app, 
          status: decision, 
          reviewedAt: new Date().toISOString(),
          notes: notes
        } : app
      )
    )
    
    // Update analytics
    setAnalytics(prev => ({
      ...prev,
      [decision + 'Applications']: prev[decision + 'Applications'] + 1,
      liveAuctionApplications: prev.liveAuctionApplications - 1
    }))
  }

  const handleOfferUpdate = (offerId, updates) => {
    setOffers(prev => 
      prev.map(offer => 
        offer.id === offerId ? { ...offer, ...updates } : offer
      )
    )
  }

  const handleBulkAction = (action, selectedIds) => {
    switch (action) {
      case 'approve':
        setApplications(prev => 
          prev.map(app => 
            selectedIds.includes(app.id) ? { ...app, status: 'completed' } : app
          )
        )
        break
      case 'reject':
        setApplications(prev => 
          prev.map(app => 
            selectedIds.includes(app.id) ? { ...app, status: 'ignored' } : app
          )
        )
        break
      default:
        break
    }
  }

  return (
    <div data-testid="bank-portal">
      <header data-testid="bank-portal-header">
        <h1>Bank Portal - {user.name}</h1>
        <div data-testid="bank-role">Role: {user.role}</div>
      </header>

      <section data-testid="analytics-dashboard">
        <h2>Analytics Dashboard</h2>
        <div data-testid="analytics-grid">
          <div data-testid="total-applications" className="analytics-card">
            <h3>Total Applications</h3>
            <p>{analytics.totalApplications}</p>
          </div>
          <div data-testid="live-auction-applications" className="analytics-card">
            <h3>Live Auction</h3>
            <p>{analytics.liveAuctionApplications}</p>
          </div>
          <div data-testid="completed-applications" className="analytics-card">
            <h3>Completed</h3>
            <p>{analytics.completedApplications}</p>
          </div>
          <div data-testid="ignored-applications" className="analytics-card">
            <h3>Ignored</h3>
            <p>{analytics.ignoredApplications}</p>
          </div>
        </div>
      </section>

      <section data-testid="applications-management">
        <h2>Applications Management</h2>
        <div data-testid="bulk-actions">
          <button 
            data-testid="bulk-approve-btn"
            onClick={() => handleBulkAction('approve', [1, 2])}
          >
            Bulk Approve
          </button>
          <button 
            data-testid="bulk-reject-btn"
            onClick={() => handleBulkAction('reject', [1, 2])}
          >
            Bulk Reject
          </button>
        </div>
        
        <div data-testid="applications-list">
          {applications.map(app => (
            <div key={app.id} data-testid={`application-${app.id}`} className="application-card">
              <h3>{app.type}</h3>
              <p>Status: <span data-testid={`status-${app.id}`}>{app.status}</span></p>
              <p>Created: {new Date(app.createdAt).toLocaleDateString()}</p>
              {app.notes && <p>Notes: {app.notes}</p>}
              
              {app.status === 'live_auction' && (
                <div data-testid={`review-controls-${app.id}`}>
                  <button 
                    data-testid={`approve-${app.id}`}
                    onClick={() => handleApplicationReview(app.id, 'approved', 'Approved by bank')}
                  >
                    Approve
                  </button>
                  <button 
                    data-testid={`reject-${app.id}`}
                    onClick={() => handleApplicationReview(app.id, 'rejected', 'Rejected by bank')}
                  >
                    Reject
                  </button>
                  <textarea 
                    data-testid={`notes-${app.id}`}
                    placeholder="Add review notes..."
                    defaultValue=""
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section data-testid="offers-management">
        <h2>Offers Management</h2>
        <div data-testid="offers-list">
          {offers.map(offer => (
            <div key={offer.id} data-testid={`offer-${offer.id}`} className="offer-card">
              <h3>{offer.title}</h3>
              <p>{offer.description}</p>
              <p>Bank: {offer.bank}</p>
              <p>Rate: {offer.rate}</p>
              <button 
                data-testid={`edit-offer-${offer.id}`}
                onClick={() => setSelectedApplication(offer)}
              >
                Edit Offer
              </button>
            </div>
          ))}
        </div>
      </section>

      <section data-testid="reports-section">
        <h2>Reports & Analytics</h2>
        <button data-testid="export-applications-btn">Export Applications</button>
        <button data-testid="generate-report-btn">Generate Report</button>
        <button data-testid="view-trends-btn">View Trends</button>
      </section>
    </div>
  )
}

describe('Bank Portal Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  describe('4. Bank Portal All Functionality', () => {
    test('should display bank portal header with user information', () => {
      renderWithProviders(<MockBankPortal />)
      
      expect(screen.getByTestId('bank-portal-header')).toBeInTheDocument()
      expect(screen.getByText(`Bank Portal - ${mockUsers.bankUser.name}`)).toBeInTheDocument()
      expect(screen.getByText(`Role: ${mockUsers.bankUser.role}`)).toBeInTheDocument()
    })

    test('should display analytics dashboard with correct counts', () => {
      renderWithProviders(<MockBankPortal />)
      
      expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument()
      expect(screen.getByTestId('analytics-grid')).toBeInTheDocument()
      
      // Check analytics cards
      expect(screen.getByTestId('total-applications')).toBeInTheDocument()
      expect(screen.getByTestId('pending-applications')).toBeInTheDocument()
      expect(screen.getByTestId('approved-applications')).toBeInTheDocument()
      expect(screen.getByTestId('rejected-applications')).toBeInTheDocument()
      
      // Check initial counts
      expect(screen.getByTestId('total-applications')).toHaveTextContent('3')
      expect(screen.getByTestId('pending-applications')).toHaveTextContent('1')
      expect(screen.getByTestId('approved-applications')).toHaveTextContent('1')
      expect(screen.getByTestId('rejected-applications')).toHaveTextContent('1')
    })

    test('should allow bank users to review pending applications', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<MockBankPortal />)
      
      // Find pending application
      const pendingApp = screen.getByTestId('application-1')
      expect(pendingApp).toHaveTextContent('pending')
      
      // Check if review controls are visible
      const reviewControls = screen.getByTestId('review-controls-1')
      expect(reviewControls).toBeInTheDocument()
      
      // Approve the application
      const approveButton = screen.getByTestId('approve-1')
      await user.click(approveButton)
      
      // Check if status was updated
      expect(screen.getByTestId('status-1')).toHaveTextContent('approved')
      
      // Check if analytics were updated
      expect(screen.getByTestId('pending-applications')).toHaveTextContent('0')
      expect(screen.getByTestId('approved-applications')).toHaveTextContent('2')
    })

    test('should allow bank users to reject applications with notes', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<MockBankPortal />)
      
      // Find pending application
      const pendingApp = screen.getByTestId('application-1')
      expect(pendingApp).toHaveTextContent('pending')
      
      // Add notes and reject
      const notesTextarea = screen.getByTestId('notes-1')
      await user.type(notesTextarea, 'Insufficient credit history')
      
      const rejectButton = screen.getByTestId('reject-1')
      await user.click(rejectButton)
      
      // Check if status was updated
      expect(screen.getByTestId('status-1')).toHaveTextContent('ignored')
      
      // Check if notes were added
      expect(screen.getByText('Notes: Rejected by bank')).toBeInTheDocument()
    })

    test('should provide bulk action capabilities', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<MockBankPortal />)
      
      expect(screen.getByTestId('bulk-actions')).toBeInTheDocument()
      expect(screen.getByTestId('bulk-approve-btn')).toBeInTheDocument()
      expect(screen.getByTestId('bulk-reject-btn')).toBeInTheDocument()
      
      // Perform bulk approve
      const bulkApproveBtn = screen.getByTestId('bulk-approve-btn')
      await user.click(bulkApproveBtn)
      
      // Check if applications were updated
      expect(screen.getByTestId('status-1')).toHaveTextContent('completed')
      expect(screen.getByTestId('status-2')).toHaveTextContent('completed')
    })

    test('should manage offers correctly', () => {
      renderWithProviders(<MockBankPortal />)
      
      expect(screen.getByTestId('offers-management')).toBeInTheDocument()
      expect(screen.getByTestId('offers-list')).toBeInTheDocument()
      
      // Check if all offers are displayed
      mockOffers.forEach(offer => {
        expect(screen.getByTestId(`offer-${offer.id}`)).toBeInTheDocument()
        expect(screen.getByText(offer.title)).toBeInTheDocument()
        expect(screen.getByText(`Bank: ${offer.bank}`)).toBeInTheDocument()
        expect(screen.getByText(`Rate: ${offer.rate}`)).toBeInTheDocument()
      })
    })

    test('should provide reports and analytics features', () => {
      renderWithProviders(<MockBankPortal />)
      
      expect(screen.getByTestId('reports-section')).toBeInTheDocument()
      expect(screen.getByTestId('export-applications-btn')).toBeInTheDocument()
      expect(screen.getByTestId('generate-report-btn')).toBeInTheDocument()
      expect(screen.getByTestId('view-trends-btn')).toBeInTheDocument()
    })

    test('should handle application review workflow correctly', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<MockBankPortal />)
      
      // Initial state
      expect(screen.getByTestId('live-auction-applications')).toHaveTextContent('1')
      
      // Review and approve application
      const approveButton = screen.getByTestId('approve-1')
      await user.click(approveButton)
      
      // Check updated analytics
      expect(screen.getByTestId('live-auction-applications')).toHaveTextContent('0')
      expect(screen.getByTestId('completed-applications')).toHaveTextContent('2')
      
      // Check if review controls are hidden for approved application
      expect(screen.queryByTestId('review-controls-1')).not.toBeInTheDocument()
    })

    test('should maintain application history and audit trail', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<MockBankPortal />)
      
      // Approve application
      const approveButton = screen.getByTestId('approve-1')
      await user.click(approveButton)
      
      // Check if review information is preserved
      const approvedApp = screen.getByTestId('application-1')
      expect(approvedApp).toHaveTextContent('Notes: Approved by bank')
    })

    test('should handle edge cases gracefully', () => {
      const MockEmptyBankPortal = () => (
        <div data-testid="bank-portal">
          <section data-testid="analytics-dashboard">
            <h2>Analytics Dashboard</h2>
            <div data-testid="analytics-grid">
              <div data-testid="total-applications" className="analytics-card">
                <h3>Total Applications</h3>
                <p>0</p>
              </div>
              <div data-testid="live-auction-applications" className="analytics-card">
                <h3>Live Auction</h3>
                <p>0</p>
              </div>
            </div>
          </section>
          <section data-testid="applications-management">
            <h2>Applications Management</h2>
            <div data-testid="applications-list">
              {[]}
            </div>
            <p data-testid="no-applications">No applications to review</p>
          </section>
        </div>
      )
      
      renderWithProviders(<MockEmptyBankPortal />)
      
      expect(screen.getByTestId('no-applications')).toBeInTheDocument()
      expect(screen.getByTestId('total-applications')).toHaveTextContent('0')
      expect(screen.getByTestId('live-auction-applications')).toHaveTextContent('0')
    })
  })

  describe('Bank Portal Data Management', () => {
    test('should update analytics in real-time when applications are reviewed', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<MockBankPortal />)
      
      // Initial analytics
      expect(screen.getByTestId('live-auction-applications')).toHaveTextContent('1')
      expect(screen.getByTestId('completed-applications')).toHaveTextContent('1')
      
      // Review application
      const approveButton = screen.getByTestId('approve-1')
      await user.click(approveButton)
      
      // Check updated analytics
      expect(screen.getByTestId('live-auction-applications')).toHaveTextContent('0')
      expect(screen.getByTestId('completed-applications')).toHaveTextContent('2')
    })

    test('should maintain data consistency across different operations', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<MockBankPortal />)
      
      // Initial state
      const initialPending = screen.getByTestId('live-auction-applications').textContent
      const initialApproved = screen.getByTestId('completed-applications').textContent
      
      // Perform multiple operations
      const approveButton = screen.getByTestId('approve-1')
      await user.click(approveButton)
      
      // Check consistency
      const newPending = screen.getByTestId('live-auction-applications').textContent
      const newApproved = screen.getByTestId('completed-applications').textContent
      
      expect(parseInt(newPending)).toBe(parseInt(initialPending) - 1)
      expect(parseInt(newApproved)).toBe(parseInt(initialApproved) + 1)
    })
  })

  describe('Bank Portal User Experience', () => {
    test('should provide clear visual feedback for application statuses', () => {
      renderWithProviders(<MockBankPortal />)
      
      // Check different status displays
      expect(screen.getByTestId('status-1')).toHaveTextContent('live_auction')
      expect(screen.getByTestId('status-2')).toHaveTextContent('completed')
      expect(screen.getByTestId('status-3')).toHaveTextContent('ignored')
    })

    test('should show appropriate controls based on application status', () => {
      renderWithProviders(<MockBankPortal />)
      
      // Live auction application should have review controls
      expect(screen.getByTestId('review-controls-1')).toBeInTheDocument()
      
      // Completed/ignored applications should not have review controls
      expect(screen.queryByTestId('review-controls-2')).not.toBeInTheDocument()
      expect(screen.queryByTestId('review-controls-3')).not.toBeInTheDocument()
    })
  })
})
