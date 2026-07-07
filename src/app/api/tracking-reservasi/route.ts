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

    // Durasi filter - normalize "Fullday" to match all "X Malam" patterns (except "Halfday Malam")
    if (durasiFilter) {
      const durations = durasiFilter.split(',').map((d) => d.trim()).filter(Boolean)
      if (durations.length > 0) {
        const durasiConditions: any[] = []
        const exactMatches: string[] = []

        for (const d of durations) {
          if (d.toLowerCase() === 'fullday') {
            // "Fullday" matches any durasi containing "malam" EXCEPT "halfday malam"
            durasiConditions.push({
              $and: [
                { data_durasi: { $regex: /malam/i } },
                { data_durasi: { $not: { $regex: /halfday/i } } }
              ]
            })
          } else {
            exactMatches.push(d)
          }
        }

        if (exactMatches.length > 0 && durasiConditions.length > 0) {
          filter.$or = [
            { data_durasi: { $in: exactMatches } },
            ...durasiConditions
          ]
        } else if (exactMatches.length > 0) {
          filter.data_durasi = { $in: exactMatches }
        } else if (durasiConditions.length > 0) {
          if (durasiConditions.length === 1) {
            Object.assign(filter, durasiConditions[0])
          } else {
            filter.$or = durasiConditions
          }
        }
      }
    }

    // Phone filter (last 4 digits)
    const phoneFilter = searchParams.get('phone') || ''
    if (phoneFilter) {
      // Match documents where nomor_telp_tamu ends with the given digits
      filter.nomor_telp_tamu = { $regex: new RegExp(`${phoneFilter.replace(/\D/g, '')}$`) }
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
      InputDatabase.distinct('data_durasi').then((rawDurasi: string[]) => {
        // Normalize durasi options: group "X Malam" (except "Halfday Malam") into "Fullday"
        const normalized = new Set<string>()
        for (const d of rawDurasi) {
          if (!d) continue
          const lower = d.toLowerCase()
          if (lower.includes('malam') && !lower.includes('halfday')) {
            normalized.add('Fullday')
          } else {
            normalized.add(d)
          }
        }
        return Array.from(normalized)
      }),
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
        const sumMonth = searchParams.get('sumMonth')
        const sumYear = searchParams.get('sumYear')
        const sumUnit = searchParams.get('sumUnit')
        const calStartDate = searchParams.get('calStartDate')
        const calEndDate = searchParams.get('calEndDate')
        
        let summaryFilter: any = {}
        
        if (sumUnit && sumUnit !== 'ALL') {
          summaryFilter.nama_unit = sumUnit
        }

        if (calStartDate && calEndDate) {
          const calStartObj = new Date(calStartDate);
          const thirtyDaysAgo = new Date(calStartObj);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 31);
          
          summaryFilter.$expr = { $and: [] }
          summaryFilter.$expr.$and.push({
            $gte: [
              { $dateFromString: { dateString: "$tanggal_reservasi", format: "%d/%m/%Y", onError: null } },
              thirtyDaysAgo
            ]
          })
          summaryFilter.$expr.$and.push({
            $lte: [
              { $dateFromString: { dateString: "$tanggal_reservasi", format: "%d/%m/%Y", onError: null } },
              new Date(`${calEndDate}T23:59:59.999Z`)
            ]
          })
        } else if (sumMonth && sumYear) {
          const padStr = (n: number | string) => n.toString().padStart(2, '0')
          summaryFilter.tanggal_reservasi = { $regex: new RegExp(`^\\d{1,2}/0?${parseInt(sumMonth, 10)}/${sumYear}$`) }
        } else {
          // If no month provided, default to baseFilter but calendar usually provides it
          summaryFilter = { ...baseFilter }
        }
        return RoomStatusSnapshot.aggregate([
          { $match: summaryFilter },
          {
            $lookup: {
              from: 'input_database',
              let: { dbId: { $toObjectId: '$input_db_id' } },
              pipeline: [
                { $match: { $expr: { $eq: ['$_id', '$$dbId'] } } },
                { $project: { data_durasi: 1, check_out: 1 } }
              ],
              as: 'inputDoc'
            }
          },
          { $unwind: { path: '$inputDoc', preserveNullAndEmptyArrays: true } },
          { 
            $group: { 
              _id: { 
                tanggal: '$tanggal_reservasi', 
                unit: '$nama_unit', 
                status: { $toUpper: '$status_unit' },
                status_book: { $toUpper: { $ifNull: ['$status_book', ''] } },
                durasi: { $toLower: { $ifNull: ['$inputDoc.data_durasi', ''] } },
                check_out: { $ifNull: ['$inputDoc.check_out', ''] }
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

    // Normalize durasi for category: "X Malam" (except "Halfday Malam") → "Fullday"
    const categoryMap = new Map<string, { unit: string; durasi: string; total: number }>()
    statsResult.forEach((item: { _id: { unit: string; durasi: string }; total: number }) => {
      const unit = item._id.unit || 'Unknown'
      const rawDurasi = item._id.durasi || 'Unknown'
      const itemTotal = item.total || 0

      // Normalize: if contains "malam" but not "halfday" → "Fullday"
      const lower = rawDurasi.toLowerCase()
      const normalizedDurasi = (lower.includes('malam') && !lower.includes('halfday'))
        ? 'Fullday'
        : rawDurasi

      pendapatanByUnitMap[unit] = (pendapatanByUnitMap[unit] || 0) + itemTotal
      totalPendapatan += itemTotal

      // Merge entries with the same unit + normalized durasi
      const key = `${unit}|||${normalizedDurasi}`
      const existing = categoryMap.get(key)
      if (existing) {
        existing.total += itemTotal
      } else {
        categoryMap.set(key, { unit, durasi: normalizedDurasi, total: itemTotal })
      }
    })

    const pendapatanByCategoryArr = Array.from(categoryMap.values())
      .sort((a: { total: number }, b: { total: number }) => b.total - a.total)

    const pendapatanByUnitArr = Object.entries(pendapatanByUnitMap)
      .map(([unit, total]) => ({ unit, total }))
      .sort((a, b) => b.total - a.total)

    const statusSummary: Array<{ tanggal: string, unit: string, status: string, status_book: string, durasi: string, check_out: string, total: number }> = []
    statusCountsAgg.forEach((item: any) => {
      if (item._id) {
        statusSummary.push({
          tanggal: item._id.tanggal || '-',
          unit: item._id.unit || '-',
          status: item._id.status || '',
          status_book: item._id.status_book || '',
          durasi: item._id.durasi || '',
          check_out: item._id.check_out || '',
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
