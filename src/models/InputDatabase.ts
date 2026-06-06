import { Schema, model, models } from 'mongoose'

export interface IInputDatabase {
  user_id: string
  nama_admin: string
  tanggal_reservasi: string
  nama_unit: string
  data_durasi: string
  check_in: string
  check_out: string
  data_harga: number
  uang_masuk: number
  sisa_pembayaran: number
  note_pelunasan: string
  note_admin: string
  nama_apart: string
  nama_tamu: string
  nomor_telp_tamu: string
  created_at: Date
  updated_at: Date
}

const InputDatabaseSchema = new Schema<IInputDatabase>(
  {
    user_id: { type: String, default: '' },
    nama_admin: { type: String, default: '' },
    tanggal_reservasi: { type: String, default: '', index: true },
    nama_unit: { type: String, default: '', index: true },
    data_durasi: { type: String, default: '', index: true },
    check_in: { type: String, default: '' },
    check_out: { type: String, default: '' },
    data_harga: { type: Number, default: 0 },
    uang_masuk: { type: Number, default: 0 },
    sisa_pembayaran: { type: Number, default: 0 },
    note_pelunasan: { type: String, default: '' },
    note_admin: { type: String, default: '' },
    nama_apart: { type: String, default: '' },
    nama_tamu: { type: String, default: '' },
    nomor_telp_tamu: { type: String, default: '' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    // Don't add timestamps since we manage created_at/updated_at manually
    collection: 'input_database',
  },
)

export const InputDatabase =
  models.InputDatabase || model<IInputDatabase>('InputDatabase', InputDatabaseSchema, 'input_database')
