import mongoose from 'mongoose'
import { RoomStatusSnapshot } from '@/models/RoomStatusSnapshot'

describe('RoomStatusSnapshot Model', () => {
  it('should initialize with default values', () => {
    const snapshot = new RoomStatusSnapshot({
      input_db_id: 'db_1',
      tanggal_reservasi: '01/01/2024',
      nama_unit: 'TC.0507'
    })
    
    expect(snapshot.input_db_id).toBe('db_1')
    expect(snapshot.status_unit).toBe('')
    expect(snapshot.status_book).toBe('')
    expect(snapshot.jam_ready).toBe('')
    expect(snapshot.keterangan).toBe('')
    expect(snapshot.updated_at).toBeInstanceOf(Date)
  })

  it('should be invalid if required fields are missing', () => {
    const snapshot = new RoomStatusSnapshot({
      tanggal_reservasi: '01/01/2024'
    })

    const error = snapshot.validateSync()
    expect(error).toBeDefined()
    expect(error?.errors['input_db_id']).toBeDefined()
    expect(error?.errors['nama_unit']).toBeDefined()
  })
})
