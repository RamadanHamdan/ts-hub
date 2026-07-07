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

// DetailItem component for detail panel
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
    const [fPhone, setFPhone] = useState<string>("ALL")
    const [page, setPage] = useState<number>(1)



    // dropdown meta

    const [unitOptions, setUnitOptions] = useState<string[]>([])
    const [durasiOptions, setDurasiOptions] = useState<string[]>([])

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
    const [statusSummary, setStatusSummary] = useState<Array<{ tanggal: string, unit: string, status: string, status_book: string, durasi: string, check_out: string, total: number }>>([])
    const allUnits = getUnitOptions().map(u => u.value)
    const [phoneOptions, setPhoneOptions] = useState<{ label: string; value: string }[]>([])

    // Calendar matrix state
    const [calendarStartDate, setCalendarStartDate] = useState(new Date())
    const [calendarDateFilter, setCalendarDateFilter] = useState('')

    const [limit, setLimit] = useState(20)

    const groupedUnits = React.useMemo(() => {
        return listTypeUnit.reduce((acc, curr) => {
            if (!acc[curr.apartement]) acc[curr.apartement] = {};
            if (!acc[curr.apartement][curr.type]) acc[curr.apartement][curr.type] = [];
            acc[curr.apartement][curr.type].push(curr);
            return acc;
        }, {} as Record<string, Record<string, typeof listTypeUnit>>);
    }, []);

    const calendarDates = React.useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(calendarStartDate);
            d.setDate(d.getDate() + i);
            return d;
        });
    }, [calendarStartDate]);

    const getStatusForUnitAndDate = React.useCallback((unit: string, date: Date) => {
        const dStr = String(date.getDate()).padStart(2, '0');
        const mStr = String(date.getMonth() + 1).padStart(2, '0');
        const yStr = String(date.getFullYear());
        const padded = `${dStr}/${mStr}/${yStr}`;
        const unpadded = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

        let matches = statusSummary.filter(s => s.unit === unit);

        // Filter out those with status_book === 'CANCEL'
        matches = matches.filter(m => m.status_book !== 'CANCEL');

        if (matches.length === 0) return null;

        const currentDateObj = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayMatches = [];
        let checkoutNote = '';

        for (const s of matches) {
            // parse start date
            if (!s.tanggal) continue;
            const parts = s.tanggal.split('/');
            if (parts.length !== 3) continue;
            const startDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));

            let endDate: Date | null = null;
            let coTime = '';
            if (s.check_out) {
                const match = s.check_out.match(/(\d{2}:\d{2})\s*(?:\((.*?)\))?/);
                if (match) {
                    coTime = match[1];
                    if (match[2]) {
                        const ep = match[2].split('/');
                        if (ep.length === 3) {
                            endDate = new Date(parseInt(ep[2]), parseInt(ep[1]) - 1, parseInt(ep[0]));
                        }
                    }
                }
            }
            if (!endDate) {
                // fallback to durasi
                if (s.durasi.includes('malam') && !s.durasi.includes('halfday')) {
                    const match = s.durasi.match(/(\d+)/);
                    const nights = match ? parseInt(match[1]) : 1;
                    endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + nights);
                } else {
                    endDate = new Date(startDate);
                }
            }

            // check overlap
            const isSingleDay = startDate.getTime() === endDate.getTime();

            if (isSingleDay) {
                if (currentDateObj.getTime() === startDate.getTime()) {
                    dayMatches.push(s);
                }
            } else {
                if (currentDateObj.getTime() >= startDate.getTime() && currentDateObj.getTime() < endDate.getTime()) {
                    // It's an active night
                    dayMatches.push(s);
                } else if (currentDateObj.getTime() === endDate.getTime()) {
                    // It's checkout day!
                    const st = s.status.toUpperCase();
                    // If the reservation is already checked out, don't show its checkout note
                    if (!['CLEANING', 'READY', 'MAINTENANCE'].includes(st)) {
                        if (coTime) checkoutNote = `CO ${coTime}`;
                    }
                }
            }
        }

        if (dayMatches.length === 0) {
            if (checkoutNote) {
                return { type: 'checkout_only' as const, note: checkoutNote };
            }
            return null;
        }

        const match = dayMatches[0];
        const currentStatus = match.status.toUpperCase();

        if (['CLEANING', 'MAINTENANCE', 'READY', 'BELUM CHECK IN'].includes(currentStatus)) {
            let label = match.status;
            let bgClass = 'bg-gray-500';
            if (currentStatus === 'CLEANING') { label = 'Cleaning'; bgClass = 'bg-blue-500'; }
            if (currentStatus === 'MAINTENANCE') { label = 'Maintenance'; bgClass = 'bg-yellow-500'; }
            if (currentStatus === 'READY') { label = 'Ready'; bgClass = 'bg-green-500'; }
            if (currentStatus === 'BELUM CHECK IN') { label = 'Belum Check In'; bgClass = 'bg-orange-500'; }

            // If the unit is currently in a post-checkout state, we don't need to show any overlapping checkout notes
            const finalNote = ['CLEANING', 'MAINTENANCE', 'READY'].includes(currentStatus) ? '' : checkoutNote;

            return { type: 'full' as const, label, bgClass, note: finalNote };
        }

        // Check for different durasi types for occupied units
        const hasTransit = dayMatches.some(m => m.durasi.includes('transit'));
        const hasHalfdayMalam = dayMatches.some(m => m.durasi.includes('halfday'));
        const hasMalam = dayMatches.some(m => m.durasi.includes('malam') && !m.durasi.includes('halfday'));

        // If both Transit and Halfday Malam exist on same date → split cell
        if (hasTransit && hasHalfdayMalam) {
            return { type: 'split' as const, transit: true, halfdayMalam: true, note: checkoutNote };
        }
        // Transit only → half-left yellow
        if (hasTransit) {
            return { type: 'split' as const, transit: true, halfdayMalam: false, note: checkoutNote };
        }
        // Halfday Malam only → half-right red
        if (hasHalfdayMalam) {
            return { type: 'split' as const, transit: false, halfdayMalam: true, note: checkoutNote };
        }
        // Malam (full night) → full SOLD red
        if (hasMalam) {
            return { type: 'full' as const, label: 'SOLD', bgClass: 'bg-red-600', note: checkoutNote };
        }

        // Fallback: use the first match's status
        // Fallback for anything else
        let bgClass = 'bg-gray-500';
        let label = match.status;
        switch (match.status.toUpperCase()) {
            case 'SOLD':
                label = 'SOLD'; bgClass = 'bg-red-600'; break;
            default:
                label = match.status; bgClass = 'bg-gray-500'; break;
        }
        return { type: 'full' as const, label, bgClass, note: checkoutNote };
    }, [statusSummary]);


    // Data fetching logic
    const fetchData = React.useCallback(async () => {
        setLoadingRows(true)
        try {
            const params = new URLSearchParams()
            params.set('page', String(page))
            params.set('limit', String(limit))

            const calStartDateStr = calendarStartDate.toISOString().split('T')[0]
            const calEndDateDate = new Date(calendarStartDate)
            calEndDateDate.setDate(calEndDateDate.getDate() + 6)
            const calEndDateStr = calEndDateDate.toISOString().split('T')[0]

            params.set('calStartDate', calStartDateStr)
            params.set('calEndDate', calEndDateStr)

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
    }, [page, limit, calendarStartDate, fStart, fEnd, fUnit, fDurasi, fStatusUnit, fApartement, fType, fPhone, unitOptions.length, durasiOptions.length])

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

            {/* Matrix Calendar Component */}
            <div className='bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mt-2 overflow-x-auto'>
                <div className='flex flex-col gap-4 mb-6 min-w-[800px]'>
                    <div className='flex items-center gap-4 w-full justify-between'>
                        <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                            Ketersediaan Kamar
                        </h2>
                        <div className='flex items-center gap-3'>
                            {/* Calendar Date Filter */}
                            <div className='flex items-center gap-2'>
                                <CalendarDays size={16} className='text-blue-500 shrink-0' />
                                <input
                                    type='date'
                                    value={calendarDateFilter}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setCalendarDateFilter(val);
                                        if (val) {
                                            const d = new Date(val);
                                            if (!isNaN(d.getTime())) {
                                                setCalendarStartDate(d);
                                            }
                                        }
                                    }}
                                    className='h-9 px-3 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 cursor-pointer'
                                />
                            </div>
                            <div className='flex text-black items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1'>
                                <button
                                    onClick={() => {
                                        const newDate = new Date(calendarStartDate);
                                        newDate.setDate(newDate.getDate() - 7);
                                        setCalendarStartDate(newDate);
                                    }}
                                    className='p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors'
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        const newDate = new Date(calendarStartDate);
                                        newDate.setDate(newDate.getDate() - 1);
                                        setCalendarStartDate(newDate);
                                    }}
                                    className='p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors text-xs font-medium px-3'
                                >
                                    Prev
                                </button>
                                <button
                                    onClick={() => setCalendarStartDate(new Date())}
                                    className='p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors text-xs font-medium px-3'
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => {
                                        const newDate = new Date(calendarStartDate);
                                        newDate.setDate(newDate.getDate() + 1);
                                        setCalendarStartDate(newDate);
                                    }}
                                    className='p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors text-xs font-medium px-3'
                                >
                                    Next
                                </button>
                                <button
                                    onClick={() => {
                                        const newDate = new Date(calendarStartDate);
                                        newDate.setDate(newDate.getDate() + 7);
                                        setCalendarStartDate(newDate);
                                    }}
                                    className='p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors'
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="min-w-[800px]">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700">
                                <th className="p-3 w-48 border-r border-gray-200 dark:border-gray-700">Unit</th>
                                {calendarDates.map((date, i) => (
                                    <th key={i} className="p-3 text-center border-r border-gray-200 dark:border-gray-700 w-32">
                                        <div className="text-xs uppercase">{date.toLocaleDateString('id-ID', { weekday: 'short' })}</div>
                                        <div className="font-bold text-gray-900 dark:text-white">{date.getDate()} {date.toLocaleDateString('id-ID', { month: 'short' })}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(groupedUnits).map(([apartement, typesObj]) => (
                                <React.Fragment key={apartement}>
                                    {/* Apartement Header Row */}
                                    <tr className="bg-[#0F172A] dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                                        <td colSpan={8} className="p-3 font-bold text-white uppercase tracking-wider text-center">
                                            APARTEMENT {apartement}
                                        </td>
                                    </tr>
                                    {Object.entries(typesObj).map(([type, units]) => (
                                        <React.Fragment key={`${apartement}-${type}`}>
                                            {/* Type Header Row */}
                                            <tr className="bg-gray-100/50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                                <td colSpan={8} className="p-3 font-semibold text-gray-700 dark:text-gray-300 pl-6">
                                                    {type}
                                                </td>
                                            </tr>
                                            {/* Unit Rows */}
                                            {units.map((unitObj) => (
                                                <tr key={unitObj.unit} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                    <td className="p-3 border-r border-gray-200 dark:border-gray-700 pl-10 font-medium text-gray-900 dark:text-gray-100">
                                                        {unitObj.unit}
                                                    </td>
                                                    {calendarDates.map((date, i) => {
                                                        const status = getStatusForUnitAndDate(unitObj.unit, date);
                                                        return (
                                                            <td key={i} className={`p-2 text-center border-r border-gray-200 dark:border-gray-700 relative`}>
                                                                {status ? (
                                                                    status.type === 'checkout_only' ? (
                                                                        <div className="w-full py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                                                                            <span className="font-normal text-gray-400 text-[10px]">Tersedia</span>
                                                                            <span className="text-amber-600 leading-tight">{status.note}</span>
                                                                        </div>
                                                                    ) : status.type === 'split' ? (
                                                                        /* Split cell: Transit (left-yellow) + Halfday Malam (right-red) */
                                                                        <div className="w-full h-8 rounded-md overflow-hidden flex flex-col shadow-sm relative">
                                                                            <div className="flex h-full w-full">
                                                                                {/* Left half - Transit */}
                                                                                <div className={`w-1/2 flex items-center justify-center text-[10px] font-bold ${status.transit ? 'bg-amber-400 text-amber-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                                                                                    {status.transit ? 'TR' : ''}
                                                                                </div>
                                                                                {/* Right half - Halfday Malam */}
                                                                                <div className={`w-1/2 flex items-center justify-center text-[10px] font-bold ${status.halfdayMalam ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                                                                                    {status.halfdayMalam ? 'HD' : ''}
                                                                                </div>
                                                                                {/* Divider line */}
                                                                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/50" />
                                                                            </div>
                                                                            {status.note && (
                                                                                <div className="absolute inset-x-0 bottom-0 text-[8px] text-center bg-white/80 dark:bg-black/60 text-gray-900 dark:text-gray-100 leading-tight">
                                                                                    {status.note}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        /* Full cell status */
                                                                        <div className={`w-full py-1.5 rounded-md text-xs font-semibold text-white shadow-sm flex flex-col items-center justify-center ${status.bgClass}`}>
                                                                            <span>{status.label}</span>
                                                                            {status.note && <span className="text-[9px] font-normal leading-tight opacity-90">{status.note}</span>}
                                                                        </div>
                                                                    )
                                                                ) : (
                                                                    <div className="w-full py-1.5 text-xs font-medium text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
                                                                        Tersedia
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Calendar Legend */}
                <div className='flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
                    <div className='flex items-center gap-2'>
                        <div className='w-5 h-5 rounded bg-red-600' />
                        <span className='text-xs text-gray-600 dark:text-gray-400 font-medium'>SOLD (Malam)</span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <div className='w-5 h-5 rounded overflow-hidden flex'>
                            <div className='w-1/2 bg-amber-400' />
                            <div className='w-1/2 bg-gray-200 dark:bg-gray-700' />
                        </div>
                        <span className='text-xs text-gray-600 dark:text-gray-400 font-medium'>Transit (TR)</span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <div className='w-5 h-5 rounded overflow-hidden flex'>
                            <div className='w-1/2 bg-gray-200 dark:bg-gray-700' />
                            <div className='w-1/2 bg-red-500' />
                        </div>
                        <span className='text-xs text-gray-600 dark:text-gray-400 font-medium'>Halfday Malam (HD)</span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <div className='w-5 h-5 rounded overflow-hidden flex'>
                            <div className='w-1/2 bg-amber-400' />
                            <div className='w-1/2 bg-red-500' />
                        </div>
                        <span className='text-xs text-gray-600 dark:text-gray-400 font-medium'>Transit + Halfday Malam</span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <div className='w-5 h-5 rounded bg-green-500' />
                        <span className='text-xs text-gray-600 dark:text-gray-400 font-medium'>Ready</span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <div className='w-5 h-5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700' />
                        <span className='text-xs text-gray-600 dark:text-gray-400 font-medium'>Tersedia</span>
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
                    className="h-12 w-full rounded-xl border border-blue-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white px-4 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-200"
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
                        className={`border rounded-md p-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${statusBook === 'SOLD' ? 'border-red-400 bg-red-50 text-red-700 font-semibold' :
                            statusBook === 'BOOKED' ? 'border-amber-400 bg-amber-50 text-amber-700 font-semibold' :
                                'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white'
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