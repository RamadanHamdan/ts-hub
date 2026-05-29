'use client'

import {
  Filter,
  ChevronDown,
  Calendar,
  CalendarDays,
  Building2,
  Clock,
  X,
} from 'lucide-react'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

type ReservasiRow = {
  bulan: string
  unit: string
  durasi: string
  harga: string
}

type FilterOptions = {
  bulan: string[]
  unit: string[]
  durasi: string[]
  harga: string[]
}

const BULAN_NAMES: Record<string, string> = {
  '01': 'January',
  '02': 'February',
  '03': 'March',
  '04': 'April',
  '05': 'May',
  '06': 'June',
  '07': 'July',
  '08': 'August',
  '09': 'September',
  '10': 'October',
  '11': 'November',
  '12': 'December',
}

function formatBulan(val: string): string {
  const [yyyy, mm] = val.split('-')
  if (!yyyy || !mm) return val
  return `${BULAN_NAMES[mm] ?? mm}-${yyyy}`
}

export default function TrackingReservasiPage() {
  const filterButtons = [
    { id: 'Bulan', icon: CalendarDays, label: 'Bulan' },
    { id: 'Unit', icon: Building2, label: 'Unit' },
    { id: 'Durasi', icon: Clock, label: 'Durasi' },
  ]

  const [bulan, setBulan] = useState<string[]>([])
  const [unit, setUnit] = useState<string[]>([])
  const [durasi, setDurasi] = useState<string[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const selectAllFilter = (id: string, opts: string[]) => {
    setFilterArr(id, [...opts])
  }

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    bulan: [],
    unit: [],
    durasi: [],
    harga: [],
  })

  // pagination
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<ReservasiRow | null>(null)

  // dropdown filter
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [dropdownSearch, setDropdownSearch] = useState<Record<string, string>>(
    {},
  )

  const dropdownRef = useRef<HTMLDivElement>(null)

  const getFilterArr = useCallback(
    (id: string): string[] => {
      switch (id) {
        case 'Bulan':
          return bulan
        case 'Unit':
          return unit
        case 'Durasi':
          return durasi
        default:
          return []
      }
    },
    [bulan, unit, durasi],
  )

  const setFilterArr = (id: string, vals: string[]) => {
    switch (id) {
      case 'Bulan':
        setBulan(vals)
        break
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
        case 'Bulan':
          return filterOptions.bulan
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
  return (
    <div className='min-h-screen'>
      <div className='flex'>
        <div className='flex-1 p-6'>
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
          <section className='bg-white rounded-xl shadow-sm border border-gray-200'>
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
                  (Top 1 Unit, Total Pendapatan Per Unit, Pendapatan Unit By
                  Category)
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

            {/* {Konten Filter} */}
            <div
              className='p-3 sm:p-4 flex flex-col gap-3'
              style={{ display: isFilterOpen ? 'flex' : 'none' }}
            >
              {/* {Filter Tanggal} */}
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
                    ? opts.filter((o) => {
                        const display = btn.id === 'Bulan' ? formatBulan(o) : o
                        return display
                          .toLowerCase()
                          .includes(search.toLowerCase())
                      })
                    : opts
                  const allSelected =
                    opts.length > 0 && opts.every((o) => activeArr.includes(o))
                  const isOpen = openDropdown === btn.id
                  return (
                    <div key={btn.id} className='relative'>
                      {/* Trigger button - pill putih, border highlight biru saat diklik */}
                      <button
                        type='button'
                        onClick={() => setOpenDropdown(isOpen ? null : btn.id)}
                        className={`w-full flex items-center justify-between gap-1 py-[7px] px-3 text-[11px] font-semibold rounded-lg cursor-pointer ${
                          isOpen
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
                            size={10}
                            className={`ml-0.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </span>
                      </button>

                      {/* Dropdown panel - to front, shadow kuat */}
                      {isOpen && (
                        <div
                          className='absolute top-[calc(100%+4px)] left-0 z-[9999] w-56 bg-white rounded-lg flex flex-col'
                          style={{
                            boxShadow:
                              '0 12px 40px -4px rgba(0,0,0,0.2), 0 4px 12px -2px rgba(0,0,0,0.08)',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          {/* Search langsung, tanpa header */}
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
                                      onChange={() =>
                                        toggleFilterVal(btn.id, opt)
                                      }
                                      className='accent-blue-600 w-3.5 h-3.5 shrink-0'
                                    />
                                    <span
                                      className={`text-[11px] truncate ${checked ? 'font-semibold text-blue-700' : 'text-slate-700'}`}
                                    >
                                      {btn.id === 'Bulan'
                                        ? formatBulan(opt)
                                        : opt}
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
                Klik tombol filter → centang pilihan. Bisa pilih lebih dari
                satu.
                {(filterButtons.some((b) => getFilterArr(b.id).length > 0) ||
                  startDate ||
                  endDate) && (
                  <span className='text-blue-600 font-semibold ml-1'>
                    Menampilkan {total.toLocaleString()} data
                  </span>
                )}
              </div>

              {/* ---- Chips row: active selections ---- */}
              {filterButtons.some((b) => getFilterArr(b.id).length > 0) && (
                <div className='flex flex-wrap gap-1 mt-0.5'>
                  {filterButtons.flatMap((btn) =>
                    getFilterArr(btn.id).map((val) => (
                      <span
                        key={`${btn.id}-${val}`}
                        className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 border border-blue-200'
                      >
                        {btn.label}:{' '}
                        {btn.id === 'Bulan' ? formatBulan(val) : val}
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
        </div>
      </div>
    </div>
  )
}
