import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import Sidebar from '@/components/sidebar/sidebar'
import { useSession } from '@/components/session/SessionProvider'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}))

jest.mock('@/components/session/SessionProvider', () => ({
  useSession: jest.fn()
}))

describe('Sidebar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
    ;(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() })
    ;(useSearchParams as jest.Mock).mockReturnValue({ get: jest.fn() })
    
    // Mock fetch for parameters API
    global.fetch = jest.fn(() => 
      Promise.resolve({
        json: () => Promise.resolve({ data: { tamu: ['Company A', 'Company B'] } })
      })
    ) as jest.Mock
  })

  it('should render loading state', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
      logout: jest.fn()
    })

    const { container } = render(<Sidebar />)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('should not render if no user and not loading', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      logout: jest.fn()
    })

    const { container } = render(<Sidebar />)
    expect(container).toBeEmptyDOMElement()
  })

  it('should render user info and super_admin menus', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      user: { fullName: 'John Doe', role: 'super_admin' },
      loading: false,
      logout: jest.fn()
    })

    render(<Sidebar />)

    // Check user info
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('SUPER ADMIN')).toBeInTheDocument()

    // Check super admin specific menus
    expect(screen.getByText('MANAJEMEN')).toBeInTheDocument()
    expect(screen.getByText('Parameter')).toBeInTheDocument()
  })

  it('should render admin menus but not MANAJEMEN', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      user: { fullName: 'Jane Admin', role: 'admin' },
      loading: false,
      logout: jest.fn()
    })

    render(<Sidebar />)

    expect(screen.getByText('Jane Admin')).toBeInTheDocument()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()

    expect(screen.getByText('RESERVASI')).toBeInTheDocument()
    expect(screen.queryByText('MANAJEMEN')).not.toBeInTheDocument()
  })

  it('should mark active menu item correctly', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/room-status')
    ;(useSession as jest.Mock).mockReturnValue({
      user: { fullName: 'Jane Admin', role: 'admin' },
      loading: false,
      logout: jest.fn()
    })

    render(<Sidebar />)

    const activeLink = screen.getByText('Room Status').closest('a')
    expect(activeLink).toHaveClass('bg-white')
  })
})
