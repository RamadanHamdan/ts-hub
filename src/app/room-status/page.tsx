'use client'

import { useSession } from '@/components/session/SessionProvider'
import { useRouter } from 'next/router'
import React from 'react'
import { useState, useEffect } from 'react'
import { getGreeting, getGreetingEmoji } from '@/lib/greeting'
import SearchableSelect from '@/components/ui/SearchableSelect'
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    TrendingUp,
    ChevronDown
} from 'lucide-react'
import { cn } from 'lib/utils'
import { getUnitOptions, getApartOptions, getTypeOptions } from '@/data/typeunit'

const STATUS_BOOK_OPTIONS = ["BOOKED", "AVAILABLE", "SOLD", "MAINTENANCE"];
const STATUS_UNIT_OPTIONS = ["TERISI", "READY", "CLEANING", "BOOKED", "SOLD", "CHECKOUT", "MAINTENANCE"];

type TrackingStatusRow = {
    _id: string
    kode: string
    nama_apart: string
    apart: string
    type_unit: string
    status_unit: string
    status_book: string
    nama_tamu: string
    tanggal_reservasi: string
    unit: string
    durasi: string
    checkin_checkout: string
    harga: string
    jam_ready: string
    fasilitas_view: string
}

type FilterOptions = {
    hari: string[]
    unit: string[]
    durasi: string[]
}
const BULAN_NAMES: Record<string, string> = {
    '1': 'Jan', '01': 'Jan',
    '2': 'Feb', '02': 'Feb',
    '3': 'Mar', '03': 'Mar',
    '4': 'Apr', '04': 'Apr',
    '5': 'May', '05': 'May',
    '6': 'Jun', '06': 'Jun',
    '7': 'Jul', '07': 'Jul',
    '8': 'Aug', '08': 'Aug',
    '9': 'Sep', '09': 'Sep',
    '10': 'Oct',
    '11': 'Nov',
    '12': 'Dec',
}

function formatBulan(val: string): string {
    if (!val) return val;
    // val is usually "d/m/yyyy" or "dd/mm/yyyy"
    const parts = val.split('/');
    if (parts.length === 3) {
        const d = parts[0].padStart(2, '0');
        const m = parts[1];
        const y = parts[2];
        return `${d}-${BULAN_NAMES[m] ?? m}-${y}`;
    }
    // Fallback if it's yyyy-mm-dd
    const partsDash = val.split('-');
    if (partsDash.length >= 2) {
        const yyyy = partsDash[0];
        const mm = partsDash[1];
        const dd = partsDash[2] || '';
        return dd ? `${dd}-${BULAN_NAMES[mm] ?? mm}-${yyyy}` : `${BULAN_NAMES[mm] ?? mm}-${yyyy}`;
    }
    return val;
}

export default function RoomStatusPage() {
    const { user, loading } = useSession()
    const [unit, setUnit] = useState<string[]>([])
    const [durasi, setDurasi] = useState<string[]>([])
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [jamReady, setJamReady] = useState('')
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    // filter states
    const [fUnit, setFUnit] = useState<string>("ALL")
    const [fDurasi, setFDurasi] = useState<string>("ALL")
    const [fStart, setFStart] = useState<string>('')
    const [fEnd, setFEnd] = useState<string>('')
    const [fJamReady, setFJamReady] = useState<string>("ALL")
    const [fStatusBook, setFStatusBook] = useState<string>("ALL")
    const [fStatusUnit, setFStatusUnit] = useState<string>("ALL")
    const [fApartement, setFApartement] = useState<string>("ALL")
    const [fStatusRoom, setFStatusRoom] = useState<string>("ALL")
    const [fType, setFType] = useState<string>("ALL")
    const [page, setPage] = useState<number>(1)

    // const [reservasiHariIni, setReservasiHariIni] = useState<number>(0)
    const [reservasiBulanIni, setReservasiBulanIni] = useState<number>(0)
    const [reservasiTotal, setReservasiTotal] = useState<number>(0)
    const [reservasiCancel, setReservasiCancel] = useState<number>(0)
    const [reservasiComingSoon, setReservasiComingSoon] = useState<number>(0)
    const [reservasiCheckin, setReservasiCheckin] = useState<number>(0)
    const [reservasiCheckout, setReservasiCheckout] = useState<number>(0)

    // dropdown meta

    const [unitOptions, setUnitOptions] = useState<string[]>([])
    const [durasiOptions, setDurasiOptions] = useState<string[]>([])
    const [statusUnitOptions, setStatusUnitOptions] = useState<string[]>([])
    const [statusBookOptions, setStatusBookOptions] = useState<string[]>([])
    const [statusRoomOptions, setStatusRoomOptions] = useState<string[]>([])
    const [jamReadyOptions, setJamReadyOptions] = useState<string[]>([])
    const [apartementOptions, setApartementOptions] = useState<string[]>([])

    const onChangeFilter = (fn: (v: string) => void, v: string) => {
        fn(v);
        setSelected(null);
        setPage(1);
    };
    const [selected, setSelected] = useState<TrackingStatusRow | null>(null);

    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        hari: [],
        unit: [],
        durasi: []
    })

    const [rows, setRows] = useState<TrackingStatusRow[]>([])
    const [total, setTotal] = useState(0)
    const [loadingRows, setLoadingRows] = useState(true)
    const [statusSummary, setStatusSummary] = useState<Array<{ tanggal: string, unit: string, status: string, total: number }>>([])
    const [summaryPage, setSummaryPage] = useState(1)
    const [sumFilterDate, setSumFilterDate] = useState(() => {
        const local = new Date();
        local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
        return local.toJSON().slice(0,10);
    })
    const [sumFilterUnit, setSumFilterUnit] = useState('ALL')
    const [sumFilterStatus, setSumFilterStatus] = useState('ALL')
    const summaryLimit = 5
    const [limit, setLimit] = useState(20)

    const filteredStatusSummary = statusSummary.filter(item => {
        const matchUnit = sumFilterUnit === 'ALL' || item.unit === sumFilterUnit;
        const matchStatus = sumFilterStatus === 'ALL' || item.status === sumFilterStatus;
        return matchUnit && matchStatus;
    });

    const totalSummaryPages = Math.ceil(filteredStatusSummary.length / summaryLimit)
    const paginatedSummary = filteredStatusSummary.slice((summaryPage - 1) * summaryLimit, summaryPage * summaryLimit)


    // Data fetching logic
    const fetchData = React.useCallback(async () => {
        setLoadingRows(true)
        try {
            const params = new URLSearchParams()
            params.set('page', String(page))
            params.set('limit', String(limit))
            if (sumFilterDate) params.set('sumDate', sumFilterDate)

            // For room status, if no dates are selected, we might want to default to today,
            // or just let it fetch everything. We'll pass the manual dates.
            if (fStart) params.set('startDate', fStart)
            if (fEnd) params.set('endDate', fEnd)
            if (fUnit && fUnit !== 'ALL') params.set('unit', fUnit)
            if (fDurasi && fDurasi !== 'ALL') params.set('durasi', fDurasi)
            if (fStatusUnit && fStatusUnit !== 'ALL') params.set('statusUnit', fStatusUnit)
            if (fApartement && fApartement !== 'ALL') params.set('apartement', fApartement)
            if (fType && fType !== 'ALL') params.set('type', fType)

            const res = await fetch(`/api/tracking-reservasi?${params.toString()}`)
            if (!res.ok) throw new Error('Fetch failed')

            const data = await res.json()
            setRows(data.rows || [])
            setTotal(data.total || 0)

            if (data.stats?.statusSummary) {
                setStatusSummary(data.stats.statusSummary)
            }

            // Only update dropdown options if they are empty so we don't reset the user's selection
            if (unitOptions.length === 0) {
                setUnitOptions(data.filterOptions?.unit || [])
            }
            if (durasiOptions.length === 0) {
                setDurasiOptions(data.filterOptions?.durasi || [])
            }
        } catch (err) {
            console.error('Error fetching room status data:', err)
            setRows([])
            setTotal(0)
        } finally {
            setLoadingRows(false)
        }
    }, [page, limit, sumFilterDate, fStart, fEnd, fUnit, fDurasi, fStatusUnit, fApartement, fType, unitOptions.length, durasiOptions.length])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    if (!user) return null

    const roleLabel =
        user.role === 'super_admin'
            ? 'Super Admin'
            : user.role === 'admin'
                ? 'Admin'
                : 'User'


    return (
        <div className='p-6 lg:p-8 space-y-8'>
            {/* Welcome Header */}
            <div className='space-y-2'>
                <h1 className='text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white'>
                    {getGreetingEmoji()} {getGreeting(user.fullName)}
                </h1>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    Anda login sebagai{' '}
                    <span className='font-semibold text-blue-600'>
                        {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                </p>
            </div>

            {/* Summary Cards */}
            <div className='bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700'>
                <h2 className='text-lg font-bold mb-4 text-gray-800 dark:text-white'>Summary Status Unit</h2>

                {/* Summary Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <FilterDate
                        label="TANGGAL RESERVASI"
                        value={sumFilterDate}
                        onChange={(v) => { setSumFilterDate(v); setSummaryPage(1); }}
                    />
                    <FilterSelect
                        label="UNIT"
                        value={sumFilterUnit}
                        onChange={(v) => { setSumFilterUnit(v); setSummaryPage(1); }}
                        options={[{ label: "Semua Unit", value: "ALL" }].concat(
                            Array.from(new Set(statusSummary.map(s => s.unit))).sort().map(opt => ({ label: opt, value: opt }))
                        )}
                        full
                    />
                    <FilterSelect
                        label="STATUS UNIT"
                        value={sumFilterStatus}
                        onChange={(v) => { setSumFilterStatus(v); setSummaryPage(1); }}
                        options={[{ label: "Semua Status Unit", value: "ALL" }].concat(
                            Array.from(new Set(statusSummary.map(s => s.status))).sort().map(opt => ({ label: opt, value: opt }))
                        )}
                        full
                    />
                </div>

                <div className='overflow-x-auto max-h-[350px] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700'>
                    <table className='w-full text-left text-sm whitespace-nowrap'>
                        <thead className='bg-gray-50 dark:bg-gray-700 sticky top-0 z-10 shadow-sm'>
                            <tr className='border-b border-gray-200 dark:border-gray-700'>
                                <th className='py-3 px-4 font-semibold text-gray-600 dark:text-gray-300'>Tanggal Reservasi</th>
                                <th className='py-3 px-4 font-semibold text-gray-600 dark:text-gray-300'>Unit</th>
                                <th className='py-3 px-4 font-semibold text-gray-600 dark:text-gray-300'>Status Unit</th>
                                <th className='py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-center'>Total</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-100 dark:divide-gray-800'>
                            {paginatedSummary.length > 0 ? paginatedSummary.map((item, idx) => (
                                <tr key={idx} className='hover:bg-gray-50 dark:hover:bg-gray-700/50'>
                                    <td className='py-3 px-4 text-gray-800 dark:text-gray-200 font-medium'>{formatBulan(item.tanggal)}</td>
                                    <td className='py-3 px-4 text-gray-800 dark:text-gray-200 font-bold'>{item.unit}</td>
                                    <td className='py-3 px-4'>
                                        <span className={`px-3 py-1 rounded-md text-xs font-bold text-white ${item.status === 'SOLD' ? 'bg-red-500' :
                                                item.status === 'TERISI' ? 'bg-orange-500' :
                                                    item.status === 'READY' ? 'bg-green-500' :
                                                        item.status === 'MAINTENANCE' ? 'bg-yellow-500' :
                                                            item.status === 'CLEANING' ? 'bg-blue-500' : 'bg-gray-500'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className='py-3 px-4 text-center font-bold text-gray-800 dark:text-gray-200'>{item.total}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-6 text-gray-500 font-medium">Belum ada data status tersimpan di database.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {filteredStatusSummary.length > 0 && (
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
                        <span className="text-sm text-gray-500">
                            Menampilkan <span className="font-semibold text-gray-900 dark:text-white">{(summaryPage - 1) * summaryLimit + 1}</span> - <span className="font-semibold text-gray-900 dark:text-white">{Math.min(summaryPage * summaryLimit, filteredStatusSummary.length)}</span> dari <span className="font-semibold text-gray-900 dark:text-white">{filteredStatusSummary.length}</span> data
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSummaryPage(Math.max(1, summaryPage - 1))}
                                disabled={summaryPage === 1}
                                className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sebelumnya
                            </button>
                            <button
                                onClick={() => setSummaryPage(summaryPage + 1)}
                                disabled={summaryPage >= totalSummaryPages}
                                className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Info */}

            <div className='rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 shadow-sm mt-6'>
                <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                    Table Status
                </h2>
                <section className='bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 shadow-sm rounded-2xl'>
                    <div
                        className="md:hidden flex items-center justify-between cursor-pointer mb-2 bg-blue-50 p-4 rounded-xl border border-blue-100"
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                    >
                        <div className="flex items-center gap-2 font-extrabold text-[#0B6AA9]">
                            <span>{isFilterOpen ? "🔽" : "▶️"}</span>
                            <span>FILTER PENCARIAN</span>
                        </div>
                        <span className="text-sm font-bold text-[#0B6AA9] bg-white px-3 py-1 rounded-full shadow-sm">
                            {isFilterOpen ? "Tutup" : "Buka"}
                        </span>
                    </div>
                    <div
                        className={cn(
                            'grid grid-cols-1 gap-4 md:grid-cols-6 mt-4',
                            !isFilterOpen ? "hidden md:grid" : 'grid',
                        )}
                    >
                        <FilterDate
                            label="TANGGAL MULAI"
                            value={fStart}
                            onChange={(v) => onChangeFilter(setFStart, v)}
                        />
                        <FilterDate
                            label="TANGGAL AKHIR"
                            value={fEnd}
                            onChange={(v) => onChangeFilter(setFEnd, v)}
                        />

                        <div className="md:col-span-2">
                            <FilterSelect
                                label="JAM READY"
                                value={fJamReady}
                                onChange={(v) => onChangeFilter(setFJamReady, v)}
                                options={[{ label: "Semua Jam", value: "ALL" }].concat(
                                    jamReadyOptions.map((s) => ({ label: s, value: s })),
                                )}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <FilterSelect
                                label="UNIT"
                                value={fUnit}
                                onChange={(v) => onChangeFilter(setFUnit, v)}
                                options={getUnitOptions()}
                            />
                        </div>

                        <div className='md:col-span-2'>
                            <FilterSelect
                                label="APARTEMENT"
                                value={fApartement}
                                onChange={(v) => onChangeFilter(setFApartement, v)}
                                options={getApartOptions(fUnit === 'ALL' ? '' : fUnit)}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <FilterSelect
                                label="TYPE"
                                value={fType}
                                onChange={(v) => onChangeFilter(setFType, v)}
                                options={getTypeOptions(fApartement === 'ALL' ? '' : fApartement)}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <FilterSelect
                                label="STATUS UNIT"
                                value={fStatusUnit}
                                onChange={(v) => onChangeFilter(setFStatusUnit, v)}
                                options={[{ label: "Semua Status Unit", value: "ALL" }].concat(
                                    STATUS_UNIT_OPTIONS.map(opt => ({ label: opt, value: opt }))
                                )}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <FilterSelect
                                label="DURASI"
                                value={fDurasi}
                                onChange={(v) => onChangeFilter(setFDurasi, v)}
                                options={[{ label: "Semua Durasi", value: "ALL" }].concat(
                                    durasiOptions.map((s) => ({ label: s, value: s })),
                                )}
                            />
                        </div>
                    </div>
                </section>

                {/* Table Section */}
                <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead className="bg-gray-50/50 text-center items-center justify-between dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium">
                                <tr>
                                    {/* <th className="px-6 py-4 whitespace-nowrap">Tanggal Reservasi</th> */}
                                    <th className="px-6 py-4 whitespace-nowrap pr-15">Tanggal Reservasi</th>
                                    <th className="px-6 py-4 whitespace-nowrap pl-1">Unit</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Apartement</th>
                                    <th className="px-6 py-4 whitespace-nowrap pl-2">Status Unit</th>
                                    <th className="px-6 py-4 whitespace-nowrap pl-2">Status Book</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Keterangan</th>
                                    <th className="px-6 py-4 whitespace-nowrap pr-20">Fasilitas</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loadingRows ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                                                Memuat data...
                                            </div>
                                        </td>
                                    </tr>
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                                            Tidak ada data untuk filter yang dipilih
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row) => (
                                        <StatusRow
                                            key={row._id}
                                            row={row}
                                            onUpdate={(updated) => {
                                                setRows(prev => prev.map(r => r._id === updated._id ? updated : r))
                                                setStatusSummary(prev => {
                                                    const existingIndex = prev.findIndex(s => s.unit === updated.unit && s.tanggal === updated.tanggal_reservasi);
                                                    if (existingIndex >= 0) {
                                                        const newSummary = [...prev];
                                                        newSummary[existingIndex] = { ...newSummary[existingIndex], status: updated.status_unit };
                                                        return newSummary;
                                                    } else {
                                                        return [{
                                                            tanggal: updated.tanggal_reservasi,
                                                            unit: updated.unit,
                                                            status: updated.status_unit,
                                                            total: 1
                                                        }, ...prev];
                                                    }
                                                })
                                            }}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                            Menampilkan <span className="font-semibold text-gray-900 dark:text-white">{rows.length}</span> dari <span className="font-semibold text-gray-900 dark:text-white">{total}</span> data
                        </span>
                        <div className="flex gap-2 items-center">
                            <select
                                value={limit}
                                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                className="px-2 py-1 text-sm border rounded-lg hover:bg-gray-50 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white cursor-pointer mr-2 outline-none"
                            >
                                <option value={5}>5 Data</option>
                                <option value={10}>10 Data</option>
                                <option value={20}>20 Data</option>
                                <option value={50}>50 Data</option>
                                <option value={100}>100 Data</option>
                            </select>
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sebelumnya
                            </button>
                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={rows.length < limit}
                                className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FilterSelect({
    label,
    value,
    onChange,
    options,
    full,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: Array<{ label: string; value: string }>;
    full?: boolean;
}) {
    return (
        <div className={cn(full && "w-full")}>
            <div className="text-xs font-extrabold tracking-wider text-[#0B6AA9]">
                {label}
            </div>
            <div className="relative mt-2">
                <SearchableSelect
                    value={value}
                    onChange={(val: string) => onChange(val)}
                    options={options}
                    placeholder={`Pilih ${label}...`}
                    className="h-12 w-full appearance-none rounded-xl border-blue-200 border bg-white"
                />
            </div>
        </div>
    );
}

function FilterDate({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div>
            <div className="text-xs font-extrabold tracking-wider text-blue-600">
                {label}
            </div>
            <div className="relative mt-2">
                <input
                    type="date"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-12 w-full rounded-xl border border-blue-200 bg-white px-4 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
            </div>
        </div>
    );
}

function StatusRow({
    row,
    onUpdate
}: {
    row: TrackingStatusRow,
    onUpdate: (updatedRow: TrackingStatusRow) => void
}) {
    const [statusUnit, setStatusUnit] = useState(row.status_unit || '');
    const [statusBook, setStatusBook] = useState(row.status_book || '');
    const [jamReady, setJamReady] = useState(row.jam_ready || '');
    const [keterangan, setKeterangan] = useState(row.keterangan || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setStatusUnit(row.status_unit || '');
        setStatusBook(row.status_book || '');
        setJamReady(row.jam_ready || '');
        setKeterangan(row.keterangan || '');
    }, [row]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/tracking-reservasi/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    _id: row._id,
                    status_unit: statusUnit,
                    status_book: statusBook,
                    jam_ready: jamReady,
                    keterangan: keterangan
                })
            });
            if (!res.ok) throw new Error('Gagal menyimpan');
            const data = await res.json();
            if (data.row) {
                onUpdate(data.row);
            }
        } catch (err) {
            console.error(err);
            alert('Gagal menyimpan status');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{formatBulan(row.tanggal_reservasi)}</td>
            {/* <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                <input 
                    list={`jamReadyList-${row._id}`}
                    type="text" 
                    value={jamReady} 
                    onChange={(e) => setJamReady(e.target.value)} 
                    placeholder="Contoh: READY / CHECK IN JAM 21:00"
                    className="h-10 w-48 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <datalist id={`jamReadyList-${row._id}`}>
                    <option value="READY" />
                    <option value="SOLD" />
                </datalist>
            </td> */}
            <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {row.unit}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{row.apart}</td>

            <td className="px-6 py-4 whitespace-nowrap">
                <select
                    value={statusUnit}
                    onChange={e => setStatusUnit(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-md p-1.5 text-sm bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">- Pilih Status Unit -</option>
                    {STATUS_UNIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <select
                    value={statusBook}
                    onChange={e => setStatusBook(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-md p-1.5 text-sm bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">- Pilih Status Book -</option>
                    {STATUS_BOOK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900 dark:text-gray-100">
                <input
                    list={`keteranganList-${row._id}`}
                    type="text"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Contoh: Check Out Jam 12:00 Tgl 01"
                    className="h-10 w-56 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <datalist id={`keteranganList-${row._id}`}>
                    <option value="Check Out Jam 12:00 Tgl 01" />
                    <option value="READY" />
                </datalist>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-left text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                {row.fasilitas_view}
            </td>

            <td className="px-6 py-4 whitespace-nowrap text-right">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50 transition-colors shadow-sm"
                >
                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
            </td>
        </tr>
    );
}