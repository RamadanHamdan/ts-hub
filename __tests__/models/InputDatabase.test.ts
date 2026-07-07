import mongoose from 'mongoose'
import { InputDatabase } from '@/models/InputDatabase'

describe('InputDatabase Model', () => {
  it('should initialize with default values', () => {
    const input = new InputDatabase()
    
    expect(input.user_id).toBe('')
    expect(input.nama_admin).toBe('')
    expect(input.data_harga).toBe(0)
    expect(input.uang_masuk).toBe(0)
    expect(input.sisa_pembayaran).toBe(0)
    expect(input.created_at).toBeInstanceOf(Date)
    expect(input.updated_at).toBeInstanceOf(Date)
  })

  it('should accept valid inputs', () => {
    const input = new InputDatabase({
      user_id: 'admin1',
      nama_admin: 'Admin Test',
      tanggal_reservasi: '12/12/2024',
      nama_unit: 'TC.0507',
      data_harga: 500000,
      uang_masuk: 250000,
      sisa_pembayaran: 250000
    })

    const error = input.validateSync()
    expect(error).toBeUndefined()
    
    expect(input.user_id).toBe('admin1')
    expect(input.data_harga).toBe(500000)
    expect(input.sisa_pembayaran).toBe(250000)
  })
})
