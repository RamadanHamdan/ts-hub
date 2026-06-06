'use client'

import React from 'react'
import {
  Filter,
  ChevronDown,
  Calendar,
  CalendarDays,
  Building2,
  Clock,
  X,
  BarChart2,
  MapPinCheck,
  EyeIcon,
  PenBox as LucidePenBox,
  CalendarRange,
  CalendarCheck,
} from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ──────────────────────────────────────
// Types
// ──────────────────────────────────────
type ReservasiRow = {
  _id: string
  kode: string
  nama_tamu: string
  tanggal_reservasi: string
  unit: string
  durasi: string
  checkin_checkout: string
  harga: string
  harga_raw: number
  uang_masuk: string
  masuk_raw: number
  sisa: string
  sisa_raw: number,
  apart: string
  nama_admin: string
  note_pelunasan: string
  note_admin: string
  nomor_telp: string
  created_at: string | null
  updated_at: string | null
}

type PendapatanUnit = {
  unit: string
  total: number
}

type PendapatanCategory = {
  unit: string
  durasi: string
  total: number
}

type FilterOptions = {
  hari: string[]
  unit: string[]
  durasi: string[]
}

type StatsData = {
  pendapatanByUnit: PendapatanUnit[]
  pendapatanByCategory: PendapatanCategory[]
  totalPendapatan: number
  totalPendapatanCategory: number
}

// ──────────────────────────────────────
// Helpers
// ──────────────────────────────────────
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

function formatRupiah(value: number): string {
  if (!value && value !== 0) return 'Rp 0'
  return 'Rp ' + value.toLocaleString('id-ID')
}

// DetailItem component
function DetailItem({
  icon,
  label,
  value,
  isLink,
}: {
  icon: string
  label: string
  value?: string
  isLink?: boolean
}) {
  return (
    <div className='flex items-start gap-1.5 min-w-0'>
      <span className='mt-[1px] shrink-0 text-[11px] leading-none'>{icon}</span>
      <div className='flex flex-col min-w-0'>
        <span className='text-[9.5px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5'>
          {label}:
        </span>
        {isLink && value && value !== '-' ? (
          <a
            href={value}
            target='_blank'
            rel='noopener noreferrer'
            className='text-[10.5px] text-blue-600 hover:underline font-medium truncate'
          >
            {value}
          </a>
        ) : (
          <span className='text-[10.5px] text-slate-700 font-medium'>
            {value || '-'}
          </span>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────
// PERIOD types
// ──────────────────────────────────────
type PeriodType = 'hari' | 'minggu' | 'bulan' | 'all_time'

const PERIOD_BUTTONS_CATEGORY: { id: PeriodType; label: string; icon: typeof CalendarDays }[] = [
  { id: 'hari', label: 'Per Hari', icon: CalendarDays },
  { id: 'minggu', label: 'Per Minggu', icon: CalendarRange },
  { id: 'bulan', label: 'Per Bulan', icon: CalendarCheck },
  { id: 'all_time', label: 'Semua Waktu', icon: CalendarCheck },
]

// ──────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────
export default function TrackingReservasiPage() {
  const router = useRouter()
  const pageSize = 20

  // Filter buttons for dropdown multi-select
  const filterButtons = [
    { id: 'Unit', icon: Building2, label: 'Unit' },
    { id: 'Durasi', icon: Clock, label: 'Durasi' },
  ]

  // ── State ──
  const [unit, setUnit] = useState<string[]>([])
  const [durasi, setDurasi] = useState<string[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(true)
  const [isFilterOpen2, setIsFilterOpen2] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [period, setPeriod] = useState<PeriodType>('hari')

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    hari: [],
    unit: [],
    durasi: [],
  })

  // Data state
  const [rows, setRows] = useState<ReservasiRow[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loadingRows, setLoadingRows] = useState(true)
  const [selected, setSelected] = useState<ReservasiRow | null>(null)

  // Separate stats for each table so they can update independently
  const [unitTableData, setUnitTableData] = useState<PendapatanUnit[]>([])
  const [unitTableTotal, setUnitTableTotal] = useState(0)
  const [categoryTableData, setCategoryTableData] = useState<PendapatanCategory[]>([])
  const [categoryTableTotal, setCategoryTableTotal] = useState(0)

  // Track which table triggered the filter change:
  // 'unit-table' | 'category-table' | 'other'
  const clickSourceRef = useRef<'unit-table' | 'category-table' | 'other'>('other')

  // Dropdown filter state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [dropdownSearch, setDropdownSearch] = useState<Record<string, string>>({})
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ── Filter helpers ──
  const getFilterArr = useCallback(
    (id: string): string[] => {
      switch (id) {
        case 'Unit':
          return unit
        case 'Durasi':
          return durasi
        default:
          return []
      }
    },
    [unit, durasi],
  )

  const setFilterArr = (id: string, vals: string[]) => {
    switch (id) {
      case 'Unit':
        setUnit(vals)
        break
      case 'Durasi':
        setDurasi(vals)
        break
    }
    setPage(1)
    setSelected(null)
  }

  const selectAllFilter = (id: string, opts: string[]) => {
    setFilterArr(id, [...opts])
  }

  const toggleFilterVal = (id: string, val: string) => {
    const cur = getFilterArr(id)
    setFilterArr(
      id,
      cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val],
    )
  }

  const clearFilterArr = (id: string) => {
    setFilterArr(id, [])
    setOpenDropdown(null)
  }

  const getOptions = useCallback(
    (id: string): string[] => {
      switch (id) {
        case 'Unit':
          return filterOptions.unit
        case 'Durasi':
          return filterOptions.durasi
        default:
          return []
      }
    },
    [filterOptions],
  )

  // ── Close dropdown on outside click ──
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Fetch data from API ──
  const fetchData = useCallback(async () => {
    setLoadingRows(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(pageSize))
      params.set('period', period)

      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (unit.length > 0) params.set('unit', unit.join(','))
      if (durasi.length > 0) params.set('durasi', durasi.join(','))

      const res = await fetch(`/api/tracking-reservasi?${params.toString()}`)
      if (!res.ok) throw new Error('Fetch failed')

      const data = await res.json()
      setRows(data.rows || [])
      setTotal(data.total || 0)
      setFilterOptions(data.filterOptions || { hari: [], unit: [], durasi: [] })

      const newStats: StatsData | null = data.stats || null
      const source = clickSourceRef.current
      clickSourceRef.current = 'other' // reset after use

      if (newStats) {
        if (source === 'unit-table') {
          // Only update unit table stats, preserve category table
          setUnitTableData(newStats.pendapatanByUnit)
          setUnitTableTotal(newStats.totalPendapatan)
        } else if (source === 'category-table') {
          // Only update category table stats, preserve unit table
          setCategoryTableData(newStats.pendapatanByCategory)
          setCategoryTableTotal(newStats.totalPendapatanCategory)
        } else {
          // Normal filter / initial load → update both
          setUnitTableData(newStats.pendapatanByUnit)
          setUnitTableTotal(newStats.totalPendapatan)
          setCategoryTableData(newStats.pendapatanByCategory)
          setCategoryTableTotal(newStats.totalPendapatanCategory)
        }
      }
    } catch (err) {
      console.error('Error fetching tracking data:', err)
      setRows([])
      setTotal(0)
    } finally {
      setLoadingRows(false)
    }
  }, [page, pageSize, period, startDate, endDate, unit, durasi])

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Pagination ──
  const safePage = Math.max(1, page)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // ──────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────
  return (
    <div className='min-h-screen'>
      <div className='flex'>
        <div className='flex-1 p-6'>
          {/* Page Header */}
          <div className='bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100'>
            <div className='flex flex-col'>
              <h1 className='text-2xl pl-4 font-extrabold text-black drop-shadow-sm'>
                Tracking Reservasi
              </h1>
              <div className='text-sm ml-4 mt-2 text-slate-500 font-medium'>
                Dashboard Reservasi
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════
              SECTION 1: FILTER DATA TRACKING
             ═══════════════════════════════════ */}
          <section className='bg-white rounded-xl shadow-sm border border-gray-200'>
            {/* Header */}
            <div className='bg-[#0d1f3c] text-white px-3 sm:px-5 h-10 flex items-center justify-between rounded-t-xl gap-2'>
              <div className='flex items-center gap-1.5 sm:gap-2 min-w-0'>
                <Filter
                  size={13}
                  strokeWidth={2.5}
                  className='text-white shrink-0'
                />
                <strong className='text-[10px] sm:text-[11px] font-bold tracking-wide whitespace-nowrap'>
                  Filter Data Tracking
                </strong>
                <span className='text-[9px] sm:text-[10px] text-blue-200 font-normal hidden sm:inline'>
                  (Top 1 Unit, Total Pendapatan Per Unit, Pendapatan Unit By Category)
                </span>
              </div>
              <button
                className='bg-white text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors cursor-pointer shadow-sm shrink-0'
                aria-label={isFilterOpen ? 'Tutup filter' : 'Buka filter'}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <ChevronDown
                  size={14}
                  strokeWidth={2.5}
                  className={`transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            {/* Filter Content */}
            <div
              className='p-3 sm:p-4 flex flex-col gap-3'
              style={{ display: isFilterOpen ? 'flex' : 'none' }}
            >
              {/* Date Range Filter */}
              <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2'>
                <div className='flex items-center text-xs font-semibold text-gray-600 min-w-max'>
                  <Calendar
                    size={14}
                    className='mr-1.5 text-blue-500'
                    strokeWidth={2.5}
                  />
                  Tanggal Reservasi:
                </div>
                <div className='flex items-center gap-2 w-full sm:w-auto'>
                  <input
                    type='date'
                    className='flex-1 sm:flex-none sm:w-30 text-xs h-8 px-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400'
                    placeholder='mm/dd/yyyy'
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      setPage(1)
                      setSelected(null)
                    }}
                  />
                  <span className='text-gray-400 font-semibold'>-</span>
                  <input
                    type='date'
                    className='flex-1 sm:flex-none sm:w-30 text-xs h-8 px-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400'
                    placeholder='mm/dd/yyyy'
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      setPage(1)
                      setSelected(null)
                    }}
                  />
                </div>
              </div>

              {/* Period Selector (Hari / Minggu / Bulan) */}
              <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2'>
                <div className='flex items-center text-xs font-semibold text-gray-600 min-w-max'>
                  <CalendarDays
                    size={14}
                    className='mr-1.5 text-blue-500'
                    strokeWidth={2.5}
                  />
                  Periode:
                </div>
                <div className='flex items-center gap-1.5'>
                  {PERIOD_BUTTONS_CATEGORY.map((pb) => {
                    const PIcon = pb.icon
                    const isActive = period === pb.id
                    return (
                      <button
                        key={pb.id}
                        type='button'
                        onClick={() => {
                          setPeriod(pb.id)
                          setStartDate('')
                          setEndDate('')
                          setPage(1)
                          setSelected(null)
                        }}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-[6px] text-[11px] font-semibold rounded-lg cursor-pointer transition-all duration-150',
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                            : 'border border-slate-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600',
                        )}
                      >
                        <PIcon size={12} strokeWidth={2} />
                        {pb.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Filter Dropdowns (Unit, Durasi) */}
              <div
                ref={dropdownRef}
                className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 w-full'
              >
                {filterButtons.map((btn) => {
                  const IconComponent = btn.icon
                  const activeArr = getFilterArr(btn.id)
                  const count = activeArr.length
                  const isActive = count > 0
                  const opts = getOptions(btn.id)
                  const search = dropdownSearch[btn.id] ?? ''
                  const filtered = search
                    ? opts.filter((o) =>
                      o.toLowerCase().includes(search.toLowerCase()),
                    )
                    : opts
                  const isOpen = openDropdown === btn.id
                  return (
                    <div key={btn.id} className='relative'>
                      <button
                        type='button'
                        onClick={() => setOpenDropdown(isOpen ? null : btn.id)}
                        className={`w-full flex items-center justify-between gap-1 py-[7px] px-3 text-[11px] font-semibold rounded-lg cursor-pointer ${isOpen
                          ? 'border-2 border-blue-500 bg-white text-blue-600 shadow-md'
                          : isActive
                            ? 'border-2 border-blue-400 bg-white text-blue-700'
                            : 'border border-slate-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600'
                          }`}
                      >
                        <span className='flex items-center gap-1.5 min-w-0'>
                          <IconComponent
                            size={11}
                            className={`shrink-0 ${isOpen || isActive ? 'text-blue-500' : 'text-gray-400'}`}
                            strokeWidth={2}
                          />
                          <span className='truncate'>{btn.label}</span>
                        </span>
                        <span className='flex items-center gap-1 shrink-0'>
                          {isActive && (
                            <span className='inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold'>
                              {count}
                            </span>
                          )}
                          <ChevronDown
                            size={14}
                            strokeWidth={2.5}
                            className={`ml-0.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </span>
                      </button>

                      {/* Dropdown panel */}
                      {isOpen && (
                        <div
                          className='absolute top-[calc(100%+4px)] left-0 z-[9999] w-56 bg-white rounded-lg flex flex-col'
                          style={{
                            boxShadow:
                              '0 12px 40px -4px rgba(0,0,0,0.2), 0 4px 12px -2px rgba(0,0,0,0.08)',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          {/* Search */}
                          <div className='px-2 pt-2 pb-1'>
                            <input
                              autoFocus
                              type='text'
                              placeholder='Cari...'
                              value={search}
                              onChange={(e) =>
                                setDropdownSearch((prev) => ({
                                  ...prev,
                                  [btn.id]: e.target.value,
                                }))
                              }
                              className='w-full text-[11px] px-2 py-1.5 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400'
                            />
                          </div>
                          {/* Semua / Hapus */}
                          <div className='flex items-center gap-1 px-2 pb-1'>
                            <button
                              type='button'
                              onClick={() => selectAllFilter(btn.id, opts)}
                              className='flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-800 px-1'
                            >
                              ✓ Semua
                            </button>
                            <span className='text-gray-300'>|</span>
                            <button
                              type='button'
                              onClick={() => clearFilterArr(btn.id)}
                              className='flex items-center gap-1 text-[10px] font-semibold text-red-500 hover:text-red-700 px-1'
                            >
                              X Hapus
                            </button>
                          </div>
                          {/* Option list */}
                          <div
                            className='max-h-48 overflow-y-auto border-t border-gray-100'
                            style={{ scrollbarWidth: 'thin' }}
                          >
                            {filtered.length === 0 ? (
                              <div className='px-3 py-2 text-[10px] text-slate-400 text-center'>
                                Tidak ada data
                              </div>
                            ) : (
                              filtered.map((opt) => {
                                const checked = activeArr.includes(opt)
                                return (
                                  <label
                                    key={opt}
                                    className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-blue-50 ${checked ? 'bg-blue-50/60' : ''}`}
                                  >
                                    <input
                                      type='checkbox'
                                      checked={checked}
                                      onChange={() => toggleFilterVal(btn.id, opt)}
                                      className='accent-blue-600 w-3.5 h-3.5 shrink-0'
                                    />
                                    <span
                                      className={`text-[11px] truncate ${checked ? 'font-semibold text-blue-700' : 'text-slate-700'}`}
                                    >
                                      {opt}
                                    </span>
                                  </label>
                                )
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Hint info row */}
              <div className='flex items-center gap-1.5 text-[10px] text-slate-400'>
                <span className='text-blue-400'>ⓘ</span>
                Klik tombol filter → centang pilihan. Bisa pilih lebih dari satu.
                {(filterButtons.some((b) => getFilterArr(b.id).length > 0) ||
                  startDate ||
                  endDate) && (
                    <span className='text-blue-600 font-semibold ml-1'>
                      Menampilkan {total.toLocaleString()} data
                    </span>
                  )}
              </div>

              {/* Chips row: active selections */}
              {filterButtons.some((b) => getFilterArr(b.id).length > 0) && (
                <div className='flex flex-wrap gap-1 mt-0.5'>
                  {filterButtons.flatMap((btn) =>
                    getFilterArr(btn.id).map((val) => (
                      <span
                        key={`${btn.id}-${val}`}
                        className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 border border-blue-200'
                      >
                        {btn.label}: {val}
                        <button
                          type='button'
                          onClick={() => toggleFilterVal(btn.id, val)}
                          className='hover:text-red-500 ml-0.5'
                        >
                          <X size={9} />
                        </button>
                      </span>
                    )),
                  )}
                  <button
                    type='button'
                    onClick={() =>
                      filterButtons.forEach((b) => clearFilterArr(b.id))
                    }
                    className='text-[10px] text-red-500 hover:text-red-700 font-semibold ml-1'
                  >
                    Reset Semua
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ═══════════════════════════════════
              SECTION 2: TRACKING UNIT (STATS)
             ═══════════════════════════════════ */}
          <section className='bg-white mt-4 rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
            <div className='bg-[#1E3B62] text-white px-3 sm:px-6 h-10 flex items-center justify-between gap-2'>
              <div className='flex items-center min-w-0'>
                <BarChart2
                  size={12}
                  className='mr-1.5 sm:mr-2 shrink-0'
                  strokeWidth={2.5}
                />
                <strong className='text-[9px] sm:text-[10px] font-bold tracking-wide whitespace-nowrap'>
                  Tracking Unit
                </strong>
                <span className='text-[8px] sm:text-[9px] ml-1 sm:ml-2 text-blue-100 font-normal tracking-wide hidden sm:inline'>
                  (Klik baris tabel untuk filter data)
                </span>
              </div>
              <button
                className='bg-white text-blue-600 p-1 rounded hover:bg-slate-50 transition-colors shadow-sm cursor-pointer shrink-0'
                aria-label={isFilterOpen2 ? 'Tutup filter' : 'Buka filter'}
                onClick={() => setIsFilterOpen2(!isFilterOpen2)}
              >
                <ChevronDown
                  size={16}
                  strokeWidth={2.5}
                  className={`transition-transform duration-200 ${isFilterOpen2 ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
            {/* Summary Cards */}
            <div
              className='p-3 sm:p-4 gap-3'
              style={{
                display: isFilterOpen2 ? 'flex' : 'none',
                flexDirection: 'column',
              }}
            >
              <div className='flex flex-col sm:flex-row gap-3 w-full'>
                {/* Card: Total Pendapatan By Unit */}
                <div className='w-full md:w-full'>
                  <div className='flex flex-col border-0 h-full border-l-4 border-l-[#0d1f3c] bg-[#f8fbff] rounded-lg shadow-sm'>
                    <div className='py-2 px-3 flex flex-col justify-between'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <div className='rounded-full flex items-center justify-center text-white shrink-0 w-9 h-9 bg-linear-to-br from-[#0d1f3c] to-[#18202c]'>
                            <Building2 size={14} className='text-white' />
                          </div>
                          <div>
                            <div className='font-bold text-[12px] text-[#1e293b]'>
                              Pendapatan By Unit
                            </div>
                            <div className='text-[10px] text-slate-500'>
                              Total pendapatan semua unit
                            </div>
                          </div>
                        </div>
                        <div className='text-right'>
                          <div
                            className='font-bold text-[1.1rem] sm:text-[1.4rem] leading-none text-blue-600'
                            id='statTotalPendapatan'
                          >
                            {loadingRows
                              ? '...'
                              : formatRupiah(unitTableTotal)}
                          </div>
                          <div className='text-[10px] text-slate-500'>
                            {loadingRows
                              ? '...'
                              : `${unitTableData.length} unit`}
                          </div>
                        </div>
                      </div>
                      <div className='w-full bg-[#dbeafe] rounded-full h-0.75 mt-2'>
                        <div className='bg-blue-900 h-0.75 rounded-full w-full'></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card: Total Pendapatan By Category */}
                <div className='w-full md:w-full'>
                  <div className='flex flex-col border-0 h-full border-l-4 border-l-[#0d1f3c] bg-[#f0f1fd] rounded-lg shadow-sm'>
                    <div className='py-2 px-3 flex flex-col justify-between'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <div className='rounded-full flex items-center justify-center text-white shrink-0 w-9 h-9 bg-linear-to-br from-[#2d6cd3] to-[#143160]'>
                            <Building2
                              size={14}
                              className='text-white'
                              strokeWidth={2.5}
                            />
                          </div>
                          <div>
                            <div className='font-bold text-[12px] text-[#1e293b]'>
                              Pendapatan By Category
                            </div>
                            <div className='text-[10px] text-slate-500'>
                              Total berdasarkan unit & durasi
                            </div>
                          </div>
                        </div>
                        <div className='text-right'>
                          <div
                            className='font-bold text-[1.1rem] sm:text-[1.4rem] leading-none text-blue-900'
                            id='statWaUnik'
                          >
                            {loadingRows
                              ? '...'
                              : formatRupiah(categoryTableTotal)}
                          </div>
                          <div className='text-[10px] text-slate-500'>
                            {loadingRows
                              ? '...'
                              : `${categoryTableData.length} kategori`}
                          </div>
                        </div>
                      </div>
                      <div className='w-full bg-blue-200 rounded-full h-[3px] mt-2 flex'>
                        <div
                          className='bg-blue-600 h-[3px] rounded-full transition-all duration-700'
                          id='progWaUnik'
                          style={{
                            width:
                              unitTableTotal === 0
                                ? '0%'
                                : `${Math.round((categoryTableTotal / unitTableTotal) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tables: Pendapatan By Unit & By Category */}
            <div
              className='flex flex-col sm:flex-row gap-3 w-full px-3 sm:px-4 pb-3 sm:pb-4'
              style={{ display: isFilterOpen2 ? 'flex' : 'none' }}
            >
              {/* Panel Kiri: Pendapatan By Unit */}
              <div className='flex flex-col flex-1 rounded-lg border border-blue-100 overflow-hidden shadow-sm'>
                <div
                  className='flex items-center justify-between px-3 py-[6px]'
                  style={{
                    background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                    borderBottom: '2px solid #2563eb',
                  }}
                >
                  <div className='flex items-center gap-1.5'>
                    <MapPinCheck
                      size={13}
                      className='text-blue-600 shrink-0'
                      strokeWidth={2.5}
                    />
                    <span className='text-[11px] font-bold text-[#1e293b]'>
                      Data Unit By Pendapatan
                    </span>
                  </div>
                  <div className='flex items-center gap-1 text-[10px] text-slate-500'>
                    <span className='font-semibold text-blue-700'>
                      {loadingRows ? '...' : unitTableData.length}
                    </span>
                    <span>unit</span>
                  </div>
                </div>
                <div className='max-h-[230px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-blue-50 [&::-webkit-scrollbar-thumb]:bg-blue-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-blue-400'>
                  <table className='w-full text-center border-collapse'>
                    <thead className='sticky top-0 z-10 bg-[#f1f5f9]'>
                      <tr>
                        <th className='px-2 py-1.5 text-[10px] font-semibold text-slate-500'>
                          No
                        </th>
                        <th className='px-2 py-1.5 text-[10px] font-semibold text-slate-500'>
                          Unit
                        </th>
                        <th className='px-2 py-1.5 text-[10px] font-semibold text-slate-500'>
                          Pendapatan
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-100'>
                      {loadingRows ? (
                        <tr>
                          <td
                            colSpan={3}
                            className='px-2 py-4 text-center text-[10px] text-slate-400'
                          >
                            Memuat data...
                          </td>
                        </tr>
                      ) : unitTableData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className='px-2 py-4 text-center text-[10px] text-slate-400'
                          >
                            Tidak ada data
                          </td>
                        </tr>
                      ) : (
                        unitTableData.map((item, index) => {
                          const maxTotal = unitTableData[0]?.total || 1
                          const pct = Math.round((item.total / maxTotal) * 100)
                          return (
                            <tr
                              key={item.unit}
                              onClick={() => {
                                clickSourceRef.current = 'unit-table'
                                setUnit([item.unit])
                                setPage(1)
                                setSelected(null)
                              }}
                              className={cn(
                                'transition-colors cursor-pointer',
                                unit.includes(item.unit)
                                  ? 'bg-blue-100 ring-1 ring-inset ring-blue-400'
                                  : 'hover:bg-blue-50/70',
                              )}
                            >
                              <td className='px-2 py-1.5 text-[10px] text-slate-400'>
                                {index + 1}
                              </td>
                              <td className='px-2 py-1.5 text-[10px] text-slate-700 font-medium'>
                                {item.unit}
                              </td>
                              <td className='px-2 py-1.5 text-[10px] text-slate-600'>
                                <div className='flex items-center gap-1.5'>
                                  <span>{formatRupiah(item.total)}</span>
                                  <div className='flex-1 min-w-[36px] bg-blue-100 rounded-full h-[4px] overflow-hidden'>
                                    <div
                                      className='bg-blue-500 h-full rounded-full'
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Panel Kanan: Data Unit By Category (Durasi) */}
              <div className='flex flex-col flex-1 rounded-lg border border-green-100 overflow-hidden shadow-sm'>
                <div
                  className='flex items-center justify-between px-3 py-[6px]'
                  style={{
                    background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                    borderBottom: '2px solid #16a34a',
                  }}
                >
                  <div className='flex items-center gap-1.5'>
                    <Clock
                      size={13}
                      className='text-green-600 shrink-0'
                      strokeWidth={2.5}
                    />
                    <span className='text-[11px] font-bold text-[#1e293b]'>
                      Data Unit By Category (Durasi)
                    </span>
                  </div>
                  <div className='flex items-center gap-1 text-[10px] text-slate-500'>
                    <span className='font-semibold text-green-700'>
                      {loadingRows ? '...' : categoryTableData.length}
                    </span>
                    <span>baris</span>
                    <span className='mx-0.5 text-slate-300'>|</span>
                    <span className='font-semibold text-green-700'>
                      {loadingRows
                        ? '...'
                        : formatRupiah(categoryTableTotal)}
                    </span>
                    <span>total</span>
                  </div>
                </div>
                <div className='max-h-[230px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-green-50 [&::-webkit-scrollbar-thumb]:bg-green-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-green-400'>
                  <table className='w-full text-center border-collapse'>
                    <thead className='sticky top-0 z-10 bg-[#f1f5f9]'>
                      <tr>
                        <th className='px-2 py-1.5 text-[10px] font-semibold text-slate-500'>
                          #
                        </th>
                        <th className='px-2 py-1.5 text-[10px] font-semibold text-slate-500'>
                          Unit
                        </th>
                        <th className='px-2 py-1.5 text-[10px] font-semibold text-slate-500'>
                          Durasi
                        </th>
                        <th className='px-2 py-1.5 text-[10px] font-semibold text-slate-500'>
                          Pendapatan
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-100'>
                      {loadingRows ? (
                        <tr>
                          <td
                            colSpan={4}
                            className='px-2 py-4 text-center text-[10px] text-slate-400'
                          >
                            Memuat data...
                          </td>
                        </tr>
                      ) : categoryTableData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className='px-2 py-4 text-center text-[10px] text-slate-400'
                          >
                            Tidak ada data
                          </td>
                        </tr>
                      ) : (
                        categoryTableData.map((item, index) => {
                          const maxTotal = categoryTableData[0]?.total || 1
                          const pct = Math.round((item.total / maxTotal) * 100)
                          return (
                            <tr
                              key={`${item.unit}-${item.durasi}`}
                              onClick={() => {
                                clickSourceRef.current = 'category-table'
                                setUnit([item.unit])
                                setDurasi([item.durasi])
                                setPage(1)
                                setSelected(null)
                              }}
                              className={cn(
                                'transition-colors cursor-pointer',
                                unit.includes(item.unit) && durasi.includes(item.durasi)
                                  ? 'bg-green-100 ring-1 ring-inset ring-green-400'
                                  : 'hover:bg-green-50/70',
                              )}
                            >
                              <td className='px-2 py-1.5 text-[10px] text-slate-400'>
                                {index + 1}
                              </td>
                              <td className='px-2 py-1.5 text-[10px] text-slate-700 font-medium'>
                                {item.unit}
                              </td>
                              <td className='px-2 py-1.5 text-[10px] text-slate-600'>
                                {item.durasi}
                              </td>
                              <td className='px-2 py-1.5 text-[10px] text-slate-600'>
                                <div className='flex items-center gap-1.5'>
                                  <span>{formatRupiah(item.total)}</span>
                                  <div className='flex-1 min-w-[36px] bg-green-100 rounded-full h-[4px] overflow-hidden'>
                                    <div
                                      className='bg-green-500 h-full rounded-full'
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════
              SECTION 3: DATA TABLE
             ═══════════════════════════════════ */}
          <div className='mt-4 overflow-hidden rounded-2xl bg-blue shadow-sm ring-1 ring-gray-200'>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm text-left items-center bg-transparent lg:bg-white block lg:table'>
                <thead className='bg-blue-950 justify-center hidden lg:table-header-group'>
                  <tr>
                    {[
                      { label: 'No' },
                      { label: '⚙ Aksi' },
                      { label: 'KODE' },
                      { label: '👨‍💼 NAMA TAMU' },
                      { label: '📅 TANGGAL RESERVASI' },
                      { label: '🏢 UNIT' },
                      { label: '🕖 DURATION' },
                      { label: '⏰ CHECK IN & CHECK OUT' },
                      { label: '💰 HARGA' },
                      { label: '🏦 SISA PEMBAYARAN' },
                      { label: '💸 UANG MASUK' },
                      { label: '🏠 APART' },
                    ].map((h, index) => (
                      <th
                        key={index}
                        className='px-5 py-3 text-[10px] font-semibold text-white'
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className='divide-y lg:divide-gray-300 block lg:table-row-group'>
                  {loadingRows ? (
                    <tr>
                      <td
                        colSpan={11}
                        className='px-6 py-8 text-center text-[10px] text-gray-500'
                      >
                        <div className='flex justify-center items-center gap-2'>
                          <span className='w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin'></span>
                          <span>Memuat Data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className='px-6 py-8 text-center text-[10px] text-gray-500'
                      >
                        Tidak ada data
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, i) => {
                      const active = selected?._id === row._id
                      return (
                        <React.Fragment key={row._id}>
                          <tr
                            className='block lg:table-row mb-4 lg:mb-0 bg-white rounded-xl lg:rounded-none shadow-md lg:shadow-none border border-gray-200 lg:border-b lg:border-t-0 lg:border-x-0 p-3 lg:p-0 hover:bg-blue-50/50 transition-colors cursor-pointer relative overflow-hidden'
                          >
                            <td className='flex justify-between items-center px-1 py-1.5 sm:px-5.5 sm:py-2 text-[10px] text-slate-500 sm:whitespace-nowrap border-b border-dashed border-gray-100 lg:border-0 lg:table-cell'>
                              <span className='lg:hidden font-bold text-gray-400'>No</span>
                              <span>{(safePage - 1) * pageSize + i + 1}</span>
                            </td>
                            <td className='flex justify-between items-center px-1 py-1.5 sm:px-4 sm:py-2 border-b border-dashed border-gray-100 lg:border-0 lg:table-cell'>
                              <span className='lg:hidden font-bold text-gray-400 text-[10px]'>⚙ Aksi</span>
                              <div className='flex items-center gap-1.5'>
                                <button
                                  title='Lihat Detail'
                                  onClick={() =>
                                    setSelected(
                                      selected?._id === row._id ? null : row,
                                    )
                                  }
                                  className={cn(
                                    'inline-flex items-center justify-center w-6 h-6 rounded-md transition-all duration-150 cursor-pointer',
                                    selected?._id === row._id
                                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-300'
                                      : 'bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white',
                                  )}
                                >
                                  <EyeIcon size={12} strokeWidth={2.2} />
                                </button>
                                <button
                                  title='Revisi Data'
                                  onClick={() =>
                                    router.push(
                                      `/input-reservasi?id=${encodeURIComponent(row._id)}`,
                                    )
                                  }
                                  className='inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-400 text-gray-900 hover:bg-amber-500 transition-all duration-150 cursor-pointer shadow-sm shadow-amber-200'
                                >
                                  <LucidePenBox size={12} strokeWidth={2.2} />
                                </button>
                              </div>
                            </td>
                            <td className='flex justify-between items-center px-1 py-1.5 sm:px-3.5 lg:py-3 text-[10px] text-blue-700 border-b border-dashed border-gray-100 lg:border-0 lg:table-cell'>
                              <span className='lg:hidden font-bold text-gray-400'>KODE</span>
                              <span>{row.kode}</span>
                            </td>
                            <td className='flex justify-between items-center px-1 py-1.5 sm:px-5 lg:py-3 text-[10px] text-slate-700 font-medium border-b border-dashed border-gray-100 lg:border-0 lg:table-cell'>
                              <span className='lg:hidden font-bold text-gray-400'>👨‍💼 NAMA TAMU</span>
                              <span className='text-right'>{row.nama_tamu}</span>
                            </td>
                            <td className='flex justify-between items-center px-1 py-1.5 sm:px-5 lg:py-3 text-[10px] text-slate-600 border-b border-dashed border-gray-100 lg:border-0 lg:table-cell'>
                              <span className='lg:hidden font-bold text-gray-400'>📅 TANGGAL RESERVASI</span>
                              <span className='text-right'>{row.tanggal_reservasi}</span>
                            </td>
                            <td className='flex justify-between items-center px-1 py-1.5 sm:px-5 lg:py-3 text-[10px] text-slate-600 border-b border-dashed border-gray-100 lg:border-0 lg:table-cell'>
                              <span className='lg:hidden font-bold text-gray-400'>🏢 UNIT</span>
                              <span className='text-right'>{row.unit}</span>
                            </td>
                            <td className='flex justify-between items-center px-1 py-1.5 sm:px-5 lg:py-3 text-[10px] text-slate-600 border-b border-dashed border-gray-100 lg:border-0 lg:table-cell'>
                              <span className='lg:hidden font-bold text-gray-400'>🕖 DURATION</span>
                              <span className='text-right'>{row.durasi}</span>
                            </td>
                            <td className='flex justify-between items-center px-1 py-1.5 sm:px-5 lg:py-3 text-[10px] text-slate-700 font-medium border-b border-dashed border-gray-100 lg:border-0 lg:table-cell'>
                              <span className='lg:hidden font-bold text-gray-400'>⏰ CHECK IN & CHECK OUT</span>
                              <span className='text-right'>{row.checkin_checkout}</span>
                            </td>
                            <td className='flex justify-between items-center px-1 py-1.5 sm:px-5 lg:py-3 text-[10px] text-slate-600 border-b border-dashed border-gray-100 lg:border-0 lg:table-cell'>
                              <span className='lg:hidden font-bold text-gray-400'>💰 HARGA</span>
                              <span className='text-right'>{row.harga}</span>
                            </td>
                            <td className='flex justify-between items-center px-1 py-1.5 sm:px-5 lg:py-3 text-[10px] text-slate-600 font-mono border-b border-dashed border-gray-100 lg:border-0 lg:table-cell'>
                              <span className='lg:hidden font-bold text-gray-400'> SISA PEMBAYARAN</span>
                              <span>{row.sisa}</span>
                            </td>
                            <td className='flex justify-between items-center px-1 py-1.5 sm:px-5 lg:py-3 text-[10px] text-slate-600 font-mono border-b border-dashed border-gray-100 lg:border-0 lg:table-cell'>
                              <span className='lg:hidden font-bold text-gray-400'>💸 UANG MASUK</span>
                              <span>{row.uang_masuk}</span>
                            </td>
                            <td className='flex justify-between items-center px-1 py-1.5 sm:px-5 lg:py-3 text-[10px] border-b border-dashed border-gray-100 lg:border-0 lg:table-cell'>
                              <span className='lg:hidden font-bold text-gray-400'>🏠 APART</span>
                              <span className='inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600'>
                                {row.apart}
                              </span>
                            </td>
                          </tr>
                          {/* Detail Panel */}
                          {active && (
                            <tr className='bg-blue-50/20 block lg:table-row -mt-4 lg:mt-0 mb-4 lg:mb-0 border border-t-0 sm:border-t rounded-b-xl lg:rounded-none border-blue-200 lg:border-0 relative z-10 lg:z-auto shadow-md lg:shadow-none'>
                              <td
                                colSpan={11}
                                className='block lg:table-cell px-2 sm:px-4 py-2 lg:py-3 border-b border-blue-100'
                              >
                                <div className='rounded-xl bg-white shadow-sm ring-1 ring-blue-100 overflow-hidden'>
                                  {/* Header bar */}
                                  <div className='flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100'>
                                    <div className='flex items-center gap-2'>
                                      <span className='grid h-5.5 w-4.5 place-items-center rounded-xl bg-blue-600 text-white text-[9px]'>
                                        ℹ
                                      </span>
                                      <span className='text-[12px] font-extrabold text-blue-700 tracking-tight'>
                                        Detail Informasi Lengkap
                                      </span>
                                    </div>
                                    <button
                                      onClick={() =>
                                        router.push(
                                          `/input-reservasi?id=${encodeURIComponent(selected._id)}`,
                                        )
                                      }
                                      className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-gray-900 text-[10px] font-bold transition-all duration-150 shadow-sm cursor-pointer'
                                    >
                                      <LucidePenBox size={11} strokeWidth={2.5} />
                                      Revisi Data Ini
                                    </button>
                                  </div>

                                  {/* Detail grid */}
                                  <div className='grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2 px-5 py-4'>
                                    {/* COL 1 */}
                                    <div className='flex flex-col gap-2.5'>
                                      <DetailItem
                                        icon='📅'
                                        label='Tanggal Input'
                                        value={
                                          selected.created_at
                                            ? new Date(selected.created_at)
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
                                        value={selected.nama_admin}
                                      />
                                      <DetailItem
                                        icon='👨‍💼'
                                        label='Nama Tamu'
                                        value={selected.nama_tamu}
                                      />
                                      <DetailItem
                                        icon='📞'
                                        label='No Telp Tamu'
                                        value={selected.nomor_telp}
                                      />
                                    </div>

                                    {/* COL 2 */}
                                    <div className='flex flex-col gap-2.5'>
                                      <DetailItem
                                        icon='📅'
                                        label='Tanggal Reservasi'
                                        value={selected.tanggal_reservasi}
                                      />
                                      <DetailItem
                                        icon='🏢'
                                        label='Unit'
                                        value={selected.unit}
                                      />
                                      <DetailItem
                                        icon='🕖'
                                        label='Durasi'
                                        value={selected.durasi}
                                      />
                                      <DetailItem
                                        icon='⏰'
                                        label='Check In & Check Out'
                                        value={selected.checkin_checkout}
                                      />
                                    </div>

                                    {/* COL 3 */}
                                    <div className='flex flex-col gap-2.5'>
                                      <DetailItem
                                        icon='💰'
                                        label='Harga'
                                        value={selected.harga}
                                      />
                                      <DetailItem
                                        icon='💸'
                                        label='Uang Masuk'
                                        value={selected.masuk}
                                      />
                                      <DetailItem
                                        icon='💳'
                                        label='Sisa Pembayaran'
                                        value={selected.sisa}
                                      />
                                      <DetailItem
                                        icon='🏠'
                                        label='Apart'
                                        value={selected.apart}
                                      />
                                    </div>
                                  </div>

                                  {/* Notes */}
                                  {(selected.note_pelunasan !== '-' || selected.note_admin !== '-') && (
                                    <div className='border-t border-gray-100 px-5 py-3'>
                                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                        <DetailItem
                                          icon='📝'
                                          label='Note Pelunasan'
                                          value={selected.note_pelunasan}
                                        />
                                        <DetailItem
                                          icon='📋'
                                          label='Note Admin'
                                          value={selected.note_admin}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > pageSize && (
              <div className='flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white'>
                <div className='text-[10px] text-slate-500'>
                  Halaman {safePage} dari {totalPages} ({total} data)
                </div>
                <div className='flex items-center gap-1'>
                  <button
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className='px-2.5 py-1 text-[10px] font-semibold rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors'
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (safePage <= 3) {
                      pageNum = i + 1
                    } else if (safePage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = safePage - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          'px-2.5 py-1 text-[10px] font-semibold rounded-md cursor-pointer transition-colors',
                          pageNum === safePage
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50',
                        )}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className='px-2.5 py-1 text-[10px] font-semibold rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors'
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
