import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, test, expect, vi } from 'vitest'

// Mock all external dependencies globally
vi.mock('../utils/fileValidation', () => ({
  validateFiles: vi.fn(() => ({ isValid: true, errors: [], validFiles: [] })),
  isFileCorrupted: vi.fn(() => Promise.resolve(false)),
  handleNetworkError: vi.fn(),
  handleServerError: vi.fn()
}))

vi.mock('../utils/dataMigration', () => ({
  saveRecentActivity: vi.fn(),
  loadRecentActivity: vi.fn(() => []),
  migrateLocalStorageToCloud: vi.fn()
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

// Import all components
import Home from '../pages/Home'
import Compressor from '../pages/Compressor'
import Converter from '../pages/Converter'
import BgRemover from '../pages/Bg-Remover'
import Login from '../pages/Login'
import Register from '../pages/Register'
import RecentActivity from '../pages/RecentActivity'

const renderWithRouter = (Component) => {
  return render(
    <BrowserRouter>
      <Component />
    </BrowserRouter>
  )
}

describe('All Features  Tests', () => {
  test('Home page renders without crashing', () => {
    const { container } = renderWithRouter(Home)
    expect(container).toBeInTheDocument()
  })

  test('Compressor page renders without crashing', () => {
    const { container } = renderWithRouter(Compressor)
    expect(container).toBeInTheDocument()
  })

  test('Converter page renders without crashing', () => {
    const { container } = renderWithRouter(Converter)
    expect(container).toBeInTheDocument()
  })

  test('BG-Remover page renders without crashing', () => {
    const { container } = renderWithRouter(BgRemover)
    expect(container).toBeInTheDocument()
  })

  test('Login page renders without crashing', () => {
    const { container } = renderWithRouter(Login)
    expect(container).toBeInTheDocument()
  })

  test('Register page renders without crashing', () => {
    const { container } = renderWithRouter(Register)
    expect(container).toBeInTheDocument()
  })

  test('Recent Activity page renders without crashing', () => {
    const { container } = renderWithRouter(RecentActivity)
    expect(container).toBeInTheDocument()
  })
})
