import { NextResponse, NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import { InputDatabase } from '@/models/InputDatabase'
import { RoomStatusSnapshot } from '@/models/RoomStatusSnapshot'

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { _id, status_unit, status_book, jam_ready, keterangan } = body

    if (!_id) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    await connectDB()

    // 1. Get the original document to fetch its date and unit
    const originalDoc = await InputDatabase.findById(_id).lean()
    
    if (!originalDoc) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
    }

    // 2. Upsert the status to the new collection
    const snapshotDoc = await RoomStatusSnapshot.findOneAndUpdate(
      { input_db_id: _id.toString() },
      {
        $set: {
          tanggal_reservasi: originalDoc.tanggal_reservasi,
          nama_unit: originalDoc.nama_unit,
          status_unit,
          status_book,
          jam_ready,
          keterangan,
          updated_at: new Date()
        }
      },
      { new: true, upsert: true }
    ).lean()

    // 3. Format the response by merging the original document with the snapshot
    const row = {
      _id: originalDoc._id.toString(),
      kode: originalDoc._id.toString().slice(-8).toUpperCase(),
      nama_tamu: originalDoc.nama_tamu || '-',
      tanggal_reservasi: originalDoc.tanggal_reservasi || '-',
      unit: originalDoc.nama_unit || '-',
      status_unit: snapshotDoc.status_unit || '',
      status_book: snapshotDoc.status_book || '',
      durasi: originalDoc.data_durasi || '-',
      checkin_checkout: `${originalDoc.check_in || '-'} - ${originalDoc.check_out || '-'}`,
      harga: formatRupiah(originalDoc.data_harga),
      harga_raw: originalDoc.data_harga || 0,
      masuk: formatRupiah(originalDoc.uang_masuk),
      masuk_raw: originalDoc.uang_masuk || 0,
      sisa: formatRupiah(originalDoc.sisa_pembayaran),
      apart: originalDoc.nama_apart || '-',
      nama_admin: originalDoc.nama_admin || '-',
      note_pelunasan: originalDoc.note_pelunasan || '-',
      note_admin: originalDoc.note_admin || '-',
      nomor_telp: originalDoc.nomor_telp_tamu || '-',
      created_at: originalDoc.created_at || null,
      updated_at: originalDoc.updated_at || null,
    }

    return NextResponse.json({ row })
  } catch (error) {
    console.error('Update status error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memperbarui status.' },
      { status: 500 }
    )
  }
}

// Helper: format number to Rupiah
function formatRupiah(value: number | string | undefined): string {
  const num = typeof value === 'string' ? parseInt(value.replace(/\D/g, ''), 10) : Number(value)
  if (!num && num !== 0) return 'Rp 0'
  return 'Rp ' + num.toLocaleString('id-ID')
}
