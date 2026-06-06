import { NextResponse, NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongoose'
import { InputDatabase } from '@/models/InputDatabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const unitFilter = searchParams.get('unit') || ''
    const durasiFilter = searchParams.get('durasi') || ''
    const period = searchParams.get('period') || 'all_time' // hari | minggu | bulan | all_time

    await connectDB()

    // Build filter query
    const filter: Record<string, any> = {}

    // Date filter logic
    if (startDate || endDate) {
      filter.$expr = { $and: [] }
      if (startDate) {
        filter.$expr.$and.push({
          $gte: [
            { $dateFromString: { dateString: "$tanggal_reservasi", format: "%d/%m/%Y", onError: null } },
            new Date(startDate)
          ]
        })
      }
      if (endDate) {
        filter.$expr.$and.push({
          $lte: [
            { $dateFromString: { dateString: "$tanggal_reservasi", format: "%d/%m/%Y", onError: null } },
            new Date(`${endDate}T23:59:59.999Z`)
          ]
        })
      }
    } else {
      // Period presets (Hari, Minggu, Bulan, Semua Waktu)
      const today = new Date()
      const d = today.getDate()
      const m = today.getMonth() + 1
      const y = today.getFullYear()

      if (period === 'hari') {
        const padStr = (n: number) => n.toString().padStart(2, '0')
        const padded = `${padStr(d)}/${padStr(m)}/${y}`
        const unpadded = `${d}/${m}/${y}`
        filter.tanggal_reservasi = { $in: [padded, unpadded] }
      } else if (period === 'minggu') {
        // Generate the dates for the current week (Monday-Sunday)
        const dayOfWeek = today.getDay() || 7 // 1=Mon, 7=Sun
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - dayOfWeek + 1)

        const weekDates = []
        for (let i = 0; i < 7; i++) {
          const wd = new Date(startOfWeek)
          wd.setDate(startOfWeek.getDate() + i)
          const dNum = wd.getDate()
          const mNum = wd.getMonth() + 1
          const yNum = wd.getFullYear()
          const padStr = (n: number) => n.toString().padStart(2, '0')
          
          weekDates.push(`${dNum}/${mNum}/${yNum}`)
          weekDates.push(`${padStr(dNum)}/${padStr(mNum)}/${yNum}`)
        }
        filter.tanggal_reservasi = { $in: weekDates }
      } else if (period === 'bulan') {
        const padStr = (n: number) => n.toString().padStart(2, '0')
        // Regex to match any day in the current month/year (supports padded and unpadded month)
        filter.tanggal_reservasi = { $regex: new RegExp(`^\\d{1,2}/0?${m}/${y}$`) }
      }
      // if 'all_time', we don't set tanggal_reservasi filter
    }

    const baseFilter = { ...filter };

    // Unit filter
    if (unitFilter) {
      const units = unitFilter.split(',').map((u) => u.trim()).filter(Boolean)
      if (units.length > 0) {
        filter.nama_unit = { $in: units }
      }
    }

    // Durasi filter
    if (durasiFilter) {
      const durations = durasiFilter.split(',').map((d) => d.trim()).filter(Boolean)
      if (durations.length > 0) {
        filter.data_durasi = { $in: durations }
      }
    }

    const skip = (page - 1) * limit
    const statusUnitFilter = searchParams.get('statusUnit') || ''

    const { RoomStatusSnapshot } = await import('@/models/RoomStatusSnapshot');

    const [unpaginatedTotal, rawRowsQuery, unitOptions, durasiOptions, hariOptions, statsResult, statusCountsAgg] = await Promise.all([
      InputDatabase.countDocuments(filter),
      // If statusUnitFilter is present, we must fetch ALL matching docs to filter in memory
      InputDatabase
        .find(filter)
        .sort({ created_at: -1 })
        .skip(statusUnitFilter ? 0 : skip)
        .limit(statusUnitFilter ? 0 : limit)
        .lean(),
      InputDatabase.distinct('nama_unit'),
      InputDatabase.distinct('data_durasi'),
      InputDatabase.distinct('tanggal_reservasi'),
      InputDatabase.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { unit: '$nama_unit', durasi: '$data_durasi' },
            total: { $sum: { $ifNull: ['$data_harga', 0] } },
          },
        },
      ]),
      (() => {
        const sumDate = searchParams.get('sumDate')
        let summaryFilter: any = {}
        if (sumDate) {
          const [y, m, d] = sumDate.split('-')
          const padded = `${d}/${m}/${y}`
          const unpadded = `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`
          summaryFilter.tanggal_reservasi = { $in: [padded, unpadded] }
        } else {
          summaryFilter = { ...baseFilter }
        }
        return RoomStatusSnapshot.aggregate([
          { $match: summaryFilter },
          { 
            $group: { 
              _id: { 
                tanggal: '$tanggal_reservasi', 
                unit: '$nama_unit', 
                status: { $toUpper: '$status_unit' } 
              }, 
              count: { $sum: 1 } 
            } 
          },
          { $sort: { "_id.tanggal": -1, "_id.unit": 1 } }
        ])
      })()
    ])

    // Fetch snapshots for the retrieved rows
    const { listTypeUnit } = await import('@/data/typeunit');
    const rowIds = rawRowsQuery.map(r => r._id.toString())
    const snapshots = await RoomStatusSnapshot.find({ input_db_id: { $in: rowIds } }).lean()
    
    const snapshotMap = new Map()
    snapshots.forEach((snap: any) => {
      snapshotMap.set(snap.input_db_id, snap)
    })

    // Map rows to frontend format
    let rows = rawRowsQuery.map((doc) => {
      const snap = snapshotMap.get(doc._id.toString())
      const unitData = listTypeUnit.find(u => u.unit === doc.nama_unit)
      return {
        _id: doc._id.toString(),
        kode: doc._id.toString().slice(-8).toUpperCase(),
        nama_tamu: doc.nama_tamu || '-',
        tanggal_reservasi: doc.tanggal_reservasi || '-',
        unit: doc.nama_unit || '-',
        status_unit: snap ? snap.status_unit : '',
        status_book: snap ? snap.status_book : '',
        jam_ready: snap ? snap.jam_ready : '',
        keterangan: snap ? snap.keterangan : '',
        fasilitas_view: unitData ? unitData.fasilitas : '-',
        durasi: doc.data_durasi || '-',
        checkin_checkout: `${doc.check_in || '-'} - ${doc.check_out || '-'}`,
        harga: formatRupiah(doc.data_harga),
        harga_raw: doc.data_harga || 0,
        uang_masuk: formatRupiah(doc.uang_masuk),
        masuk_raw: doc.uang_masuk || 0,
        sisa: formatRupiah(doc.sisa_pembayaran),
        apart: doc.nama_apart || '-',
        nama_admin: doc.nama_admin || '-',
        note_pelunasan: doc.note_pelunasan || '-',
        note_admin: doc.note_admin || '-',
        nomor_telp: doc.nomor_telp_tamu || '-',
        created_at: doc.created_at || null,
        updated_at: doc.updated_at || null,
      };
    })

    let total = unpaginatedTotal;
    // Apply statusUnitFilter in memory if present
    if (statusUnitFilter) {
      const targetStatus = statusUnitFilter.trim().toUpperCase();
      rows = rows.filter(r => r.status_unit.trim().toUpperCase() === targetStatus)
      total = rows.length
      // Apply pagination manually
      rows = rows.slice(skip, skip + limit)
    }

    // Build stats from aggregation result
    const pendapatanByUnitMap: Record<string, number> = {}
    let totalPendapatan = 0

    const pendapatanByCategoryArr = statsResult
      .map((item: { _id: { unit: string; durasi: string }; total: number }) => {
        const unit = item._id.unit || 'Unknown'
        const durasi = item._id.durasi || 'Unknown'
        const itemTotal = item.total || 0

        pendapatanByUnitMap[unit] = (pendapatanByUnitMap[unit] || 0) + itemTotal
        totalPendapatan += itemTotal

        return { unit, durasi, total: itemTotal }
      })
      .sort((a: { total: number }, b: { total: number }) => b.total - a.total)

    const pendapatanByUnitArr = Object.entries(pendapatanByUnitMap)
      .map(([unit, total]) => ({ unit, total }))
      .sort((a, b) => b.total - a.total)

    const statusSummary: Array<{ tanggal: string, unit: string, status: string, total: number }> = []
    statusCountsAgg.forEach((item: any) => {
      if (item._id && item._id.status) {
        statusSummary.push({
          tanggal: item._id.tanggal || '-',
          unit: item._id.unit || '-',
          status: item._id.status,
          total: item.count || 1
        })
      }
    })

    return NextResponse.json({
      rows,
      total,
      page,
      limit,
      filterOptions: {
        hari: hariOptions.filter(Boolean).sort(),
        unit: unitOptions.filter(Boolean).sort(),
        durasi: durasiOptions.filter(Boolean).sort(),
      },
      stats: {
        pendapatanByUnit: pendapatanByUnitArr,
        pendapatanByCategory: pendapatanByCategoryArr,
        totalPendapatan,
        totalPendapatanCategory: totalPendapatan,
        statusSummary,
      },
    })
  } catch (error) {
    console.error('Tracking reservasi error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data tracking.' },
      { status: 500 },
    )
  }
}

// Helper: format number to Rupiah
function formatRupiah(value: number | string | undefined): string {
  const num = typeof value === 'string' ? parseInt(value.replace(/\D/g, ''), 10) : Number(value)
  if (!num && num !== 0) return 'Rp 0'
  return 'Rp ' + num.toLocaleString('id-ID')
}

// Helper: convert "YYYY-MM-DD" to "d/M/yyyy" for comparison with stored format
function formatDateToLocalString(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`
}
