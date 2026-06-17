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
    ChevronDown,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { cn } from 'lib/utils'
import { getUnitOptions, getApartOptions, getTypeOptions, listTypeUnit } from '@/data/typeunit'

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
    const [statusSummary, setStatusSummary] = useState<Array<{ tanggal: string, unit: string, status: string, status_book: string, durasi: string, check_out: string, total: number }>>([])
    const allUnits = getUnitOptions().map(u => u.value)
    
    // Calendar matrix state
    const [calendarStartDate, setCalendarStartDate] = useState(new Date())

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
        return Array.from({length: 7}).map((_, i) => {
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
            let parts = s.tanggal.split('/');
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
        switch(match.status.toUpperCase()) {
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
    }, [page, limit, calendarStartDate, fStart, fEnd, fUnit, fDurasi, fStatusUnit, fApartement, fType, unitOptions.length, durasiOptions.length])

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

            {/* Matrix Calendar Component */}
            <div className='bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mt-2 overflow-x-auto'>
                <div className='flex justify-between items-center mb-6 min-w-[800px]'>
                    <div className='flex items-center gap-4 w-full justify-between'>
                        <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                            Ketersediaan Kamar
                        </h2>
                        <div className='flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1'>
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
                            onChange={(v) => {
                                onChangeFilter(setFStart, v);
                                if (v) {
                                    const d = new Date(v);
                                    if (!isNaN(d.getTime())) {
                                        setCalMonth(d.getMonth() + 1);
                                        setCalYear(d.getFullYear());
                                    }
                                }
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
                                    if (v && v !== 'ALL') setCalUnit(v);
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
                                    <th className="px-6 py-4 whitespace-nowrap pl-2">Durasi</th>
                                    <th className="px-6 py-4 whitespace-nowrap pl-2">Check In - Check Out</th>
                                    {/* <th className="px-6 py-4 whitespace-nowrap">Keterangan</th> */}
                                    <th className="px-6 py-4 whitespace-nowrap pr-20">Inputed By</th>
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

        // ✅ Auto-fill status_book based on durasi if not already set
        if (!row.status_book) {
            const durasi = (row.durasi || '').toLowerCase();
            if (durasi.includes('malam')) {
                setStatusBook('SOLD');
            } else if (durasi.includes('transit')) {
                setStatusBook('BOOKED');
            }
        }
    }, [row]);

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
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
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
                    className={`border rounded-md p-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                        statusBook === 'SOLD' ? 'border-red-400 bg-red-50 text-red-700 font-semibold' :
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
    );
}