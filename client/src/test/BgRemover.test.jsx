import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, test, expect, vi } from 'vitest'

// Mock external dependencies
vi.mock('../utils/fileValidation', () => ({
  validateFiles: vi.fn(() => ({ isValid: true, errors: [], validFiles: [] })),
  isFileCorrupted: vi.fn(() => Promise.resolve(false)),
  handleNetworkError: vi.fn(),
  handleServerError: vi.fn()
}))

vi.mock('../utils/dataMigration', () => ({
  saveRecentActivity: vi.fn()
}))

vi.mock('../utils/clientBgRemoval', () => ({
  removeBackgroundClientSide: vi.fn(),
  removeBackgroundAdvanced: vi.fn()
}))

vi.mock('../components/DeleteConfirmPopup', () => ({
  default: () => <div data-testid="delete-popup">Delete Popup</div>
}))

vi.mock('../components/BeforeAfterSlider', () => ({
  default: () => <div data-testid="before-after-slider">Before After Slider</div>
}))

import BgRemover from '../pages/Bg-Remover'

const renderBgRemover = () => {
  return render(
    <BrowserRouter>
      <BgRemover />
    </BrowserRouter>
  )
}

describe('Background Remover Page - Beginner Tests', () => {
  test('renders without crashing', () => {
    const { container } = renderBgRemover()
    expect(container).toBeInTheDocument()
  })

  test('renders page title', () => {
    renderBgRemover()
    expect(screen.getByText(/Background Remover/i)).toBeInTheDocument()
  })

  test('renders description', () => {
    renderBgRemover()
    expect(screen.getByText(/Remove backgrounds from your images instantly/i)).toBeInTheDocument()
  })

  test('renders upload button', () => {
    renderBgRemover()
    expect(screen.getByText(/Choose Image Files/i)).toBeInTheDocument()
  })

  test('renders drag and drop text', () => {
    renderBgRemover()
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
  })

  test('renders supported formats info', () => {
    renderBgRemover()
    expect(screen.getByText(/Supported formats/i)).toBeInTheDocument()
  })

  test('has file input element', () => {
    renderBgRemover()
    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
    expect(fileInput).toHaveAttribute('accept', 'image/*')
  })

  test('renders no registration message', () => {
    renderBgRemover()
    expect(screen.getByText(/No registration required/i)).toBeInTheDocument()
  })



  test('has proper styling classes', () => {
    const { container } = renderBgRemover()
    const mainDiv = container.querySelector('.min-h-screen')
    expect(mainDiv).toBeInTheDocument()
  })
})
