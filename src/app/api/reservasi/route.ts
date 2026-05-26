import { NextResponse, NextRequest } from 'next/server'
import clientPromise from '@/lib/mongodb'

type ReservasiItem = {
  id: number
  user_id: number
  nama_tamu: string
  tanggal_reservasi: Date
  type_unit: string
  duration: string
  tanggal_checkin: Date
  tanggal_checkout: Date
  harga: number
  uang_masuk: number
  sisa_pembayaran: number
  note_pelunasan: string
  note_admin: string
  nama_apart: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validasi: pastikan body bukan object kosong
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'Invalid request body. Data reservasi harus diisi.' },
        { status: 400 },
      )
    }
    const client = await clientPromise

    const db = client.db('TSHUB')

    const col = db.collection('input_database')

    const now = new Date()
    const doc = {
      ...body,
      createdAt: now,
      updatedAt: now,
    }

    const result = await col.insertOne(doc)

    if (!result.insertedId) {
      return NextResponse.json(
        { error: 'Gagal menyimpan reservasi.' },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        message: 'Reservasi berhasil disimpan.',
        insertedId: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan koneksi.' },
      { status: 500 },
    )
  }
}
