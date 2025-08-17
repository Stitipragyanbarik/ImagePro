import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import BeforeAfterSlider from '../components/BeforeAfterSlider'

describe('BeforeAfterSlider Component', () => {
  const mockProps = {
    beforeImage: 'before.jpg',
    afterImage: 'after.jpg',
    beforeLabel: 'Original',
    afterLabel: 'Processed',
    className: 'test-class'
  }

  test('renders before and after labels', () => {
    render(<BeforeAfterSlider {...mockProps} />)
    
    expect(screen.getByText('Original')).toBeInTheDocument()
    expect(screen.getByText('Processed')).toBeInTheDocument()
  })

  test('renders both images', () => {
    render(<BeforeAfterSlider {...mockProps} />)
    
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
    expect(images[0]).toHaveAttribute('src', 'after.jpg')
    expect(images[1]).toHaveAttribute('src', 'before.jpg')
  })

  test('applies custom className', () => {
    const { container } = render(<BeforeAfterSlider {...mockProps} />)
    expect(container.firstChild).toHaveClass('test-class')
  })

  test('handles missing images gracefully', () => {
    render(
      <BeforeAfterSlider 
        beforeImage=""
        afterImage=""
        
      />
    )
    
    expect(screen.getByText(/Upload and process an image/i)).toBeInTheDocument()
   
  })

 test('slider interaction updates style', () => {
    render(<BeforeAfterSlider {...mockProps} />)
    const container = screen.getByAltText('Processed').closest('div[ref]')
      || screen.getByAltText('Processed').parentElement.parentElement

    // Simulate dragging
    fireEvent.mouseDown(container, { clientX: 50 })
    fireEvent.mouseMove(document, { clientX: 200 })
    fireEvent.mouseUp(document)

    const clippedImageContainer = screen.getByAltText('Original').parentElement
    expect(clippedImageContainer.style.clipPath).toContain('inset')
  })
})
