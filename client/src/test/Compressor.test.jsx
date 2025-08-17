import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, test, expect, vi } from 'vitest'
import Compressor from '../pages/Compressor'

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

vi.mock('../components/DeleteConfirmPopup', () => ({
  default: () => <div data-testid="delete-popup">Delete Popup</div>
}))

vi.mock('../components/BeforeAfterSlider', () => ({
  default: () => <div data-testid="before-after-slider">Before After Slider</div>
}))


const renderCompressor = () => {
  return render(
    <BrowserRouter>
      <Compressor />
    </BrowserRouter>
  )
}

describe('Compressor Page - Beginner Tests', () => {
  test('renders without crashing', () => {
    const { container } = renderCompressor()
    expect(container).toBeInTheDocument()
  })

  test('renders page title', () => {
    renderCompressor()
    expect(screen.getByText(/Image Compressor/i)).toBeInTheDocument()
  })

  test('renders description', () => {
    renderCompressor()
    expect(screen.getByText(/Reduce file size without losing quality/i)).toBeInTheDocument()
  })

  test('renders upload button', () => {
    renderCompressor()
    expect(screen.getByText(/Choose Image Files/i)).toBeInTheDocument()
  })

  test('renders drag and drop text', () => {
    renderCompressor()
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
  })

  test('renders quality slider section', () => {
    renderCompressor()
    expect(screen.getByText(/quality/i)).toBeInTheDocument()
  })

  test('renders supported formats info', () => {
    renderCompressor()
    expect(screen.getByText(/Supported formats/i)).toBeInTheDocument()
  })

  test('has file input element', () => {
    renderCompressor()
    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
    expect(fileInput).toHaveAttribute('accept', 'image/*')
  })

  test('renders no registration message', () => {
    renderCompressor()
    expect(screen.getByText(/No registration required/i)).toBeInTheDocument()
  })

  test('has proper styling classes', () => {
    const { container } = renderCompressor()
    const mainDiv = container.querySelector('.min-h-screen')
    expect(mainDiv).toBeInTheDocument()
  })
})
