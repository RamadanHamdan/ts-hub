'use client'

import * as React from 'react'

import { ArrowBigLeft, Building, DollarSign, UserIcon } from 'lucide-react'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import PriceInput from '@/components/ui/PriceInput'
import { useSession } from '@/components/session/SessionProvider'
import { getUnitOptions } from '@/data/typeunit'
import { useRouter } from 'next/navigation'

// ✅ Array data dipindah ke luar komponen (tidak perlu re-create setiap render)
// const dataUnit = [
//   { value: 'TD.1134', label: 'TD.1134' },
//   { value: 'TB.1534', label: 'TB.1534' },
//   { value: 'TA.2118', label: 'TA.2118' },
//   { value: 'TA.0812', label: 'TA.0812' },
//   { value: 'TC.0826', label: 'TC.0826' },
//   { value: 'TA.0933', label: 'TA.0933' },
//   { value: 'TC.1608', label: 'TC.1608' },
//   { value: 'TC.0630', label: 'TC.0630' },
//   { value: 'TA.0931', label: 'TA.0931' },
//   { value: 'TA.0932', label: 'TA.0932' },
//   { value: 'TB.1728', label: 'TB.1728' },
//   { value: 'TB.0919', label: 'TB.0919' },
//   { value: 'TC.1727', label: 'TC.1727' },
//   { value: 'TD.1028', label: 'TD.1028' },
//   { value: 'TD.2126', label: 'TD.2126' },
//   { value: 'TA.1126', label: 'TA.1126' },
//   { value: 'TC.0507', label: 'TC.0507' },
//   { value: 'GAA TB.0508', label: 'GAA TB.0508' },
//   { value: 'GAA TC.0528', label: 'GAA TC.0528' },
//   { value: 'GAA TB.0622', label: 'GAA TB.0622' },
//   { value: 'GAA TB.0510', label: 'GAA TB.0510' },
//   { value: 'TB.0510 GAA', label: 'TB.0510 GAA' },
// ]

const dataDurasi = [
  { value: '1 Malam', label: '1 Malam' },
  { value: 'Halfday Malam', label: 'Halfday Malam' },
  { value: 'Transit', label: 'Transit' },
  { value: 'Extend', label: 'Extend' },
]

const hargaData = [
  { value: '500000', label: 'Rp 500.000' },
  { value: '750000', label: 'Rp 750.000' },
  { value: '1000000', label: 'Rp 1.000.000' },
  { value: '1250000', label: 'Rp 1.250.000' },
]

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
  const [namaAdmin, setNamaAdmin] = useState('')
  const [noTelp, setNoTelp] = useState('')
  const [namaTamu, setNamaTamu] = useState('')
  const [namaUnit, setNamaUnit] = useState('')
  const [dataHarga, setDataHarga] = useState<number>(0)
  const [dataDuration, setNamaDuration] = useState('')
  const [checkIn, setCheckIn] = useState<Date | null>(null)
  const [checkOut, setCheckOut] = useState<Date | null>(null)
  const [uangMasuk, setUangMasuk] = useState<number>(0)
  const [sisaPembayaran, setSisaPembayaran] = useState<number | null>(null)
  const [phoneSuggestions, setPhoneSuggestions] = useState<{telp: string, nama: string}[]>([])
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false)

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
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

  const { user } = useSession()

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

    // 2. Konversi date/time ke string SETELAH validasi
    const tanggalReservasi = selectedDate
      ? selectedDate.toLocaleDateString('id-ID')
      : ''
    const checkInStr = checkIn ? checkIn.toTimeString().slice(0, 5) : ''
    const checkOutStr = checkOut ? checkOut.toTimeString().slice(0, 5) : ''

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
      router.push('/room-status')
      alert('Reservasi berhasil disimpan!')
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
          <div className='bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100'>
            <div className='flex flex-col'>
              <h1 className='text-2xl pl-4 font-extrabold text-black drop-shadow-sm'>
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
          <section className='mt-4 rounded-xl bg-white p-8 shadow-sm ring-1 ring-black/5'>
            <div className='flex items-center gap-3 mb-6'>
              <Building
                className='text-white bg-[#0F172A] rounded-2xl p-1 px-2'
                size={38}
              />
              <div className='flex flex-col'>
                <h2 className='text-sm font-semibold text-gray-900'>
                  Informasi Tamu Reservasi
                </h2>
                <p className='text-sm text-gray-500'>
                  Data Tamu, Unit, Duration, Tanggal dan Checkin & Checkout
                </p>
              </div>
            </div>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
              <div>
                <label className='text-sm font-semibold text-blue-[#0F172A]'>
                  NAMA ADMIN
                </label>
                <div className='mt-2'>
                  <SearchableSelect
                    value={namaAdmin}
                    onChange={(val: string) => setNamaAdmin(val)}
                    options={[
                      { value: 'RAMA', label: 'RAMA' },
                      { value: 'AKBAR', label: 'AKBAR' },
                    ]}
                  />
                </div>
              </div>
              <div>
                <label className='text-sm font-semibold text-blue-[#0F172A]'>
                  Tanggal Reservasi
                </label>
                <div className='mt-2'>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date: React.SetStateAction<Date | null>) =>
                      setSelectedDate(date)
                    }
                    dateFormat='dd/MM/yyyy'
                    placeholderText='Pilih tanggal reservasi'
                    wrapperClassName='w-full'
                    minDate={new Date()}
                    className='w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-transparent hover:border-gray-400 cursor-pointer'
                  />
                </div>
              </div>
              <div>
                <label className='text-sm font-semibold text-blue-[#0F172A]'>
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
                <label className='text-sm font-semibold text-blue-[#0F172A]'>
                  DURATION
                </label>
                <div className='mt-2'>
                  <SearchableSelect
                    value={
                      dataDurasi.find((option) => option.value === dataDuration)
                        ?.label || ''
                    }
                    onChange={(val: string) => setNamaDuration(val)}
                    options={dataDurasi.map((p) => ({
                      value: p.value,
                      label: p.label,
                    }))}
                  />
                </div>
              </div>
              <div>
                <div className='flex pl-4 gap-2'>
                  <label className='text-sm justify-content items-center font-semibold text-blue-[#0F172A]'>
                    Check In
                  </label>
                </div>
                <div className='gap-2 mt-2 p-2 border rounded-xl border-gray-200'>
                  {/* Check In */}
                  <div className='flex flex-col gap-1'>
                    <DatePicker
                      selected={checkIn}
                      onChange={(date: React.SetStateAction<Date | null>) =>
                        setCheckIn(date)
                      }
                      showTimeSelect
                      showTimeSelectOnly
                      timeFormat='HH:mm'
                      timeIntervals={15}
                      dateFormat='HH:mm'
                      placeholderText='--:--'
                      className='w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-transparent hover:border-gray-400 cursor-pointer'
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className='flex pl-4 gap-2'>
                  <label className='text-sm justify-content items-center font-semibold text-blue-[#0F172A]'>
                    Check Out
                  </label>
                </div>
                {/* Check Out */}
                <div className='gap-2 mt-2 p-2 border rounded-xl border-gray-200'>
                  <div className='flex flex-col gap-1'>
                    <DatePicker
                      selected={checkOut}
                      onChange={(date: React.SetStateAction<Date | null>) =>
                        setCheckOut(date)
                      }
                      showTimeSelect
                      showTimeSelectOnly
                      timeFormat='HH:mm'
                      timeIntervals={15}
                      dateFormat='HH:mm'
                      placeholderText='--:--'
                      className='w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-transparent hover:border-gray-400 cursor-pointer'
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className='mt-4 rounded-xl bg-white p-8 shadow-sm ring-1 ring-black/5'>
            <div className='flex items-center gap-3 mb-6'>
              <UserIcon
                className='text-white bg-[#0F172A] rounded-2xl p-1 px-2'
                size={38}
              />
              <div className='flex flex-col'>
                <h2 className='text-sm font-semibold text-gray-900'>
                  Informasi Tamu
                </h2>
                <p className='text-sm text-gray-500'>
                  Informasi harga unit, uang masuk, sisa pembayaran
                </p>
              </div>
            </div>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
              <div>
                <label className='text-sm font-semibold text-blue-[#0F172A]'>
                  NAMA TAMU
                </label>
                <div className='mt-2 h-12 ring-2 py-2.5 ring-gray-200 rounded-xl px-4'>
                  <input
                    value={namaTamu}
                    onChange={(e) => setNamaTamu(e.target.value)}
                    type='text'
                    placeholder='Masukkan nama tamu'
                    className='transparent w-full focus:outline-none focus:ring-0 focus:border-transparent'
                  />
                </div>
              </div>
              <div className='relative'>
                <label className='text-sm font-semibold text-blue-[#0F172A]'>
                  NOMOR TELEPON TAMU
                </label>
                <div className='mt-2 h-12 ring-2 py-2.5 ring-gray-200 rounded-xl px-4'>
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
                    className='transparent w-full focus:outline-none focus:ring-0 focus:border-transparent bg-transparent'
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
          <section className='mt-4 rounded-xl bg-white p-8 shadow-sm ring-1 ring-black/5'>
            <div className='flex items-center gap-3 mb-6'>
              <DollarSign
                className='text-white bg-[#0F172A] rounded-2xl p-1 px-2'
                size={38}
              />
              <div className='flex flex-col'>
                <h2 className='text-sm font-semibold text-gray-900'>
                  Form Harga
                </h2>
                <p className='text-sm text-gray-500'>
                  Informasi harga unit, uang masuk, sisa pembayaran
                </p>
              </div>
            </div>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
              <div>
                <label className='text-large font-semibold uppercase text-blue-[#0F172A]'>
                  Harga Unit
                </label>
                <div className='mt-2 h-12 ring-2 py-2.5 ring-gray-200 rounded-xl px-4'>
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
                <label className='text-large font-semibold uppercase text-blue-[#0F172A]'>
                  Uang Masuk
                </label>
                <div className='mt-2 h-12 ring-2 py-2.5 ring-gray-200 rounded-xl px-4'>
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
                <label className='text-large font-semibold uppercase text-blue-[#0F172A]'>
                  Sisa Pembayaran
                </label>
                <div className='mt-2 h-12 ring-2 py-2.5 ring-gray-200 rounded-xl px-4'>
                  <input
                    readOnly
                    value={formatRupiah(sisaPembayaran ?? 0)}
                    type='text'
                    inputMode='numeric'
                    placeholder='Rp 0'
                    className='transparent w-full focus:outline-none focus:ring-0 focus:border-transparent'
                  />
                </div>
              </div>
            </div>
          </section>
          <section className='mt-4 rounded-xl bg-white p-8 shadow-sm ring-1 ring-black/5'>
            <div className='flex items-center gap-3 mb-6'>
              <UserIcon
                className='text-white bg-[#0F172A] rounded-2xl p-1 px-2'
                size={38}
              />
              <div className='flex flex-col'>
                <h2 className='text-sm font-semibold text-gray-900'>
                  Form Note Admin
                </h2>
                <p className='text-sm text-gray-500'>
                  Informasi Note Admin, Note Pelunasan, Note Pembatalan, dll
                </p>
              </div>
            </div>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
              <div>
                <label className='text-large font-semibold uppercase text-blue-[#0F172A]'>
                  Note Pelunasan
                </label>
                <div className='mt-2 h-12 ring-2 py-2.5 ring-gray-200 rounded-xl px-4'>
                  <input
                    value={notePelunasan}
                    onChange={(e) => setNotePelunasan(e.target.value)}
                    type='text'
                    placeholder='Masukkan note pelunasan'
                    className='transparent w-full focus:outline-none focus:ring-0 focus:border-transparent'
                  />
                </div>
              </div>
              <div>
                <label className='text-large font-semibold uppercase text-blue-[#0F172A]'>
                  Note Tamu / Admin
                </label>
                <div className='mt-2 h-12 ring-2 py-2.5 ring-gray-200 rounded-xl px-4'>
                  <input
                    value={noteTamu}
                    onChange={(e) => setNoteTamu(e.target.value)}
                    type='text'
                    placeholder='Masukkan note tamu atau admin'
                    className='transparent w-full focus:outline-none focus:ring-0 focus:border-transparent'
                  />
                </div>
              </div>
              <div>
                <label className='text-large font-semibold uppercase text-blue-[#0F172A]'>
                  Apart
                </label>
                <div className='mt-2 h-12 ring-2 py-2.5 ring-gray-200 rounded-xl px-4'>
                  <input
                    value={apart}
                    onChange={(e) => setApart(e.target.value)}
                    type='text'
                    placeholder='Masukkan apart'
                    className='transparent w-full focus:outline-none focus:ring-0 focus:border-transparent'
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
    </div>
  )
}
