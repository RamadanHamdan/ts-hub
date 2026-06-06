import { Schema, model, models } from 'mongoose'

export interface IRoomStatusSnapshot {
  input_db_id: string
  tanggal_reservasi: string
  nama_unit: string
  status_unit: string
  status_book: string
  jam_ready: string
  keterangan: string
  updated_at: Date
}

const RoomStatusSnapshotSchema = new Schema<IRoomStatusSnapshot>(
  {
    input_db_id: { type: String, required: true, index: true },
    tanggal_reservasi: { type: String, required: true },
    nama_unit: { type: String, required: true },
    status_unit: { type: String, default: '' },
    status_book: { type: String, default: '' },
    jam_ready: { type: String, default: '' },
    keterangan: { type: String, default: '' },
    updated_at: { type: Date, default: Date.now },
  },
  {
    collection: 'room_status_snapshots',
  }
)

export const RoomStatusSnapshot =
  models.RoomStatusSnapshot || model<IRoomStatusSnapshot>('RoomStatusSnapshot', RoomStatusSnapshotSchema, 'room_status_snapshots')
