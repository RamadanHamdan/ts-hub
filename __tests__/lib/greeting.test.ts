import { getGreeting, getGreetingEmoji } from '@/lib/greeting'

describe('Greeting Utils', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe('getGreeting', () => {
    it('should return Selamat Pagi between 05:00 and 10:59', () => {
      jest.setSystemTime(new Date('2024-01-01T08:00:00'))
      expect(getGreeting('Andi')).toBe('Selamat Pagi, Andi!')
      expect(getGreeting()).toBe('Selamat Pagi!')
    })

    it('should return Selamat Siang between 11:00 and 14:59', () => {
      jest.setSystemTime(new Date('2024-01-01T12:30:00'))
      expect(getGreeting('Budi')).toBe('Selamat Siang, Budi!')
    })

    it('should return Selamat Sore between 15:00 and 17:59', () => {
      jest.setSystemTime(new Date('2024-01-01T16:00:00'))
      expect(getGreeting('Citra')).toBe('Selamat Sore, Citra!')
    })

    it('should return Selamat Malam between 18:00 and 04:59', () => {
      jest.setSystemTime(new Date('2024-01-01T20:00:00'))
      expect(getGreeting('Doni')).toBe('Selamat Malam, Doni!')
      
      jest.setSystemTime(new Date('2024-01-01T02:00:00'))
      expect(getGreeting('Eka')).toBe('Selamat Malam, Eka!')
    })
  })

  describe('getGreetingEmoji', () => {
    it('should return 🌅 for morning', () => {
      jest.setSystemTime(new Date('2024-01-01T08:00:00'))
      expect(getGreetingEmoji()).toBe('🌅')
    })

    it('should return ☀️ for noon', () => {
      jest.setSystemTime(new Date('2024-01-01T13:00:00'))
      expect(getGreetingEmoji()).toBe('☀️')
    })

    it('should return 🌤️ for afternoon', () => {
      jest.setSystemTime(new Date('2024-01-01T16:00:00'))
      expect(getGreetingEmoji()).toBe('🌤️')
    })

    it('should return 🌙 for evening/night', () => {
      jest.setSystemTime(new Date('2024-01-01T20:00:00'))
      expect(getGreetingEmoji()).toBe('🌙')
    })
  })
})
