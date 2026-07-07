'use client'

import { useSession } from '@/components/session/SessionProvider'
import React from 'react'
import { useState, useEffect } from 'react'
import { getGreeting, getGreetingEmoji } from '@/lib/greeting'
import SearchableSelect from '@/components/ui/SearchableSelect'
import {
    ChevronLeft,
    ChevronRight,
    EyeIcon,
    PenBox as LucidePenBox,
    X,
    CalendarDays,
} from 'lucide-react'
import { cn } from 'lib/utils'
import { getUnitOptions, listTypeUnit } from '@/data/typeunit'

const STATUS_BOOK_OPTIONS = ["BOOKED", "AVAILABLE", "SOLD", "MAINTENANCE", "CANCEL"];
const STATUS_UNIT_OPTIONS = ["BELUM CHECK IN", "READY", "CLEANING", "SOLD", "MAINTENANCE"];

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
    nama_admin: string
    keterangan: string
    nomor_telp: string
    note_pelunasan: string
    note_admin: string
    created_at: string | null
    updated_at: string | null
}

function DetailItem({
    icon,
    label,
    value,
}: {
    icon: string
    label: string
    value?: string
}) {
    return (
        <div className='flex items-start gap-2 min-w-0'>
            <span className='mt-[1px] shrink-0 text-sm leading-none'>{icon}</span>
            <div className='flex flex-col min-w-0'>
                <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5'>
                    {label}:
                </span>
                <span className='text-[11px] text-slate-700 dark:text-slate-200 font-medium'>
                    {value || '-'}
                </span>
            </div>
        </div>
    )
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


export default function TableStatusPage() {



    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [fStart, setFStart] = useState<string>('');
    const [fUnit, setFUnit] = useState<string>('');
    const [fEnd, setFEnd] = useState<string>('');
    const [selected, setSelected] = useState<TrackingStatusRow | null>(null);
    const [page, setPage] = useState<number>(1)
    const [fStatusUnit, setFStatusUnit] = useState<string>("ALL");
    const [fStatusBook, setFStatusBook] = useState<string>("ALL");
    const [fApartement, setFApartement] = useState<string>("ALL");
    const [fType, setFType] = useState<string>("ALL");
    const [fPhone, setFPhone] = useState<string>("ALL");
    const [fDurasi, setFDurasi] = useState<string>("ALL");

    const onChangeFilter = (fn: (v: string) => void, v: string) => {
        fn(v);
        setSelected(null);
        setPage(1);
    };
    const [rows, setRows] = useState<TrackingStatusRow[]>([])
    const [total, setTotal] = useState(0)
    const [loadingRows, setLoadingRows] = useState(true)
    const [limit, setLimit] = useState(20)
    const [phoneOptions, setPhoneOptions] = useState<{ label: string; value: string }[]>([])
    const [unitOptions, setUnitOptions] = useState<string[]>([])
    const [durasiOptions, setDurasiOptions] = useState<string[]>([])

    const [statusSummary, setStatusSummary] = useState<Array<{ tanggal: string, unit: string, status: string, status_book: string, durasi: string, check_out: string, total: number }>>([])

    const fetchData = React.useCallback(async () => {
        setLoadingRows(true)
        try {
            const params = new URLSearchParams()
            params.set('page', String(page))
            params.set('limit', String(limit))

            // For room status, if no dates are selected, we might want to default to today,
            // or just let it fetch everything. We'll pass the manual dates.
            if (fStart) params.set('startDate', fStart)
            if (fEnd) params.set('endDate', fEnd)
            if (fUnit && fUnit !== 'ALL') params.set('unit', fUnit)
            if (fDurasi && fDurasi !== 'ALL') params.set('durasi', fDurasi)
            if (fStatusUnit && fStatusUnit !== 'ALL') params.set('statusUnit', fStatusUnit)
            if (fApartement && fApartement !== 'ALL') params.set('apartement', fApartement)
            if (fType && fType !== 'ALL') params.set('type', fType)
            if (fPhone && fPhone !== 'ALL') params.set('phone', fPhone)

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

            // Build phone options from rows (last 4 digits)
            const allRows: TrackingStatusRow[] = data.rows || []
            const phoneMap = new Map<string, string>()
            allRows.forEach((r: TrackingStatusRow) => {
                const telp = (r.nomor_telp || '').replace(/\D/g, '')
                if (telp.length >= 4) {
                    const last4 = telp.slice(-4)
                    if (!phoneMap.has(last4)) {
                        phoneMap.set(last4, r.nomor_telp)
                    }
                }
            })
            const phoneOpts = [{ label: 'Semua No Telp', value: 'ALL' }]
            phoneMap.forEach((fullPhone, last4) => {
                phoneOpts.push({ label: `****${last4} (${fullPhone})`, value: last4 })
            })
            setPhoneOptions(phoneOpts)
        } catch (err) {
            console.error('Error fetching room status data:', err)
            setRows([])
            setTotal(0)
        } finally {
            setLoadingRows(false)
        }
    }, [page, limit, fStart, fEnd, fUnit, fDurasi, fStatusUnit, fApartement, fType, fPhone, unitOptions.length, durasiOptions.length])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    useEffect(() => {
        const channel = new BroadcastChannel('reservasi-updates');
        channel.onmessage = (event) => {
            if (event.data?.type === 'UPDATE') {
                fetchData();
            }
        };
        return () => channel.close();
    }, [fetchData])

    return (

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
                        onChange={(v) => {
                            onChangeFilter(setFStart, v);
                        }}
                        
                    />
                    <FilterDate
                        label="TANGGAL AKHIR"
                        value={fEnd}
                        onChange={(v) => {
                            onChangeFilter(setFEnd, v);
                        }}
                    />

                    <div className="md:col-span-2">
                        <FilterSelect
                            label="UNIT"
                            value={fUnit}
                            onChange={(v) => {
                                onChangeFilter(setFUnit, v);
                            }}
                            options={getUnitOptions()}
                        />
                    </div>

                    {/* <div className='md:col-span-2'>
                                    <FilterSelect
                                        label="APARTEMENT"
                                        value={fApartement}
                                        onChange={(v) => onChangeFilter(setFApartement, v)}
                                        options={getApartOptions(fUnit === 'ALL' ? '' : fUnit)}
                                    />
                                </div> */}

                    {/* <div className="md:col-span-2">
                                    <FilterSelect
                                        label="TYPE"
                                        value={fType}
                                        onChange={(v) => onChangeFilter(setFType, v)}
                                        options={getTypeOptions(fApartement === 'ALL' ? '' : fApartement)}
                                    />
                                </div> */}

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

                    {/* Phone Number Filter (last 4 digits) */}
                    <div className="md:col-span-2">
                        <div className="text-xs font-extrabold tracking-wider text-[#0B6AA9]">
                            NO TELP (4 DIGIT TERAKHIR)
                        </div>
                        <div className="relative mt-2">
                            <SearchableSelect
                                value={fPhone}
                                onChange={(val: string) => {
                                    onChangeFilter(setFPhone, val || 'ALL');
                                }}
                                options={phoneOptions}
                                placeholder='Cari 4 digit terakhir...'
                                className="h-12 w-full appearance-none rounded-xl border-blue-200 border bg-white"
                                isClearable
                            />
                        </div>
                    </div>

                    {/* <div className="md:col-span-2">
                                    <FilterSelect
                                        label="DURASI"
                                        value={fDurasi}
                                        onChange={(v) => onChangeFilter(setFDurasi, v)}
                                        options={[{ label: "Semua Durasi", value: "ALL" }].concat(
                                            durasiOptions.map((s) => ({ label: s, value: s })),
                                        )}
                                    />
                                </div> */}
                </div>
            </section>

            {/* Table Section */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto" style={{ overflowX: 'auto' }}>
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-gray-50/50 text-center items-center justify-between dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">Detail</th>
                                <th className="px-6 py-4 whitespace-nowrap pr-15">Tanggal Reservasi</th>
                                <th className="px-6 py-4 whitespace-nowrap pl-1">Unit</th>
                                <th className="px-6 py-4 whitespace-nowrap">Apartement</th>
                                <th className="px-6 py-4 whitespace-nowrap pl-2">Status Unit</th>
                                <th className="px-6 py-4 whitespace-nowrap pl-2">Status Book</th>
                                <th className="px-6 py-4 whitespace-nowrap pl-2">Durasi</th>
                                <th className="px-6 py-4 whitespace-nowrap pl-2">Check In - Check Out</th>
                                <th className="px-6 py-4 whitespace-nowrap pr-20">Inputed By</th>
                                <th className="px-6 py-4 whitespace-nowrap">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loadingRows ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                                            Memuat data...
                                        </div>
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                                        Tidak ada data untuk filter yang dipilih
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => (
                                    <StatusRow
                                        key={row._id}
                                        row={row}
                                        isSelected={selected?._id === row._id}
                                        onToggleDetail={() => setSelected(selected?._id === row._id ? null : row)}
                                        onUpdate={(updated) => {
                                            setRows(prev => prev.map(r => r._id === updated._id ? updated : r))
                                            setStatusSummary(prev => {
                                                const existingIndex = prev.findIndex(s => s.unit === updated.unit && s.tanggal === updated.tanggal_reservasi);
                                                if (existingIndex >= 0) {
                                                    const newSummary = [...prev];
                                                    newSummary[existingIndex] = {
                                                        ...newSummary[existingIndex],
                                                        status: updated.status_unit,
                                                        status_book: updated.status_book || ''
                                                    };
                                                    return newSummary;
                                                } else {
                                                    return [{
                                                        tanggal: updated.tanggal_reservasi,
                                                        unit: updated.unit,
                                                        status: updated.status_unit,
                                                        status_book: updated.status_book || '',
                                                        durasi: updated.durasi || '',
                                                        check_out: updated.checkin_checkout?.split('-')[1]?.trim() || '',
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
            <div className="text-xs font-extrabold tracking-wider text-[#0B6AA9] dark:text-blue-400">
                {label}
            </div>
            <div className="relative mt-2">
                <SearchableSelect
                    value={value}
                    onChange={(val: string) => onChange(val)}
                    options={options}
                    placeholder={`Pilih ${label}...`}
                    className="h-12 w-full appearance-none rounded-xl border-blue-200 dark:border-gray-600 border bg-white dark:bg-gray-700 dark:text-white"
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
            <div className="text-xs font-extrabold tracking-wider text-blue-600 dark:text-blue-400">
                {label}
            </div>
            <div className="relative mt-2">
                <input
                    type="date"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-12 w-full rounded-xl border text-black dark:text-white border-blue-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
            </div>
        </div>
    );
}

function StatusRow({
    row,
    isSelected,
    onToggleDetail,
    onUpdate
}: {
    row: TrackingStatusRow,
    isSelected: boolean,
    onToggleDetail: () => void,
    onUpdate: (updatedRow: TrackingStatusRow) => void
}) {
    const [statusUnit, setStatusUnit] = useState(row.status_unit || '');
    const [statusBook, setStatusBook] = useState(() => {
        if (row.status_book) return row.status_book;
        const durasi = (row.durasi || '').toLowerCase();
        if (durasi.includes('malam')) return 'SOLD';
        if (durasi.includes('transit')) return 'BOOKED';
        return '';
    });
    const [jamReady, setJamReady] = useState(row.jam_ready || '');
    const [keterangan, setKeterangan] = useState(row.keterangan || '');
    const [isSaving, setIsSaving] = useState(false);

    // Sync local state when the row prop changes (React recommended pattern:
    // "adjusting state during render" instead of useEffect to avoid cascading renders)
    // See: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
    const [prevRow, setPrevRow] = useState(row);
    if (prevRow !== row) {
        setPrevRow(row);
        setStatusUnit(row.status_unit || '');
        setJamReady(row.jam_ready || '');
        setKeterangan(row.keterangan || '');

        // Auto-fill status_book based on durasi if not already set
        if (!row.status_book) {
            const durasi = (row.durasi || '').toLowerCase();
            if (durasi.includes('malam')) {
                setStatusBook('SOLD');
            } else if (durasi.includes('transit')) {
                setStatusBook('BOOKED');
            } else {
                setStatusBook(row.status_book || '');
            }
        } else {
            setStatusBook(row.status_book || '');
        }
    }

    const handleSave = async (overrideStatusUnit?: string) => {
        setIsSaving(true);
        const finalStatusUnit = typeof overrideStatusUnit === 'string' ? overrideStatusUnit : statusUnit;
        try {
            const res = await fetch('/api/tracking-reservasi/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    _id: row._id,
                    status_unit: finalStatusUnit,
                    status_book: statusBook,
                    jam_ready: jamReady,
                    keterangan: keterangan
                })
            });
            if (!res.ok) throw new Error('Gagal menyimpan');
            const data = await res.json();
            if (data.row) {
                onUpdate(data.row);
                const channel = new BroadcastChannel('reservasi-updates');
                channel.postMessage({ type: 'UPDATE' });
                channel.close();
            }
        } catch (err) {
            console.error(err);
            alert('Gagal menyimpan status');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <React.Fragment>
            <tr className={cn(
                "transition-colors",
                isSelected
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
            )}>
                {/* Detail toggle button */}
                <td className="px-6 py-4 whitespace-nowrap">
                    <button
                        title='Lihat Detail'
                        onClick={onToggleDetail}
                        className={cn(
                            'inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-150 cursor-pointer',
                            isSelected
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-300'
                                : 'bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white',
                        )}
                    >
                        <EyeIcon size={14} strokeWidth={2.2} />
                    </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{formatBulan(row.tanggal_reservasi)}</td>
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
                        className="border border-gray-300 dark:border-gray-600 rounded-md p-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">- Pilih Status Unit -</option>
                        {STATUS_UNIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <select
                        value={statusBook}
                        onChange={e => setStatusBook(e.target.value)}
                        className={`border rounded-md p-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${statusBook === 'SOLD' ? 'border-red-400 bg-red-50 text-red-700 font-semibold' :
                            statusBook === 'BOOKED' ? 'border-amber-400 bg-amber-50 text-amber-700 font-semibold' :
                                'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                            }`}
                    >
                        <option value="">- Pilih Status Book -</option>
                        {STATUS_BOOK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    {(() => {
                        const durasi = (row.durasi || '').toLowerCase();
                        if (durasi.includes('malam') && !durasi.includes('halfday')) {
                            return <span className="ml-1 text-[10px] text-red-500 font-medium">● Auto: SOLD</span>;
                        } else if (durasi.includes('transit')) {
                            return <span className="ml-1 text-[10px] text-amber-500 font-medium">● Auto: BOOKED</span>;
                        }
                        return null;
                    })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{row.durasi}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{row.checkin_checkout}</td>
                <td className="px-6 py-4 whitespace-nowrap text-left pl-12 text-sm text-gray-600 dark:text-gray-300">
                    {row.nama_admin}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2 items-center">
                        {statusUnit === 'BELUM CHECK IN' && (
                            <button
                                onClick={() => {
                                    setStatusUnit('SOLD');
                                    handleSave('SOLD');
                                }}
                                disabled={isSaving}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50 transition-colors shadow-sm"
                            >
                                Check In
                            </button>
                        )}
                        {statusUnit === 'SOLD' && (
                            <button
                                onClick={() => {
                                    setStatusUnit('CLEANING');
                                    handleSave('CLEANING');
                                }}
                                disabled={isSaving}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50 transition-colors shadow-sm"
                            >
                                Check Out
                            </button>
                        )}
                        <button
                            onClick={() => handleSave()}
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {isSaving ? '...' : 'Simpan'}
                        </button>
                    </div>
                </td>
            </tr>

            {/* ═══ Detail Informasi Lengkap Panel ═══ */}
            {isSelected && (
                <tr className='bg-blue-50/30 dark:bg-blue-900/10'>
                    <td colSpan={10} className='px-4 py-3 border-b border-blue-100'>
                        <div className='rounded-xl bg-white dark:bg-gray-800 shadow-md ring-1 ring-blue-100 dark:ring-blue-800 overflow-hidden animate-in fade-in duration-200'>
                            {/* Header bar */}
                            <div className='flex items-center justify-between px-5 py-3 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/30 dark:to-gray-800 border-b border-blue-100 dark:border-blue-800'>
                                <div className='flex items-center gap-2'>
                                    <span className='grid h-6 w-6 place-items-center rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm'>
                                        ℹ
                                    </span>
                                    <span className='text-[13px] font-extrabold text-blue-700 dark:text-blue-300 tracking-tight'>
                                        Detail Informasi Lengkap
                                    </span>
                                </div>
                                <button
                                    onClick={onToggleDetail}
                                    className='inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 transition-all duration-150 cursor-pointer'
                                    title='Tutup Detail'
                                >
                                    <X size={14} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* Detail grid */}
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3 px-6 py-5'>
                                {/* Column 1 */}
                                <div className='flex flex-col gap-3'>
                                    <DetailItem
                                        icon='📅'
                                        label='Tanggal Input'
                                        value={
                                            row.created_at
                                                ? new Date(row.created_at)
                                                    .toLocaleDateString('sv-SE', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit',
                                                        hour12: false,
                                                    })
                                                    .trim()
                                                : '-'
                                        }
                                    />
                                    <DetailItem
                                        icon='👤'
                                        label='Admin'
                                        value={row.nama_admin}
                                    />
                                    <DetailItem
                                        icon='👨‍💼'
                                        label='Nama Tamu'
                                        value={row.nama_tamu}
                                    />
                                </div>

                                {/* Column 2 */}
                                <div className='flex flex-col gap-3'>
                                    <DetailItem
                                        icon='📞'
                                        label='No Telp Tamu'
                                        value={row.nomor_telp}
                                    />
                                    <DetailItem
                                        icon='📅'
                                        label='Tanggal Reservasi'
                                        value={row.tanggal_reservasi}
                                    />
                                    <DetailItem
                                        icon='🕖'
                                        label='Durasi'
                                        value={row.durasi}
                                    />
                                </div>

                                {/* Column 3 */}
                                <div className='flex flex-col gap-3'>
                                    <DetailItem
                                        icon='⏰'
                                        label='Check In & Check Out'
                                        value={row.checkin_checkout}
                                    />
                                    <DetailItem
                                        icon='🏢'
                                        label='Unit'
                                        value={row.unit}
                                    />
                                    <DetailItem
                                        icon='🏠'
                                        label='Apartement'
                                        value={row.apart}
                                    />
                                </div>
                                {/* Notes */}
                            </div>
                            {(row.note_pelunasan !== '-' || row.note_admin !== '-') && (
                                <div className='border-t border-gray-100 px-5 py-3'>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                        <DetailItem
                                            icon='📝'
                                            label='Note Pelunasan'
                                            value={row.note_pelunasan}
                                        />
                                        <DetailItem
                                            icon='📋'
                                            label='Note Admin'
                                            value={row.note_admin}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
}