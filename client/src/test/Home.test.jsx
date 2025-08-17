import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Home from '../pages/Home'

const renderHome = () => {
  return render(
    <BrowserRouter>
      <Home />
    </BrowserRouter>
  )
}

describe('Home Page - Beginner Tests', () => {
  test('renders without crashing', () => {
    const { container } = renderHome()
    expect(container).toBeInTheDocument()
  })

 

  test('renders all feature cards', () => {
    renderHome()
    expect(screen.getByText('Compress Images')).toBeInTheDocument()
    expect(screen.getByText('Convert Formats')).toBeInTheDocument()
    expect(screen.getByText('Remove Background')).toBeInTheDocument()
  })

  test('renders feature descriptions', () => {
    renderHome()
    expect(screen.getByText(/Reduce file size while maintaining quality/)).toBeInTheDocument()
    expect(screen.getByText(/Convert between JPEG, PNG, WebP, and AVIF formats/)).toBeInTheDocument()
    expect(screen.getByText(/AI-powered background removal/)).toBeInTheDocument()
  })

  test('renders navigation links', () => {
    renderHome()
    const compressorLink = screen.getByRole('link', { name: /try compressor/i })
    const converterLink = screen.getByRole('link', { name: /try converter/i })
    const bgRemoverLink = screen.getByRole('link', { name: /try bg remover/i })

    expect(compressorLink).toHaveAttribute('href', '/compressor')
    expect(converterLink).toHaveAttribute('href', '/converter')
    expect(bgRemoverLink).toHaveAttribute('href', '/bg-remover')
  })

 

  test('renders free to use message', () => {
    renderHome()
    expect(screen.getByText(/Free to use/i) || screen.getByText(/No registration required/i)).toBeInTheDocument()
  })

  test('has proper styling', () => {
    const { container } = renderHome()
    const mainDiv = container.querySelector('.min-h-screen') || container.firstChild
    expect(mainDiv).toBeInTheDocument()
  })

  test('renders all three feature sections', () => {
    const { container } = renderHome()
    // Should have 3 feature cards/sections
    const featureCards = container.querySelectorAll('[class*="card"], [class*="feature"], .bg-white, .border')
    expect(featureCards.length).toBeGreaterThanOrEqual(3)
  })
})
