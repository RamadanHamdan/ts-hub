import {
  listTypeUnit,
  getUnitOptions,
  getApartOptions,
  getTypeOptions,
  getFasilitasOptions
} from '@/data/typeunit'

describe('typeunit data utils', () => {
  it('should export listTypeUnit with valid data', () => {
    expect(Array.isArray(listTypeUnit)).toBe(true)
    expect(listTypeUnit.length).toBeGreaterThan(0)
    expect(listTypeUnit[0]).toHaveProperty('unit')
    expect(listTypeUnit[0]).toHaveProperty('apartement')
    expect(listTypeUnit[0]).toHaveProperty('type')
  })

  describe('getUnitOptions', () => {
    it('should return options with default placeholder', () => {
      const options = getUnitOptions()
      expect(options[0]).toEqual({ value: '', label: '--Pilih Tipe Unit--' })
      expect(options.length).toBeGreaterThan(1)
    })
  })

  describe('getApartOptions', () => {
    it('should return all apartements when no unit selected', () => {
      const options = getApartOptions('')
      expect(options[0]).toEqual({ value: '', label: '--Pilih Apartemen--' })
      // Unique apartments (JARDIN, GAA)
      expect(options.length).toBeGreaterThan(2) 
    })

    it('should return specific apartement when unit is selected', () => {
      const options = getApartOptions('TC.0507') // JARDIN
      expect(options).toContainEqual({ value: 'JARDIN', label: 'JARDIN' })
    })
  })

  describe('getTypeOptions', () => {
    it('should return all types when no apartement selected', () => {
      const options = getTypeOptions('')
      expect(options[0]).toEqual({ value: '', label: '--Pilih Tipe--' })
      expect(options.length).toBeGreaterThan(2)
    })

    it('should return specific types for an apartement', () => {
      const options = getTypeOptions('GAA')
      // GAA only has Studio Type 25
      expect(options).toContainEqual({ value: 'Studio Type 25', label: 'Studio Type 25' })
      expect(options).not.toContainEqual({ value: 'Studio Type 33', label: 'Studio Type 33' })
    })
  })

  describe('getFasilitasOptions', () => {
    it('should return all fasilitas', () => {
      const options = getFasilitasOptions('')
      expect(options[0]).toEqual({ value: '', label: '--Pilih Fasilitas--' })
      expect(options.length).toBeGreaterThan(2)
    })
  })
})
