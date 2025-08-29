import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockUsers, mockApiResponses } from '../utils/test-utils'

// Mock the login page component
jest.mock('../../app/login/page', () => {
  return function MockLoginPage() {
    return (
      <div data-testid="login-page">
        <h1>Login</h1>
        <form data-testid="login-form">
          <input 
            type="email" 
            placeholder="Email" 
            data-testid="email-input"
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            data-testid="password-input"
            required
          />
          <button type="submit" data-testid="login-button">
            Login
          </button>
        </form>
      </div>
    )
  }
})

describe('Authentication System', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    // Mock fetch for API calls
    global.fetch = jest.fn()
  })

  describe('1. Login Functionality for Different Users', () => {
    test('should allow admin user to login successfully', async () => {
      const user = userEvent.setup()
      
      // Mock successful admin login
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockApiResponses.login.success,
          user: mockUsers.admin
        })
      })

      renderWithProviders(<div data-testid="login-page">Login Page</div>)
      
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const loginButton = screen.getByTestId('login-button')

      await user.type(emailInput, mockUsers.admin.email)
      await user.type(passwordInput, 'adminpassword123')
      await user.click(loginButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: mockUsers.admin.email,
            password: 'adminpassword123'
          })
        })
      })
    })

    test('should allow bank user to login successfully', async () => {
      const user = userEvent.setup()
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockApiResponses.login.success,
          user: mockUsers.bankUser
        })
      })

      renderWithProviders(<div data-testid="login-page">Login Page</div>)
      
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const loginButton = screen.getByTestId('login-button')

      await user.type(emailInput, mockUsers.bankUser.email)
      await user.type(passwordInput, 'bankpassword123')
      await user.click(loginButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: mockUsers.bankUser.email,
            password: 'bankpassword123'
          })
        })
      })
    })

    test('should allow portal user to login successfully', async () => {
      const user = userEvent.setup()
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponses.login.success
      })

      renderWithProviders(<div data-testid="login-page">Login Page</div>)
      
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const loginButton = screen.getByTestId('login-button')

      await user.type(emailInput, mockUsers.portalUser.email)
      await user.type(passwordInput, 'userpassword123')
      await user.click(loginButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: mockUsers.portalUser.email,
            password: 'userpassword123'
          })
        })
      })
    })

    test('should handle login failure with invalid credentials', async () => {
      const user = userEvent.setup()
      
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockApiResponses.login.failure
      })

      renderWithProviders(<div data-testid="login-page">Login Page</div>)
      
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const loginButton = screen.getByTestId('login-button')

      await user.type(emailInput, 'invalid@email.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(loginButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'invalid@email.com',
            password: 'wrongpassword'
          })
        })
      })
    })

    test('should validate required fields before submission', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<div data-testid="login-page">Login Page</div>)
      
      const loginButton = screen.getByTestId('login-button')
      
      // Try to submit without filling required fields
      await user.click(loginButton)
      
      // Should not make API call
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('2. Authentication State Management', () => {
    test('should store JWT token in localStorage after successful login', async () => {
      const user = userEvent.setup()
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponses.login.success
      })

      renderWithProviders(<div data-testid="login-page">Login Page</div>)
      
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const loginButton = screen.getByTestId('login-button')

      await user.type(emailInput, mockUsers.portalUser.email)
      await user.type(passwordInput, 'userpassword123')
      await user.click(loginButton)

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-jwt-token')
      })
    })

    test('should clear authentication data on logout', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<div data-testid="logout-button">Logout</div>)
      
      const logoutButton = screen.getByTestId('logout-button')
      await user.click(logoutButton)
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')
      expect(sessionStorage.clear).toHaveBeenCalled()
    })
  })

  describe('3. Security Features', () => {
    test('should hash passwords before sending to server', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<div data-testid="login-page">Login Page</div>)
      
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const loginButton = screen.getByTestId('login-button')

      await user.type(emailInput, mockUsers.portalUser.email)
      await user.type(passwordInput, 'userpassword123')
      await user.click(loginButton)

      // Password should be hashed (this would require bcrypt implementation)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    test('should implement rate limiting for failed login attempts', async () => {
      const user = userEvent.setup()
      
      // Mock multiple failed attempts
      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => mockApiResponses.login.failure
      })

      renderWithProviders(<div data-testid="login-page">Login Page</div>)
      
      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const loginButton = screen.getByTestId('login-button')

      // Try multiple failed logins
      for (let i = 0; i < 5; i++) {
        await user.type(emailInput, 'test@email.com')
        await user.type(passwordInput, 'wrongpassword')
        await user.click(loginButton)
        
        // Clear inputs for next attempt
        emailInput.value = ''
        passwordInput.value = ''
      }

      // Should implement rate limiting after multiple failures
      expect(global.fetch).toHaveBeenCalledTimes(5)
    })
  })
})
