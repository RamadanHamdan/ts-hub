import { GET } from '@/app/api/auth/me/route'
import { cookies } from 'next/headers'

jest.mock('next/headers', () => ({
  cookies: jest.fn()
}))

describe('Auth Me API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return null user if no session cookie', async () => {
    ;(cookies as jest.Mock).mockResolvedValue({
      get: jest.fn().mockReturnValue(undefined)
    })

    const response = await GET()
    const data = await response.json()

    expect(data).toEqual({ user: null })
  })

  it('should return user object if session cookie exists', async () => {
    const mockUser = { role: 'admin', username: 'testuser' }
    
    ;(cookies as jest.Mock).mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: JSON.stringify(mockUser) })
    })

    const response = await GET()
    const data = await response.json()

    expect(data).toEqual({ user: mockUser })
  })

  it('should return null user if session cookie is invalid JSON', async () => {
    ;(cookies as jest.Mock).mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'invalid-json' })
    })

    const response = await GET()
    const data = await response.json()

    expect(data).toEqual({ user: null })
  })
})
