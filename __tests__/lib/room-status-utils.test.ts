import { formatBulan, buildPhoneOptions, autoFillStatusBook } from '@/lib/room-status-utils'

describe('Room Status Utils', () => {
  describe('formatBulan', () => {
    it('should format d/m/yyyy correctly', () => {
      expect(formatBulan('18/6/2025')).toBe('18-Jun-2025')
      expect(formatBulan('05/12/2024')).toBe('05-Dec-2024')
    })

    it('should format yyyy-mm-dd correctly', () => {
      expect(formatBulan('2025-06-18')).toBe('18-Jun-2025')
      expect(formatBulan('2024-12-05')).toBe('05-Dec-2024')
    })

    it('should return original string if format is unknown', () => {
      expect(formatBulan('invalid date format')).toBe('invalid date format')
      expect(formatBulan('')).toBe('')
    })
  })

  describe('buildPhoneOptions', () => {
    it('should extract last 4 digits and group properly', () => {
      const rows = [
        { nomor_telp: '081234567890' }, // 7890
        { nomor_telp: '+6281234567890' }, // 7890 - should group with above
        { nomor_telp: '0811112222' }, // 2222
        { nomor_telp: '123' }, // Too short, should be ignored
        { nomor_telp: undefined }, // Should be ignored safely
      ]

      const options = buildPhoneOptions(rows)
      
      expect(options).toHaveLength(3) // ALL + 2 groups (7890, 2222)
      expect(options[0]).toEqual({ label: 'Semua No Telp', value: 'ALL' })
      
      // The phone numbers might contain special chars in original label
      expect(options.some(opt => opt.value === '7890')).toBe(true)
      expect(options.some(opt => opt.value === '2222')).toBe(true)
      
      const group7890 = options.find(opt => opt.value === '7890')
      expect(group7890?.label).toContain('****7890')
    })
  })

  describe('autoFillStatusBook', () => {
    it('should return existing status if provided', () => {
      expect(autoFillStatusBook('1 malam', 'AVAILABLE')).toBe('AVAILABLE')
    })

    it('should auto fill SOLD for malam', () => {
      expect(autoFillStatusBook('1 malam')).toBe('SOLD')
      expect(autoFillStatusBook('halfday malam')).toBe('SOLD')
    })

    it('should auto fill BOOKED for transit', () => {
      expect(autoFillStatusBook('transit')).toBe('BOOKED')
      expect(autoFillStatusBook('Transit 4 Jam')).toBe('BOOKED')
    })

    it('should return empty string for unknown durasi', () => {
      expect(autoFillStatusBook('unknown')).toBe('')
      expect(autoFillStatusBook('')).toBe('')
    })
  })
})
