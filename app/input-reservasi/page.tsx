'use client'

import * as React from 'react'

import { HomeIcon, PenIcon, ListIcon, Building, DollarSign } from 'lucide-react'
import Link from 'next/link'
import SearchableSelect from '@/src/components/ui/SearchableSelect'
import { useState } from 'react'
import DatePicker from '@/src/components/ui/DatePicker'
import TimePicker from '@/src/components/ui/TimePicker'

const handleKirim = () => {
  // Logika untuk mengirim data ke backend
  console.log('Data reservasi telah dikirim ke backend')
}

export default function InputReservasiPage() {
  // fcuntion dummy untuk handle kirim data ke backend
  const [namaAdmin, setNamaAdmin] = useState('')
  const [namaTamu, setNamaTamu] = useState('')
  const [namaUnit, setNamaUnit] = useState('')
  const [dataDuration, setNamaDuration] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

  const dataUnit = [
    { value: 'TD.1134', label: 'TD.1134' },
    { value: 'TB.1534', label: 'TB.1534' },
    { value: 'TA.2118', label: 'TA.2118' },
    { value: 'TA.0812', label: 'TA.0812' },
    { value: 'TC.0826', label: 'TC.0826' },
    { value: 'TA.0933', label: 'TA.0933' },
    { value: 'TC.1608', label: 'TC.1608' },
    { value: 'TC.0630', label: 'TC.0630' },
    { value: 'TA.0931', label: 'TA.0931' },
    { value: 'TA.0932', label: 'TA.0932' },
    { value: 'TB.1728', label: 'TB.1728' },
    { value: 'TB.0919', label: 'TB.0919' },
    { value: 'TC.1727', label: 'TC.1727' },
    { value: 'TD.1028', label: 'TD.1028' },
    { value: 'TD.2126', label: 'TD.2126' },
    { value: 'TA.1126', label: 'TA.1126' },
    { value: 'TC.0507', label: 'TC.0507' },
    { value: 'TD.1134', label: 'TD.1134' },
    { value: 'TC.1727', label: 'TC.1727' },
    { value: 'TC.0826', label: 'TC.0826' },
    { value: 'TD.1028', label: 'TD.1028' },
    { value: 'TB.0919', label: 'TB.0919' },
    { value: 'GAA TB.0508', label: 'GAA TB.0508' },
    { value: 'GAA TC.0528', label: 'GAA TC.0528' },
    { value: 'GAA TB.0622', label: 'GAA TB.0622' },
    { value: 'GAA TB.0510', label: 'GAA TB.0510' },
    { value: 'TB.0510 GAA', label: 'TB.0510 GAA' },
    { value: 'GAA TB.0508', label: 'GAA TB.0508' },
    { value: 'GAA TC.0528', label: 'GAA TC.0528' },
  ]

  const dataDurasi = [
    { value: '1 Malam', label: '1 Malam' },
    { value: 'Halfday Malam', label: 'Halfday Malam' },
    { value: 'Transit', label: 'Transit' },
    { value: 'Extend', label: 'Extend' },
  ]
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
                <p className='text-sm text-gray-500'>Data Tamu</p>
              </div>
            </div>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
              <div>
                <label className='text-sm font-semibold text-blue-[#0F172A]'>
                  NAMA ADMIN
                </label>
                <div className='mt-2'>
                  <SearchableSelect
                    value={namaAdmin}
                    onChange={(val: string) => setNamaAdmin(val)}
                    options={[
                      { value: 'Admin 1', label: 'Admin 1' },
                      { value: 'Admin 2', label: 'Admin 2' },
                      { value: 'Admin 3', label: 'Admin 3' },
                    ]}
                  />
                </div>
              </div>
              <div>
                <label className='text-sm font-semibold text-blue-[#0F172A]'>
                  NAMA TAMU
                </label>
                <div className='mt-2'>
                  <SearchableSelect
                    value={namaTamu}
                    onChange={(val: string) => setNamaTamu(val)}
                    options={[
                      { value: 'Tamu 1', label: 'Tamu 1' },
                      { value: 'Tamu 2', label: 'Tamu 2' },
                      { value: 'Tamu 3', label: 'Tamu 3' },
                    ]}
                  />
                </div>
              </div>
              <div>
                <label className='text-sm font-semibold text-blue-[#0F172A]'>
                  Tanggal
                </label>
                <div className='mt-2'>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date: Date) => setSelectedDate(date)}
                    className='w- rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50'
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
                      dataUnit.find((option) => option.value === namaUnit)
                        ?.label || ''
                    }
                    onChange={(val: string) => setNamaUnit(val)}
                    options={dataUnit.map((p) => ({
                      value: p.value,
                      label: p.label,
                    }))}
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
                  <label className='text-sm justify-content items-centerfont-semibold text-blue-[#0F172A]'>
                    Check In & Check Out
                  </label>
                </div>
                <div className='grid grid-cols-2 gap-2 mt-2 md:grid-cols-2 p-2 border rounded-md border-gray-300'>
                  <TimePicker
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
                  <TimePicker
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
                  Informasi harga unit, uang masuk, sisa pembayaran, note pelunasan
                </p>
              </div>
            </div>
           
          </section>
        </div>
      </div>
    </div>
  )
}
