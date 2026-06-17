import { NextResponse, NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import { InputDatabase } from '@/models/InputDatabase'
import { RoomStatusSnapshot } from '@/models/RoomStatusSnapshot'

type ReservasiItem = {
  id: number
  user_id: number
  nama_tamu: string
  no_tamu: string
  tanggal_reservasi: Date
  nama_unit: string
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
    const { header, items } = body

    // Validasi: pastikan body bukan object kosong
    if (!header || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Payload tidak valid: header atau items kosong' },
        { status: 400 },
      )
    }

    await connectDB()

    const now = new Date()
    const docs = items.map((item: ReservasiItem) => ({
      user_id: header.userId || "",
      nama_admin: header.namaAdmin || "",
      tanggal_reservasi: header.tanggalReservasi || "",
      nama_unit: header.namaUnit || "",
      data_durasi: header.dataDuration || "",
      check_in: header.checkIn || "",
      check_out: header.checkOut || "",
      data_harga: Number(header.dataHarga) || 0,
      uang_masuk: Number(header.uangMasuk) || 0,
      sisa_pembayaran: Number(header.sisaPembayaran) || 0,
      note_pelunasan: header.notePelunasan || "",
      note_admin: header.noteAdmin || "",
      nama_apart: header.namaApart || "",
      // data tamu
      nama_tamu: item.nama_tamu || "",
      nomor_telp_tamu: item.no_tamu || "",
      // Metadata
      created_at: now,
      updated_at: now,
    }))

    const result = await InputDatabase.insertMany(docs)

    if (!result.length) {
      return NextResponse.json(
        { error: 'Gagal menyimpan reservasi.' },
        { status: 500 },
      )
    }

    // ✅ Auto-create RoomStatusSnapshot with status_book derived from durasi
    const snapshotDocs = result.map((doc) => {
      const durasi = (doc.data_durasi || '').toLowerCase()
      let autoStatusBook = ''
      let autoStatusUnit = ''

      if (durasi.includes('malam')) {
        autoStatusBook = 'SOLD'
        autoStatusUnit = 'BELUM CHECK IN'
      } else if (durasi.includes('transit')) {
        // autoStatusBook = 'BOOKED'
        autoStatusUnit = 'BELUM CHECK IN'
      }

      return {
        input_db_id: doc._id.toString(),
        tanggal_reservasi: doc.tanggal_reservasi,
        nama_unit: doc.nama_unit,
        status_unit: autoStatusUnit,
        status_book: autoStatusBook,
        jam_ready: '',
        keterangan: '',
        updated_at: new Date(),
      }
    })

    await RoomStatusSnapshot.insertMany(snapshotDocs)

    // Build insertedIds map similar to native driver response
    const insertedIds: Record<number, string> = {}
    result.forEach((doc, idx) => {
      insertedIds[idx] = doc._id.toString()
    })

    return NextResponse.json(
      {
        message: 'Reservasi berhasil disimpan.',
        insertedCount: result.length,
        insertedIds,
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const phone = searchParams.get('phone') || ''

    if (!phone || phone.length < 3) {
      return NextResponse.json({ data: [] })
    }

    await connectDB()

    const results = await InputDatabase.aggregate([
      {
        $match: {
          nomor_telp_tamu: { $regex: phone, $options: 'i' }
        }
      },
      {
        $group: {
          _id: '$nomor_telp_tamu',
          nama_tamu: { $first: '$nama_tamu' }
        }
      },
      {
        $project: {
          _id: 0,
          telp: '$_id',
          nama: '$nama_tamu'
        }
      },
      {
        $limit: 10
      }
    ])

    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('Error fetching phone predictions:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data.' },
      { status: 500 },
    )
  }
}

