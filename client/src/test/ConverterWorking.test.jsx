import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, test, expect, vi } from 'vitest'

// Mock all external dependencies to prevent errors
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

// Import the real Converter component
import Converter from '../pages/Converter'

const renderConverter = () => {
  return render(
    <BrowserRouter>
      <Converter />
    </BrowserRouter>
  )
}

describe('Converter Page - Working Tests', () => {
  test('renders without crashing', () => {
    const { container } = renderConverter()
    expect(container).toBeInTheDocument()
  })

  test('renders page title', () => {
    renderConverter()
    expect(screen.getByText(/Image Converter/i)).toBeInTheDocument()
  })

  test('renders description text', () => {
    renderConverter()
    expect(screen.getByText(/Convert between different image formats/i)).toBeInTheDocument()
  })

  test('renders upload button', () => {
    renderConverter()
    expect(screen.getByText(/Choose Image Files/i)).toBeInTheDocument()
  })

  test('renders drag and drop text', () => {
    renderConverter()
    expect(screen.getByText(/drag and drop images here/i)).toBeInTheDocument()
  })

  test('renders supported formats info', () => {
    renderConverter()
    expect(screen.getByText(/Supported formats/i)).toBeInTheDocument()
    expect(screen.getByText(/JPEG, PNG, WebP/i)).toBeInTheDocument()
  })

  test('renders file size limit info', () => {
    renderConverter()
    expect(screen.getByText(/Maximum size: 10MB/i)).toBeInTheDocument()
  })

  test('has file input element', () => {
    renderConverter()
    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
    expect(fileInput).toHaveAttribute('accept', 'image/*')
    expect(fileInput).toHaveAttribute('multiple')
  })

  test('file input has correct id', () => {
    renderConverter()
    const fileInput = document.querySelector('#file-upload')
    expect(fileInput).toBeInTheDocument()
    expect(fileInput.type).toBe('file')
  })

  test('label is connected to file input', () => {
    renderConverter()
    const label = screen.getByText(/Choose Image Files/i)
    const fileInput = document.querySelector('#file-upload')
    
    expect(label).toHaveAttribute('for', 'file-upload')
    expect(fileInput).toHaveAttribute('id', 'file-upload')
  })

  test('renders no registration required message', () => {
    renderConverter()
    expect(screen.getByText(/No registration required/i)).toBeInTheDocument()
  })

  test('has proper CSS classes for styling', () => {
    const { container } = renderConverter()
    
    // Check if main container has expected classes
    const mainDiv = container.querySelector('.min-h-screen')
    expect(mainDiv).toBeInTheDocument()
    
    // Check if upload area has dashed border
    const uploadArea = container.querySelector('.border-dashed')
    expect(uploadArea).toBeInTheDocument()
  })
  
  test('renders upload area text', () => {
    renderConverter()
    expect(screen.getByText(/drag and drop images here/i)).toBeInTheDocument()
  })

  test('renders browse button text', () => {
    renderConverter()
    expect(screen.getByText(/Choose Image Files/i)).toBeInTheDocument()
  })

  test('has file input element', () => {
    renderConverter()
    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
  })

  test('renders supported formats text', () => {
    renderConverter()
    expect(screen.getByText(/Supported formats/i)).toBeInTheDocument()
  })

  test('renders without crashing', () => {
    const { container } = renderConverter()
    expect(container).toBeInTheDocument()
  })

})
