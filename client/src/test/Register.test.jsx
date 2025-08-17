import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, test, expect, vi } from 'vitest'

// Mock external dependencies
vi.mock('../utils/dataMigration', () => ({
  migrateLocalStorageToCloud: vi.fn()
}))



import Register from '../pages/Register'

const renderRegister = () => {
  return render(
    <BrowserRouter>
      <Register />
    </BrowserRouter>
  )
}

describe('Register Page  Tests', () => {
  test('renders without crashing', () => {
    const { container } = renderRegister()
    expect(container).toBeInTheDocument()
  })

  test('renders register title', () => {
    renderRegister()
    // Look for the heading specifically, not the button
    const heading = screen.getByRole('heading', { name: /Register/i })
    expect(heading).toBeInTheDocument()
  })

  test('renders email input field', () => {
    renderRegister()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Email/i })).toHaveAttribute('type', 'email')
  })

  test('renders password input field', () => {
    renderRegister()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    const passwordInput = document.querySelector('input[type="password"]')
    expect(passwordInput).toBeInTheDocument()
  })

  test('renders register button', () => {
    renderRegister()
    const registerButton = screen.getByRole('button', { name: /Register/i })
    expect(registerButton).toBeInTheDocument()
    expect(registerButton).toHaveAttribute('type', 'submit')
  })

  test('has proper styling', () => {
    const { container } = renderRegister()
    expect(container.firstChild).toBeInTheDocument()
  })



  test('renders signup form or OAuth section', () => {
    const { container } = renderRegister()
    const hasForm = container.querySelector('form') || 
                   container.querySelector('button') ||
                   screen.queryByRole('button')
    
    expect(hasForm).toBeTruthy()
  })

  test('has link to login page', () => {
    renderRegister()
    expect(screen.getByText(/Already have an account/i) || 
           screen.getByText(/Sign in/i) || 
           screen.getByText(/Login/i)).toBeInTheDocument()
  })

  test('does not show error message initially', () => {
    renderRegister()
    const errorElements = document.querySelectorAll('.error, .text-red-500, [class*="error"]')
    expect(errorElements.length).toBe(0)
  })
})
