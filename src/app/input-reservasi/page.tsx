'use client'

import * as React from 'react'

import { ArrowBigLeft, Building, DollarSign, UserIcon } from 'lucide-react'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useSession } from '@/components/session/SessionProvider'
import { getUnitOptions } from '@/data/typeunit'
import { useRouter } from 'next/navigation'

type Admin = {
  full_name: string,
  username: string,
}

const dataDurasi = [
  // { value: '1 Malam', label: '1 Malam' },
  { value: 'Halfday Malam', label: 'Halfday Malam' },
  { value: 'Transit', label: 'Transit' },
]

// ✅ Helper: validasi format waktu HH:MM (24 jam)
function isValidTime(val: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(val.trim())
}

// ✅ Helper: format input waktu secara otomatis (auto-tambah ':')
function formatTimeInput(raw: string): string {
  // Hanya izinkan angka dan ':'
  let cleaned = raw.replace(/[^\d:]/g, '')
  // Auto-insert ':' setelah 2 digit jika user belum ketik ':'
  if (cleaned.length >= 3 && !cleaned.includes(':')) {
    cleaned = cleaned.slice(0, 2) + ':' + cleaned.slice(2)
  }
  // Batasi panjang ke 5 karakter (HH:MM)
  return cleaned.slice(0, 5)
}

// ✅ Helper: format angka ke Rupiah (tampilan client)
function formatRupiah(value: number | string): string {
  const num = typeof value === 'string' ? parseInt(value.replace(/\D/g, ''), 10) : value
  if (!num && num !== 0) return ''
  return 'Rp ' + num.toLocaleString('id-ID')
}

// ✅ Helper: parse string Rupiah ke angka murni
function parseRupiah(value: string): number {
  const cleaned = value.replace(/\D/g, '')
  return parseInt(cleaned, 10) || 0
}

function calculateSisaPembayaran(dataHarga: number, uangMasuk: number): number {
  const sisa = dataHarga - uangMasuk
  return sisa
}

export default function InputReservasiPage() {
  const router = useRouter()
  const { user } = useSession()
  const [namaAdmin, setNamaAdmin] = useState('')
  const [noTelp, setNoTelp] = useState('')
  const [namaTamu, setNamaTamu] = useState('')
  const [namaUnit, setNamaUnit] = useState('')
  const [dataHarga, setDataHarga] = useState<number>(0)
  const [dataDuration, setNamaDuration] = useState('')
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null])
  const [startDate, endDate] = dateRange
  const [checkInText, setCheckInText] = useState('')
  const [checkOutText, setCheckOutText] = useState('')
  const [checkInError, setCheckInError] = useState('')
  const [checkOutError, setCheckOutError] = useState('')
  const [isMultiDay, setIsMultiDay] = useState(false)
  const [isSingleDay, setIsSingleDay] = useState(false)
  const [uangMasuk, setUangMasuk] = useState<number>(0)
  const [sisaPembayaran, setSisaPembayaran] = useState<number | null>(null)
  const [phoneSuggestions, setPhoneSuggestions] = useState<{telp: string, nama: string}[]>([])
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false)

  // ✅ Auto-fill nama admin dari session user yang login
  useEffect(() => {
    if (user?.fullName && !namaAdmin) {
      setNamaAdmin(user.fullName)
    }
  }, [user, namaAdmin])

  // ✅ Autocomplete nomor telepon
  useEffect(() => {
    if (noTelp.length >= 3) {
      const fetchSuggestions = async () => {
        try {
          const res = await fetch(`/api/reservasi?phone=${noTelp}`)
          if (res.ok) {
            const { data } = await res.json()
            setPhoneSuggestions(data || [])
            setShowPhoneSuggestions(true)
          }
        } catch (err) {
          console.error(err)
        }
      }
      const timeoutId = setTimeout(fetchSuggestions, 300)
      return () => clearTimeout(timeoutId)
    } else {
      setPhoneSuggestions([])
      setShowPhoneSuggestions(false)
    }
  }, [noTelp])

  // ✅ Auto-kalkulasi sisa pembayaran setiap kali dataHarga atau uangMasuk berubah
  useEffect(() => {
    setSisaPembayaran(calculateSisaPembayaran(dataHarga, uangMasuk))
  }, [dataHarga, uangMasuk])
  const [notePelunasan, setNotePelunasan] = useState('')
  const [noteTamu, setNoteTamu] = useState('')
  const [apart, setApart] = useState('')
  // ✅ Auto-kalkulasi durasi dan teks check-in/out ketika date range berubah
  useEffect(() => {
    if (startDate) {
      if (endDate && endDate.getTime() !== startDate.getTime()) {
        // Multi-day: auto-fill durasi, check-in dan check-out
        const nights = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        setIsMultiDay(true);
        if (nights > 0) {
          setNamaDuration(`${nights} Malam`);
        }
        setIsSingleDay(false);
        if (nights === 1) {
          setNamaDuration('1 Malam');
          setIsSingleDay(true);
        }
        setCheckInText(`14:00 (${startDate.toLocaleDateString('id-ID')})`);
        setCheckOutText(`12:00 (${endDate.toLocaleDateString('id-ID')})`);
        setCheckInError('');
        setCheckOutError('');
      } else {
        // Single-day: user isi durasi & jam manual
        setIsMultiDay(false);
        setNamaDuration('');
        setCheckInText('');
        setCheckOutText('');
      }
    } else {
      setIsMultiDay(false);
      setNamaDuration('');
      setCheckInText('');
      setCheckOutText('');
    }
  }, [startDate, endDate])
  const [items, setItems] = useState<
    {
      id: string
      nama: string
      no_telp: string
    }[]
  >(() => [
    {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      nama: '',
      no_telp: '',
    },
  ])

  const updateItem = (index: number, field: string, value: string) => {
    setItems((prev) => {
      const newItems = [...prev]
      newItems[index] = { ...newItems[index], [field]: value }
      return newItems
    })
  }

  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [newInvoiceId, setNewInvoiceId] = useState('')


  // ✅ handleKirim sekarang hanya berisi logika submit, tidak ada JSX
  const handleKirim = async () => {
    // 1. Validasi DULU
    const requiredText: { value: string; label: string }[] = [
      { value: namaAdmin, label: 'Nama Admin' },
      { value: namaTamu, label: 'Nama Tamu' },
      { value: namaUnit, label: 'Nama Unit' },
      { value: dataDuration, label: 'Data Duration' },
      { value: notePelunasan, label: 'Note Pelunasan' },
      { value: noteTamu, label: 'Note Tamu' },
      { value: apart, label: 'Apart' },
    ]

    for (const field of requiredText) {
      if (!field.value) {
        alert(`Field ${field.label} harus diisi!`)
        return
      }
    }

    // Validasi field harga (angka, harus >= 0)
    const requiredPrice: { value: number; label: string; min: number }[] = [
      { value: dataHarga, label: 'Harga Unit', min: 1 },
      { value: uangMasuk, label: 'Uang Masuk', min: 1 },
      { value: sisaPembayaran ?? 0, label: 'Sisa Pembayaran', min: 0 },
    ]

    for (const field of requiredPrice) {
      if (field.value === undefined || field.value === null || field.value < field.min) {
        alert(`Field ${field.label} tidak valid. Minimal Rp ${field.min}!`)
        return
      }
    }

    // 2a. Validasi waktu check-in/check-out
    if (!isMultiDay) {
      if (!isValidTime(checkInText)) {
        alert('Format Check In tidak valid! Gunakan format HH:MM (contoh: 14:00)')
        return
      }
      if (!isValidTime(checkOutText)) {
        alert('Format Check Out tidak valid! Gunakan format HH:MM (contoh: 12:00)')
        return
      }
    }

    // 2b. Konversi date/time ke string SETELAH validasi
    const tanggalReservasi = startDate
      ? startDate.toLocaleDateString('id-ID')
      : ''
    // Untuk single-day, gabungkan jam + tanggal
    const checkInStr = isMultiDay
      ? checkInText
      : `${checkInText} (${startDate?.toLocaleDateString('id-ID') || ''})`
    const checkOutStr = isMultiDay
      ? checkOutText
      : `${checkOutText} (${startDate?.toLocaleDateString('id-ID') || ''})`

    // 3. Kirim ke API dengan format { header, items } sesuai route.ts
    try {
      const response = await fetch('/api/reservasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          header: {
            userId: user?.userId || '',
            namaAdmin,
            tanggalReservasi,
            namaUnit,
            dataDuration,
            checkIn: checkInStr,
            checkOut: checkOutStr,
            dataHarga,
            uangMasuk,
            sisaPembayaran,
            notePelunasan,
            noteAdmin: noteTamu,
            namaApart: apart,
          },
          items: [
            {
              nama_tamu: namaTamu,
              no_tamu: noTelp,
            },
          ],
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        alert('Gagal menyimpan: ' + result.error)
        return
      }
      
      const newId = result.insertedIds && result.insertedIds["0"] ? result.insertedIds["0"] : null
      if (newId) {
        setNewInvoiceId(newId)
        setShowInvoiceModal(true)
      } else {
        alert('Reservasi berhasil disimpan!')
        router.push('/room-status')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Terjadi kesalahan koneksi')
    }
  }

  // ✅ return JSX sekarang di level komponen
  return (
    <div className='min-h-screen'>
      <div className='flex'>
        <div className='flex-1 p-6'>
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 border border-gray-100 dark:border-gray-700'>
            <div className='flex flex-col'>
              <h1 className='text-2xl pl-4 font-extrabold text-gray-900 dark:text-white drop-shadow-sm'>
                Panel Admin
              </h1>
              <div className='text-sm ml-4 mt-2 text-slate-500 font-medium'>
                Form Input Reservasi
              </div>
              <button className='text-white text-right px-4 py-2 rounded-xl' onClick={(() => router.push('/room-status'))}>
                <ArrowBigLeft
                  className='text-white bg-[#0F172A] rounded-2xl p-1 px-2 cursor-pointer hover:bg-[#0F172A]/80 transition-colors'
                  size={28}
                />
              </button>
            </div>
          </div>
          <section className='mt-4 rounded-xl bg-white dark:bg-gray-800 p-8 shadow-sm ring-1 ring-black/5 dark:ring-white/10'>
            <div className='flex items-center gap-3 mb-6'>
              <Building
                className='text-white bg-[#0F172A] rounded-2xl p-1 px-2'
                size={38}
              />
              <div className='flex flex-col'>
                <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
                  Informasi Tamu Reservasi
                </h2>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Data Tamu, Unit, Duration, Tanggal dan Checkin & Checkout
                </p>
              </div>
            </div>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
              <div>
                <label className='text-sm font-semibold text-gray-900 dark:text-gray-200'>
                  NAMA ADMIN
                </label>
                <div className='mt-2'>
                  <input
                    type="text"
                    value={namaAdmin}
                    onChange={(e) => setNamaAdmin(e.target.value)}
                    placeholder="Nama Admin"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 dark:hover:border-gray-500"
                  />
                </div>
              </div>
              <div>
                <label className='text-sm font-semibold text-gray-900 dark:text-gray-200'>
                  Tanggal Reservasi
                </label>
                <div className='mt-2'>
                  <DatePicker
                    selectsRange={true}
                    startDate={startDate || undefined}
                    endDate={endDate || undefined}
                    onChange={(update: [Date | null, Date | null]) => setDateRange(update)}
                    dateFormat='dd/MM/yyyy'
                    placeholderText='Pilih rentang tanggal'
                    wrapperClassName='w-full'
                    minDate={new Date()}
                    className='w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer'
                  />
                </div>
              </div>
              <div>
                <label className='text-sm font-semibold text-gray-900 dark:text-gray-200'>
                  UNIT
                </label>
                <div className='mt-2'>
                  <SearchableSelect
                    value={
                      getUnitOptions().find((option) => option.value === namaUnit)
                        ?.label || ''
                    }
                    onChange={(val: string) => setNamaUnit(val)}
                    options={getUnitOptions()}
                  />
                </div>
              </div>
              <div>
                <label className='text-sm font-semibold text-gray-900 dark:text-gray-200'>
                  DURATION
                </label>
                <div className='mt-2'>
                  {isMultiDay ? (
                    <input
                      type='text'
                      readOnly
                      value={dataDuration}
                      className='w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-green-50 dark:bg-green-900/30 text-sm font-semibold text-green-700 dark:text-green-400 shadow-sm cursor-not-allowed'
                    />
                  ) : (
                    <SearchableSelect
                      value={
                        dataDurasi.find((option) => option.value === dataDuration)?.label || dataDuration || ''
                      }
                      onChange={(val: string) => setNamaDuration(val)}
                      options={[
                        ...dataDurasi,
                        ...(dataDuration && !dataDurasi.some(d => d.value === dataDuration) 
                          ? [{ value: dataDuration, label: dataDuration }] 
                          : [])
                      ].map((p) => ({
                        value: p.value,
                        label: p.label,
                      }))}
                    />
                  )}
                </div>
              </div>
              <div>
                <div className='flex pl-4 gap-2'>
                  <label className='text-sm justify-content items-center font-semibold text-blue-[#0F172A]'>
                    Check In
                  </label>
                  {isMultiDay && (
                    <span className='text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium'>Auto</span>
                  )}
                </div>
                <div className='gap-2 mt-2 p-2 border rounded-xl border-gray-200'>
                  {/* Check In */}
                  <div className='flex flex-col gap-1'>
                    {isMultiDay ? (
                      <input
                        type='text'
                        readOnly
                        value={checkInText}
                        className='w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-green-50 dark:bg-green-900/30 text-sm font-semibold text-green-700 dark:text-green-400 shadow-sm cursor-not-allowed'
                      />
                    ) : (
                      <>
                        <input
                          type='text'
                          value={checkInText}
                          onChange={(e) => {
                            const formatted = formatTimeInput(e.target.value)
                            setCheckInText(formatted)
                            if (formatted.length === 5 && !isValidTime(formatted)) {
                              setCheckInError('Format waktu tidak valid (HH:MM, 00:00 - 23:59)')
                            } else {
                              setCheckInError('')
                            }
                          }}
                          onBlur={() => {
                            if (checkInText && !isValidTime(checkInText)) {
                              setCheckInError('Format waktu tidak valid (HH:MM, 00:00 - 23:59)')
                            }
                          }}
                          placeholder='Contoh: 14:00'
                          maxLength={5}
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:border-transparent hover:border-gray-400 ${
                            checkInError
                              ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-300'
                              : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-white focus:ring-blue-500'
                          }`}
                        />
                        {checkInError && (
                          <span className='text-xs text-red-500 mt-1 pl-1'>{checkInError}</span>
                        )}
                        {startDate && !checkInError && checkInText && (
                          <span className='text-xs text-gray-400 mt-1 pl-1'>
                            → {checkInText} ({startDate.toLocaleDateString('id-ID')})
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <div className='flex pl-4 gap-2'>
                  <label className='text-sm justify-content items-center font-semibold text-blue-[#0F172A]'>
                    Check Out
                  </label>
                  {isMultiDay && (
                    <span className='text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium'>Auto</span>
                  )}
                </div>
                {/* Check Out */}
                <div className='gap-2 mt-2 p-2 border rounded-xl border-gray-200'>
                  <div className='flex flex-col gap-1'>
                    {isMultiDay ? (
                      <input
                        type='text'
                        readOnly
                        value={checkOutText}
                        className='w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-green-50 dark:bg-green-900/30 text-sm font-semibold text-green-700 dark:text-green-400 shadow-sm cursor-not-allowed'
                      />
                    ) : (
                      <>
                        <input
                          type='text'
                          value={checkOutText}
                          onChange={(e) => {
                            const formatted = formatTimeInput(e.target.value)
                            setCheckOutText(formatted)
                            if (formatted.length === 5 && !isValidTime(formatted)) {
                              setCheckOutError('Format waktu tidak valid (HH:MM, 00:00 - 23:59)')
                            } else {
                              setCheckOutError('')
                            }
                          }}
                          onBlur={() => {
                            if (checkOutText && !isValidTime(checkOutText)) {
                              setCheckOutError('Format waktu tidak valid (HH:MM, 00:00 - 23:59)')
                            }
                          }}
                          placeholder='Contoh: 12:00'
                          maxLength={5}
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:border-transparent hover:border-gray-400 ${
                            checkOutError
                              ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-300'
                              : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-white focus:ring-blue-500'
                          }`}
                        />
                        {checkOutError && (
                          <span className='text-xs text-red-500 mt-1 pl-1'>{checkOutError}</span>
                        )}
                        {startDate && !checkOutError && checkOutText && (
                          <span className='text-xs text-gray-400 mt-1 pl-1'>
                            → {checkOutText} ({startDate.toLocaleDateString('id-ID')})
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className='mt-4 rounded-xl bg-white dark:bg-gray-800 p-8 shadow-sm ring-1 ring-black/5 dark:ring-white/10'>
            <div className='flex items-center gap-3 mb-6'>
              <UserIcon
                className='text-white bg-[#0F172A] rounded-2xl p-1 px-2'
                size={38}
              />
              <div className='flex flex-col'>
                <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
                  Informasi Tamu
                </h2>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Informasi harga unit, uang masuk, sisa pembayaran
                </p>
              </div>
            </div>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
              <div>
                <label className='text-sm font-semibold text-gray-900 dark:text-gray-200'>
                  NAMA TAMU
                </label>
                <div className='mt-2 h-12 ring-2 py-2.5 ring-gray-200 dark:ring-gray-600 rounded-xl px-4 dark:text-white'>
                  <input
                    value={namaTamu}
                    onChange={(e) => setNamaTamu(e.target.value)}
                    type='text'
                    placeholder='Masukkan nama tamu'
                    className='text-gray-900 dark:text-white bg-transparent w-full focus:outline-none focus:ring-0 focus:border-transparent'
                  />
                </div>
              </div>
              <div className='relative'>
                <label className='text-sm font-semibold text-gray-900 dark:text-gray-200'>
                  NOMOR TELEPON TAMU
                </label>
                <div className='mt-2 h-12 ring-2 py-2.5 ring-gray-200 dark:ring-gray-600 rounded-xl px-4 dark:text-white'>
                  <input
                    value={noTelp}
                    onChange={(e) => { setNoTelp(e.target.value) }}
                    onFocus={() => {
                      if (phoneSuggestions.length > 0) setShowPhoneSuggestions(true)
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowPhoneSuggestions(false), 200)
                    }}
                    type='text'
                    maxLength={15}
                    placeholder='Masukkan nomor telepon tamu'
                    className='text-gray-900 dark:text-white bg-transparent w-full focus:outline-none focus:ring-0 focus:border-transparent bg-transparent'
                  />
                </div>
                {showPhoneSuggestions && phoneSuggestions.length > 0 && (
                  <ul className='absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-xl shadow-lg max-h-48 overflow-y-auto'>
                    {phoneSuggestions.map((sug, idx) => (
                      <li
                        key={`${sug.telp}-${idx}`}
                        className='px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 flex justify-between items-center'
                        onMouseDown={(e) => {
                          e.preventDefault()
                          setNoTelp(sug.telp)
                          setNamaTamu(sug.nama)
                          setShowPhoneSuggestions(false)
                        }}
                      >
                        <span className='font-semibold'>{sug.telp}</span>
                        <span className='text-xs text-gray-500 truncate ml-2'>{sug.nama}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
          <section className='mt-4 rounded-xl bg-white dark:bg-gray-800 p-8 shadow-sm ring-1 ring-black/5 dark:ring-white/10'>
            <div className='flex items-center gap-3 mb-6'>
              <DollarSign
                className='text-white bg-[#0F172A] rounded-2xl p-1 px-2'
                size={38}
              />
              <div className='flex flex-col'>
                <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
                  Form Harga
                </h2>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Informasi harga unit, uang masuk, sisa pembayaran
                </p>
              </div>
            </div>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
              <div>
                <label className='text-large font-semibold uppercase text-gray-900 dark:text-gray-200'>
                  Harga Unit
                </label>
                <div className='mt-2 h-12 ring-2 py-2.5 ring-gray-200 dark:ring-gray-600 rounded-xl px-4 dark:text-white'>
                  <input
                    value={dataHarga ? formatRupiah(dataHarga) : ''}
                    onChange={(e) => setDataHarga(parseRupiah(e.target.value))}
                    type='text'
                    inputMode='numeric'
                    placeholder='Rp 0'
                    className='w-full focus:outline-none focus:ring-0 focus:border-transparent'
                  />
                  {/* <PriceInput
                    value={
                      hargaData.find((option) => option.value === String(dataHarga))
                        ?.value || ''
                    }
                    onChange={(val: string) => setDataHarga(parseInt(val, 10) || 0)}
                    options={hargaData.map((p) => ({
                      value: p.value,
                      label: p.label,
                    }))}
                  /> */}
                </div>
              </div>
              <div>
                <label className='text-large font-semibold uppercase text-gray-900 dark:text-gray-200'>
                  Uang Masuk
                </label>
                <div className='mt-2 h-12 ring-2 py-2.5 ring-gray-200 dark:ring-gray-600 rounded-xl px-4 dark:text-white'>
                  <input
                    value={uangMasuk ? formatRupiah(uangMasuk) : ''}
                    onChange={(e) => setUangMasuk(parseRupiah(e.target.value))}
                    type='text'
                    inputMode='numeric'
                    placeholder='Rp 0'
                    className='w-full focus:outline-none focus:ring-0 focus:border-transparent'
                  />
                </div>
              </div>
              <div>
                <label className='text-large font-semibold uppercase text-gray-900 dark:text-gray-200'>
                  Sisa Pembayaran
                </label>
                <div className='mt-2 h-12 ring-2 py-2.5 ring-gray-200 dark:ring-gray-600 rounded-xl px-4 dark:text-white'>
                  <input
                    readOnly
                    value={formatRupiah(sisaPembayaran ?? 0)}
                    type='text'
                    inputMode='numeric'
                    placeholder='Rp 0'
                    className='text-gray-900 dark:text-white bg-transparent w-full focus:outline-none focus:ring-0 focus:border-transparent'
                  />
                </div>
              </div>
            </div>
          </section>
          <section className='mt-4 rounded-xl bg-white dark:bg-gray-800 p-8 shadow-sm ring-1 ring-black/5 dark:ring-white/10'>
            <div className='flex items-center gap-3 mb-6'>
              <UserIcon
                className='text-white bg-[#0F172A] rounded-2xl p-1 px-2'
                size={38}
              />
              <div className='flex flex-col'>
                <h2 className='text-sm font-semibold text-gray-900 dark:text-white'>
                  Form Note Admin
                </h2>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Informasi Note Admin, Note Pelunasan, Note Pembatalan, dll
                </p>
              </div>
            </div>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
              <div>
                <label className='text-large font-semibold uppercase text-gray-900 dark:text-gray-200'>
                  Note Pelunasan
                </label>
                <div className='mt-2'>
                  <SearchableSelect
                    value={notePelunasan}
                    onChange={(val: string) => setNotePelunasan(val)}
                    options={[
                      { value: 'FULL CASH', label: 'FULL CASH' },
                      { value: 'PELUNASAN CASH', label: 'PELUNASAN CASH' },
                      { value: 'FULL TRANSFER', label: 'FULL TRANSFER' },
                      { value: 'QRIS EDC', label: 'QRIS EDC' },
                      { value: 'PELUNASAN QRIS EDC', label: 'PELUNASAN QRIS EDC' },
                      { value: 'PELUNASAN CASH', label: 'PELUNASAN CASH' },
                      { value: 'PELUNASAN DEBIT EDC ', label: 'PELUNASAN DEBIT EDC' },
                      { value: 'FULL EDC', label: 'FULL EDC' },
                      { value: 'SISA PELUNASAN', label: 'SISA PELUNASAN' },
                      { value: 'ZUZU', label: 'ZUZU' },
                      { value: 'AGODA', label: 'AGODA' },
                    ]}
                  />
                </div>
              </div>
              <div>
                <label className='text-large font-semibold uppercase text-gray-900 dark:text-gray-200'>
                  Note Tamu / Admin
                </label>
                <div className='mt-2 h-12 ring-2 py-2.5 ring-gray-200 dark:ring-gray-600 rounded-xl px-4 dark:text-white'>
                  <input
                    value={noteTamu}
                    onChange={(e) => setNoteTamu(e.target.value)}
                    type='text'
                    placeholder='Masukkan note tamu atau admin'
                    className='text-gray-900 dark:text-white bg-transparent w-full focus:outline-none focus:ring-0 focus:border-transparent'
                  />
                </div>
              </div>
              <div>
                <label className='text-large font-semibold uppercase text-gray-900 dark:text-gray-200'>
                  Apart
                </label>
                <div className='mt-2'>
                  <SearchableSelect
                    value={apart}
                    onChange={(val: string) => setApart(val)}
                    options={[
                      { value: 'JARDIN', label: 'JARDIN' },
                      { value: 'GAA', label: 'GAA' },
                    ]}
                  />
                </div>
              </div>
            </div>
          </section>
          <div className='flex justify-center mt-6'>
            <button
              onClick={handleKirim}
              className='inline-flex items-center gap-2 rounded-md bg-[#0F172A] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F172A]/90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            >
              Kirim Data Reservasi
            </button>
          </div>
        </div>
      </div>

      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 text-center transform transition-all">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Reservasi Berhasil!</h3>
            <p className="text-gray-500 mb-8 text-sm">
              Data reservasi telah tersimpan. Apakah Anda ingin mencetak invoice sekarang?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push(`/invoice/${newInvoiceId}`)}
                className="w-full bg-[#0B6AA9] text-white rounded-xl py-3 font-semibold hover:bg-[#09578b] transition-colors"
              >
                Ya, Print Invoice
              </button>
              <button
                onClick={() => router.push('/room-status')}
                className="w-full bg-gray-100 text-gray-700 rounded-xl py-3 font-semibold hover:bg-gray-200 transition-colors"
              >
                Tidak, Lanjut ke Room Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
