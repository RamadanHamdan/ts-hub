import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongoose'

jest.mock('mongoose', () => {
  return {
    connection: {
      readyState: 0
    },
    connect: jest.fn()
  }
})

describe('mongoose connector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global._mongoosePromise = undefined
    // Reset connection state
    ;(mongoose.connection as any).readyState = 0
  })

  it('should return mongoose instance if already connected', async () => {
    ;(mongoose.connection as any).readyState = 1
    const conn = await connectDB()
    expect(conn).toBe(mongoose)
    expect(mongoose.connect).not.toHaveBeenCalled()
  })

  it('should call mongoose.connect if not connected', async () => {
    const mockPromise = Promise.resolve(mongoose)
    ;(mongoose.connect as jest.Mock).mockReturnValue(mockPromise)

    const conn = await connectDB()
    expect(mongoose.connect).toHaveBeenCalledTimes(1)
    expect(conn).toBe(mongoose)
  })

  it('should use cached promise if connection is in progress', async () => {
    const mockPromise = Promise.resolve(mongoose)
    ;(mongoose.connect as jest.Mock).mockReturnValue(mockPromise)

    // Call twice rapidly
    const p1 = connectDB()
    const p2 = connectDB()
    
    await Promise.all([p1, p2])

    // Should only call connect once
    expect(mongoose.connect).toHaveBeenCalledTimes(1)
  })

  it('should clear cached promise on connection failure', async () => {
    const mockError = new Error('Connection failed')
    ;(mongoose.connect as jest.Mock).mockReturnValue(Promise.reject(mockError))

    await expect(connectDB()).rejects.toThrow('Connection failed')
    
    // The promise should be cleared
    expect(global._mongoosePromise).toBeUndefined()
  })
})
