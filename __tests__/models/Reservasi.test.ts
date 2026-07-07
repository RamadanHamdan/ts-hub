import mongoose from 'mongoose'
import { Reservasi } from '@/models/Reservasi'

describe('Reservasi Model', () => {
  it('should create model instance correctly', () => {
    const reservasi = new Reservasi({
      id: 1,
      user_id: 100,
      nama_tamu: 'Test Tamu',
      type_unit: 'Studio',
      harga: 1000000
    })

    const error = reservasi.validateSync()
    expect(error).toBeUndefined()
    
    expect(reservasi.id).toBe(1)
    expect(reservasi.nama_tamu).toBe('Test Tamu')
    expect(reservasi.harga).toBe(1000000)
  })
})
