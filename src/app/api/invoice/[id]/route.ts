import { NextResponse, NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import { InputDatabase } from '@/models/InputDatabase'
import mongoose from 'mongoose'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })
    }

    await connectDB()

    const reservasi = await InputDatabase.findById(id).lean()

    if (!reservasi) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ data: reservasi })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data' },
      { status: 500 }
    )
  }
}
