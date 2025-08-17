import { render, screen } from '@testing-library/react'
import { describe, test, expect } from 'vitest'

import App from '../App'



const renderWithRoute = (route = '/') => {
  window.history.pushState({}, 'Test page', route)
  return render(<App />)
}

describe('App Component Routing', () => {

 beforeEach(() => {
    localStorage.clear()
  })

  test('renders Home page on default route', () => {
    renderWithRoute('/')
    expect(screen.getByText(/home/i)).toBeInTheDocument()
  })

  test('renders Login page on /login', () => {
    renderWithRoute('/login')
    expect(screen.getByText(/login/i)).toBeInTheDocument()
  })



  test('renders Background Remover page on /bg-remover', () => {
    renderWithRoute('/bg-remover')
    expect(screen.getByText(/background remover/i)).toBeInTheDocument()
  })

  

  test('renders Login page instead of Profile when not logged in', () => {
    localStorage.removeItem('authToken')
    renderWithRoute('/profile')
    expect(screen.getByText(/login/i)).toBeInTheDocument()
  })

  test('renders Profile page when logged in',async () => {
    localStorage.setItem('authToken', 'fake-token')
    renderWithRoute('/profile')
    screen.debug()
   // expect(await screen.findByText(/profile/i)).toBeInTheDocument()
   await new Promise(r => setTimeout(r, 2000)) // wait to see delayed renders
  screen.debug() 
  })
})


describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App/>)
    expect(document.body).toBeInTheDocument()
  })

})
