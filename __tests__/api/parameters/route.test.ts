import { GET } from '@/app/api/parameters/route'

describe('Parameters API Route', () => {
  it('should return empty tamu array by default', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data).toHaveProperty('data')
    expect(data.data).toHaveProperty('tamu')
    expect(Array.isArray(data.data.tamu)).toBe(true)
    expect(data.data.tamu.length).toBe(0)
  })
})
