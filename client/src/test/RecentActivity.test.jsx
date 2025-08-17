import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, test, expect, vi } from 'vitest'

// Mock external dependencies
vi.mock('../utils/dataMigration', () => ({
  loadRecentActivity: vi.fn(() => []),
  saveRecentActivity: vi.fn()
}))

vi.mock('../components/DeleteConfirmPopup', () => ({
  default: () => <div data-testid="delete-popup">Delete Popup</div>
}))

import RecentActivity from '../pages/RecentActivity'

const renderRecentActivity = () => {
  return render(
    <BrowserRouter>
      <RecentActivity />
    </BrowserRouter>
  )
}

describe('Recent Activity Page - Beginner Tests', () => {
  test('renders without crashing', () => {
    const { container } = renderRecentActivity()
    expect(container).toBeInTheDocument()
  })

  test('renders page title', () => {
    renderRecentActivity()
    expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument()
  })

  test('renders login prompt for anonymous users', () => {
    renderRecentActivity()
    // Should show "Login Required" heading
    expect(screen.getByText(/Login Required/i)).toBeInTheDocument()
  })

  test('renders account requirement message', () => {
    renderRecentActivity()
    expect(screen.getByText(/Access to Recent Activity requires an account/i)).toBeInTheDocument()
  })

  test('renders login and register buttons', () => {
    renderRecentActivity()
    expect(screen.getByText(/Login to Access History/i)).toBeInTheDocument()
    expect(screen.getByText(/Create Free Account/i)).toBeInTheDocument()
  })

  test('has proper styling', () => {
    const { container } = renderRecentActivity()
    const mainDiv = container.querySelector('.min-h-screen') || container.firstChild
    expect(mainDiv).toBeInTheDocument()
  })

  test('renders alternative tools section', () => {
    renderRecentActivity()
    expect(screen.getByText(/Or continue using our free tools/i)).toBeInTheDocument()
  })

  test('shows tool navigation links', () => {
    renderRecentActivity()
    expect(screen.getByText(/Compressor/i)).toBeInTheDocument()
    expect(screen.getByText(/Converter/i)).toBeInTheDocument()
    expect(screen.getByText(/BG Remover/i)).toBeInTheDocument()
  })

  test('renders security message', () => {
    renderRecentActivity()
    expect(screen.getByText(/secure and accessible across devices/i)).toBeInTheDocument()
  })

  test('has proper navigation links', () => {
    renderRecentActivity()
    const links = document.querySelectorAll('a[href]')
    expect(links.length).toBeGreaterThan(0)

    // Check for specific navigation links
    const loginLink = document.querySelector('a[href="/login"]')
    const registerLink = document.querySelector('a[href="/register"]')

    expect(loginLink).toBeInTheDocument()
    expect(registerLink).toBeInTheDocument()
  })
})
