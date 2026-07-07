import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { SessionProvider, useSession } from '@/components/session/SessionProvider'
import { usePathname, useRouter } from 'next/navigation'
import userEvent from '@testing-library/user-event'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn()
}))

const TestComponent = () => {
  const { user, loading, logout, setUser } = useSession()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div data-testid="user-role">{user ? user.role : 'Guest'}</div>
      <button onClick={logout}>Logout</button>
      <button onClick={() => setUser({
        _id: '1',
        userId: 'U1',
        role: 'admin',
        username: 'test',
        fullName: 'Test User'
      })}>
        Set User Direct
      </button>
    </div>
  )
}

describe('SessionProvider', () => {
  const mockRouter = { replace: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
  })

  it('should fetch session and render user', async () => {
    global.fetch = jest.fn(() => 
      Promise.resolve({
        json: () => Promise.resolve({ user: { role: 'super_admin' } })
      })
    ) as jest.Mock

    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('user-role')).toHaveTextContent('super_admin')
    })
  })

  it('should redirect to home if no session', async () => {
    global.fetch = jest.fn(() => 
      Promise.resolve({
        json: () => Promise.resolve({ user: null })
      })
    ) as jest.Mock

    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/')
    })
  })

  it('should not redirect if no session but on login page', async () => {
    ;(usePathname as jest.Mock).mockReturnValue('/')
    global.fetch = jest.fn(() => 
      Promise.resolve({
        json: () => Promise.resolve({ user: null })
      })
    ) as jest.Mock

    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-role')).toHaveTextContent('Guest')
    })
    expect(mockRouter.replace).not.toHaveBeenCalled()
  })

  it('should handle logout correctly', async () => {
    global.fetch = jest.fn(() => 
      Promise.resolve({
        json: () => Promise.resolve({ user: { role: 'user' } })
      })
    ) as jest.Mock

    const userSetup = userEvent.setup()

    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-role')).toHaveTextContent('user')
    })

    const logoutBtn = screen.getByText('Logout')
    
    // Mock fetch for logout
    global.fetch = jest.fn(() => Promise.resolve({})) as jest.Mock
    
    await userSetup.click(logoutBtn)

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', expect.any(Object))
    expect(mockRouter.replace).toHaveBeenCalledWith('/')
    expect(screen.getByTestId('user-role')).toHaveTextContent('Guest')
  })
})
