import { NextResponse , NextRequest } from 'next/server'
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
        const { header, items } = body

        if (!header || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'Invalid request body. "header" and "items" are required.' },
                { status: 400 }
            )
        }   
        const client = await clientPromise
        const db = client.db('TSHUB')
        const col = db.collection('Reservasi')

        const now = new Date()
        const docs = items.map((item: ReservasiItem) => ({
            ...item,
            createdAt: now,
            updatedAt: now
        }))
        const result = await col.insertMany(docs)

        return NextResponse.json(
            { message: ''}
        )
    }
