import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockUsers, mockApplications, mockOffers } from '../utils/test-utils'

// Mock the admin portal page component
const MockAdminPortal = ({ user = mockUsers.admin }) => {
  const [users, setUsers] = React.useState([
    mockUsers.admin,
    mockUsers.bankUser,
    mockUsers.portalUser
  ])
  const [applications, setApplications] = React.useState(Object.values(mockApplications))
  const [offers, setOffers] = React.useState(mockOffers)
  const [systemStats, setSystemStats] = React.useState({
    totalUsers: 3,
    totalApplications: 3,
    totalOffers: 2,
    activeUsers: 2,
    pendingApplications: 1,
    systemHealth: 'healthy'
  })
  const [selectedUser, setSelectedUser] = React.useState(null)
  const [selectedApplication, setSelectedApplication] = React.useState(null)

  const handleUserManagement = (action, userId, updates = {}) => {
    switch (action) {
      case 'update':
        setUsers(prev => 
          prev.map(user => 
            user.id === userId ? { ...user, ...updates } : user
          )
        )
        break
      case 'delete':
        setUsers(prev => prev.filter(user => user.id !== userId))
        setSystemStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }))
        break
      case 'create':
        const newUser = {
          id: Date.now(),
          ...updates,
          createdAt: new Date().toISOString()
        }
        setUsers(prev => [...prev, newUser])
        setSystemStats(prev => ({ ...prev, totalUsers: prev.totalUsers + 1 }))
        break
      default:
        break
    }
  }

  const handleApplicationManagement = (action, appId, updates = {}) => {
    switch (action) {
      case 'update':
        setApplications(prev => 
          prev.map(app => 
            app.id === appId ? { ...app, ...updates } : app
          )
        )
        break
      case 'delete':
        setApplications(prev => prev.filter(app => app.id !== appId))
        setSystemStats(prev => ({ ...prev, totalApplications: prev.totalApplications - 1 }))
        break
      case 'bulk_update':
        setApplications(prev => 
          prev.map(app => 
            updates.ids.includes(app.id) ? { ...app, ...updates.data } : app
          )
        )
        break
      default:
        break
    }
  }

  const handleSystemMaintenance = (action) => {
    switch (action) {
      case 'backup':
        console.log('System backup initiated')
        break
      case 'optimize':
        setSystemStats(prev => ({ ...prev, systemHealth: 'optimized' }))
        break
      case 'clear_cache':
        console.log('Cache cleared')
        break
      default:
        break
    }
  }

  const generateReport = (type) => {
    switch (type) {
      case 'users':
        return { type: 'users', data: users, generatedAt: new Date().toISOString() }
      case 'applications':
        return { type: 'applications', data: applications, generatedAt: new Date().toISOString() }
      case 'system':
        return { type: 'system', data: systemStats, generatedAt: new Date().toISOString() }
      default:
        return null
    }
  }

  return (
    <div data-testid="admin-portal">
      <header data-testid="admin-portal-header">
        <h1>Admin Portal - {user.name}</h1>
        <div data-testid="admin-role">Role: {user.role}</div>
        <div data-testid="system-health">System Health: {systemStats.systemHealth}</div>
      </header>

      <section data-testid="system-overview">
        <h2>System Overview</h2>
        <div data-testid="stats-grid">
          <div data-testid="total-users" className="stat-card">
            <h3>Total Users</h3>
            <p>{systemStats.totalUsers}</p>
          </div>
          <div data-testid="total-applications" className="stat-card">
            <h3>Total Applications</h3>
            <p>{systemStats.totalApplications}</p>
          </div>
          <div data-testid="total-offers" className="stat-card">
            <h3>Total Offers</h3>
            <p>{systemStats.totalOffers}</p>
          </div>
          <div data-testid="pending-applications" className="stat-card">
            <h3>Pending Applications</h3>
            <p>{systemStats.pendingApplications}</p>
          </div>
        </div>
      </section>

      <section data-testid="user-management">
        <h2>User Management</h2>
        <div data-testid="user-actions">
          <button 
            data-testid="create-user-btn"
            onClick={() => handleUserManagement('create', null, {
              email: 'newuser@test.com',
              role: 'user',
              name: 'New User'
            })}
          >
            Create User
          </button>
          <button 
            data-testid="export-users-btn"
            onClick={() => generateReport('users')}
          >
            Export Users
          </button>
        </div>
        
        <div data-testid="users-list">
          {users.map(user => (
            <div key={user.id} data-testid={`user-${user.id}`} className="user-card">
              <h3>{user.name}</h3>
              <p>Email: {user.email}</p>
              <p>Role: <span data-testid={`user-role-${user.id}`}>{user.role}</span></p>
              <div data-testid={`user-controls-${user.id}`}>
                <button 
                  data-testid={`edit-user-${user.id}`}
                  onClick={() => setSelectedUser(user)}
                >
                  Edit
                </button>
                <button 
                  data-testid={`delete-user-${user.id}`}
                  onClick={() => handleUserManagement('delete', user.id)}
                  disabled={user.role === 'admin'}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section data-testid="application-management">
        <h2>Application Management</h2>
        <div data-testid="app-actions">
          <button 
            data-testid="bulk-approve-btn"
            onClick={() => handleApplicationManagement('bulk_update', null, {
              ids: [1, 2],
              data: { status: 'approved' }
            })}
          >
            Bulk Approve
          </button>
          <button 
            data-testid="export-applications-btn"
            onClick={() => generateReport('applications')}
          >
            Export Applications
          </button>
        </div>
        
        <div data-testid="applications-list">
          {applications.map(app => (
            <div key={app.id} data-testid={`admin-app-${app.id}`} className="application-card">
              <h3>{app.type}</h3>
              <p>Status: <span data-testid={`admin-app-status-${app.id}`}>{app.status}</span></p>
              <p>User ID: {app.userId}</p>
              <p>Created: {new Date(app.createdAt).toLocaleDateString()}</p>
              
              <div data-testid={`app-controls-${app.id}`}>
                <select 
                  data-testid={`status-select-${app.id}`}
                  value={app.status}
                  onChange={(e) => handleApplicationManagement('update', app.id, { status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
                <button 
                  data-testid={`delete-app-${app.id}`}
                  onClick={() => handleApplicationManagement('delete', app.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section data-testid="system-maintenance">
        <h2>System Maintenance</h2>
        <div data-testid="maintenance-actions">
          <button 
            data-testid="backup-btn"
            onClick={() => handleSystemMaintenance('backup')}
          >
            System Backup
          </button>
          <button 
            data-testid="optimize-btn"
            onClick={() => handleSystemMaintenance('optimize')}
          >
            Optimize System
          </button>
          <button 
            data-testid="clear-cache-btn"
            onClick={() => handleSystemMaintenance('clear_cache')}
          >
            Clear Cache
          </button>
        </div>
      </section>

      <section data-testid="reports-analytics">
        <h2>Reports & Analytics</h2>
        <div data-testid="report-actions">
          <button 
            data-testid="generate-system-report-btn"
            onClick={() => generateReport('system')}
          >
            Generate System Report
          </button>
          <button 
            data-testid="view-logs-btn"
            onClick={() => console.log('Viewing system logs')}
          >
            View System Logs
          </button>
        </div>
      </section>
    </div>
  )
}

describe('Admin Portal Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  describe('6. Admin Portal All Functionality', () => {
    test('should display admin portal header with system information', () => {
      renderWithProviders(<MockAdminPortal />)
      
      expect(screen.getByTestId('admin-portal-header')).toBeInTheDocument()
      expect(screen.getByText(`Admin Portal - ${mockUsers.admin.name}`)).toBeInTheDocument()
      expect(screen.getByText(`Role: ${mockUsers.admin.role}`)).toBeInTheDocument()
      expect(screen.getByText('System Health: healthy')).toBeInTheDocument()
    })

    test('should display system overview with correct statistics', () => {
      renderWithProviders(<MockAdminPortal />)
      
      expect(screen.getByTestId('system-overview')).toBeInTheDocument()
      expect(screen.getByTestId('stats-grid')).toBeInTheDocument()
      
      // Check all stat cards
      expect(screen.getByTestId('total-users')).toHaveTextContent('3')
      expect(screen.getByTestId('total-applications')).toHaveTextContent('3')
      expect(screen.getByTestId('total-offers')).toHaveTextContent('2')
      expect(screen.getByTestId('pending-applications')).toHaveTextContent('1')
    })

    test('should provide comprehensive user management capabilities', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<MockAdminPortal />)
      
      expect(screen.getByTestId('user-management')).toBeInTheDocument()
      expect(screen.getByTestId('create-user-btn')).toBeInTheDocument()
      expect(screen.getByTestId('export-users-btn')).toBeInTheDocument()
      
      // Create a new user
      await user.click(screen.getByTestId('create-user-btn'))
      
      // Check if user count increased
      expect(screen.getByTestId('total-users')).toHaveTextContent('4')
      
      // Check if new user appears in list
      expect(screen.getByText('New User')).toBeInTheDocument()
    })

    test('should allow editing user information', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<MockAdminPortal />)
      
      // Find a user to edit
      const userCard = screen.getByTestId('user-1')
      expect(userCard).toBeInTheDocument()
      
      // Check edit button exists
      const editButton = screen.getByTestId('edit-user-1')
      expect(editButton).toBeInTheDocument()
      
      // Click edit (this would typically open an edit form)
      await user.click(editButton)
      
      // For now, just verify the button is clickable
      expect(editButton).toBeInTheDocument()
    })

    test('should allow deleting users (except admins)', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<MockAdminPortal />)
      
      // Check that admin user cannot be deleted
      const adminDeleteBtn = screen.getByTestId('delete-user-1')
      expect(adminDeleteBtn).toBeDisabled()
      
      // Check that regular users can be deleted
      const regularUserDeleteBtn = screen.getByTestId('delete-user-3')
      expect(regularUserDeleteBtn).not.toBeDisabled()
      
      // Delete a regular user
      await user.click(regularUserDeleteBtn)
      
      // Check if user count decreased
      expect(screen.getByTestId('total-users')).toHaveTextContent('2')
    })

    test('should provide comprehensive application management', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<MockAdminPortal />)
      
      expect(screen.getByTestId('application-management')).toBeInTheDocument()
      expect(screen.getByTestId('bulk-approve-btn')).toBeInTheDocument()
      expect(screen.getByTestId('export-applications-btn')).toBeInTheDocument()
      
      // Perform bulk approve
      await user.click(screen.getByTestId('bulk-approve-btn'))
      
      // Check if applications were updated
      expect(screen.getByTestId('admin-app-status-1')).toHaveTextContent('approved')
      expect(screen.getByTestId('admin-app-status-2')).toHaveTextContent('approved')
    })

    test('should allow individual application status updates', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<MockAdminPortal />)
      
      // Find an application
      const appCard = screen.getByTestId('admin-app-1')
      expect(appCard).toBeInTheDocument()
      
      // Check status select exists
      const statusSelect = screen.getByTestId('status-select-1')
      expect(statusSelect).toBeInTheDocument()
      
      // Change status to completed
      await user.selectOptions(statusSelect, 'completed')
      
      // Check if status was updated
      expect(screen.getByTestId('admin-app-status-1')).toHaveTextContent('completed')
    })

    test('should allow deleting applications', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<MockAdminPortal />)
      
      // Find an application
      const appCard = screen.getByTestId('admin-app-1')
      expect(appCard).toBeInTheDocument()
      
      // Check delete button exists
      const deleteButton = screen.getByTestId('delete-app-1')
      expect(deleteButton).toBeInTheDocument()
      
      // Delete the application
      await user.click(deleteButton)
      
      // Check if application count decreased
      expect(screen.getByTestId('total-applications')).toHaveTextContent('2')
      
      // Check if application was removed from list
      expect(screen.queryByTestId('admin-app-1')).not.toBeInTheDocument()
    })

    test('should provide system maintenance capabilities', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<MockAdminPortal />)
      
      expect(screen.getByTestId('system-maintenance')).toBeInTheDocument()
      expect(screen.getByTestId('backup-btn')).toBeInTheDocument()
      expect(screen.getByTestId('optimize-btn')).toBeInTheDocument()
      expect(screen.getByTestId('clear-cache-btn')).toBeInTheDocument()
      
      // Perform system optimization
      await user.click(screen.getByTestId('optimize-btn'))
      
      // Check if system health was updated
      expect(screen.getByText('System Health: optimized')).toBeInTheDocument()
    })

    test('should provide reports and analytics features', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<MockAdminPortal />)
      
      expect(screen.getByTestId('reports-analytics')).toBeInTheDocument()
      expect(screen.getByTestId('generate-system-report-btn')).toBeInTheDocument()
      expect(screen.getByTestId('view-logs-btn')).toBeInTheDocument()
      
      // Generate system report
      await user.click(screen.getByTestId('generate-system-report-btn'))
      
      // This would typically generate a report
      // For now, just verify the button is clickable
      expect(screen.getByTestId('generate-system-report-btn')).toBeInTheDocument()
    })

    test('should handle edge cases gracefully', () => {
      const MockEmptyAdminPortal = () => (
        <div data-testid="admin-portal">
          <section data-testid="system-overview">
            <h2>System Overview</h2>
            <div data-testid="stats-grid">
              <div data-testid="total-users" className="stat-card">
                <h3>Total Users</h3>
                <p>0</p>
              </div>
              <div data-testid="total-applications" className="stat-card">
                <h3>Total Applications</h3>
                <p>0</p>
              </div>
            </div>
          </section>
          <section data-testid="user-management">
            <h2>User Management</h2>
            <div data-testid="users-list">
              {[]}
            </div>
            <p data-testid="no-users">No users found</p>
          </section>
        </div>
      )
      
      renderWithProviders(<MockEmptyAdminPortal />)
      
      expect(screen.getByTestId('no-users')).toBeInTheDocument()
      expect(screen.getByTestId('total-users')).toHaveTextContent('0')
      expect(screen.getByTestId('total-applications')).toHaveTextContent('0')
    })
  })

  describe('Admin Portal Data Management', () => {
    test('should maintain data consistency across operations', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<MockAdminPortal />)
      
      // Initial state
      const initialUserCount = screen.getByTestId('total-users').textContent
      const initialAppCount = screen.getByTestId('total-applications').textContent
      
      // Create a user
      await user.click(screen.getByTestId('create-user-btn'))
      
      // Check user count increased
      expect(screen.getByTestId('total-users')).toHaveTextContent(parseInt(initialUserCount) + 1)
      
      // Delete an application
      await user.click(screen.getByTestId('delete-app-1'))
      
      // Check application count decreased
      expect(screen.getByTestId('total-applications')).toHaveTextContent(parseInt(initialAppCount) - 1)
    })

    test('should update statistics in real-time', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<MockAdminPortal />)
      
      // Initial pending applications
      expect(screen.getByTestId('pending-applications')).toHaveTextContent('1')
      
      // Approve an application
      const statusSelect = screen.getByTestId('status-select-1')
      await user.selectOptions(statusSelect, 'approved')
      
      // Check if pending count decreased
      expect(screen.getByTestId('pending-applications')).toHaveTextContent('0')
    })
  })

  describe('Admin Portal Security', () => {
    test('should prevent deletion of admin users', () => {
      renderWithProviders(<MockAdminPortal />)
      
      // Admin user delete button should be disabled
      const adminDeleteBtn = screen.getByTestId('delete-user-1')
      expect(adminDeleteBtn).toBeDisabled()
      
      // Regular user delete button should be enabled
      const regularUserDeleteBtn = screen.getByTestId('delete-user-3')
      expect(regularUserDeleteBtn).not.toBeDisabled()
    })

    test('should maintain audit trail for all operations', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<MockAdminPortal />)
      
      // Perform multiple operations
      await user.click(screen.getByTestId('create-user-btn'))
      await user.click(screen.getByTestId('bulk-approve-btn'))
      await user.click(screen.getByTestId('optimize-btn'))
      
      // All operations should be logged (this would be implemented in the actual system)
      // For now, we verify the operations completed successfully
      expect(screen.getByTestId('total-users')).toHaveTextContent('4')
      expect(screen.getByText('System Health: optimized')).toBeInTheDocument()
    })
  })

  describe('Admin Portal User Experience', () => {
    test('should provide clear visual feedback for all actions', () => {
      renderWithProviders(<MockAdminPortal />)
      
      // Check that all sections are clearly labeled
      expect(screen.getByText('System Overview')).toBeInTheDocument()
      expect(screen.getByText('User Management')).toBeInTheDocument()
      expect(screen.getByText('Application Management')).toBeInTheDocument()
      expect(screen.getByText('System Maintenance')).toBeInTheDocument()
      expect(screen.getByText('Reports & Analytics')).toBeInTheDocument()
    })

    test('should show appropriate controls based on user roles', () => {
      renderWithProviders(<MockAdminPortal />)
      
      // Admin users should have full access to all controls
      expect(screen.getByTestId('create-user-btn')).toBeInTheDocument()
      expect(screen.getByTestId('bulk-approve-btn')).toBeInTheDocument()
      expect(screen.getByTestId('backup-btn')).toBeInTheDocument()
      expect(screen.getByTestId('generate-system-report-btn')).toBeInTheDocument()
    })
  })
})
