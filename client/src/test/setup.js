// Vitest Setup File
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.URL for file uploads
global.URL.createObjectURL = vi.fn(() => 'mocked-url')
global.URL.revokeObjectURL = vi.fn()

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock FileReader for file upload tests
global.FileReader = class {
  constructor() {
    this.result = null
    this.onload = null
    this.onerror = null
  }
  
  readAsDataURL(file) {
    setTimeout(() => {
      this.result = `data:image/jpeg;base64,mock-base64-data`
      if (this.onload) this.onload({ target: { result: this.result } })
    }, 10)
  }
}

// Mock Image for image validation
global.Image = class {
  constructor() {
    this.onload = null
    this.onerror = null
    this.src = ''
    this.width = 100
    this.height = 100
  }
  
  set src(value) {
    setTimeout(() => {
      if (this.onload) this.onload()
    }, 10)
  }
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Keep console for debugging - don't mock it
// This helps with debugging test failures
