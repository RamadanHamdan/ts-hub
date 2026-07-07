'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Printer, ArrowLeft } from 'lucide-react'

// Fungsi format rupiah
function formatRupiah(value: number | string): string {
  if (value === undefined || value === null) return 'Rp 0'
  const numericValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numericValue)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue)
}

export default function InvoicePage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return

    async function fetchInvoice() {
      try {
        const res = await fetch(`/api/invoice/${id}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Gagal mengambil data')
        setData(json.data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice()
  }, [id])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 dark:text-white">Loading invoice...</div>
  }

  if (error || !data) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-red-500">{error || 'Data tidak ditemukan'}</div>
  }

  // Handle printing
  const handlePrint = () => {
    setTimeout(() => {
      window.print()
    }, 100)
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-10 font-sans">
        
        {/* Print-only Top Header (Replaces the navbar) */}
        <div className="hidden print:flex px-10 pt-4 pb-5">
          <span className="font-extrabold text-black dark:text-white text-2xl tracking-wide">
            Tempat Singgah Apartement
          </span>
        </div>

      {/* Tombol Aksi - Disembunyikan saat print */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between px-4 print:hidden">
        <button
          onClick={() => router.push('/room-status')}
          className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={18} />
          Kembali
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-[#0B6AA9] text-white px-6 py-2 rounded-lg shadow-md hover:bg-[#09578b] transition-colors font-semibold"
        >
          <Printer size={18} />
          Print Invoice
        </button>
      </div>

      {/* Kertas Invoice */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8 md:p-12 w-full relative overflow-visible border border-gray-100 dark:border-gray-700">
        
        {/* Dekorasi Atas */}
        <div className="absolute top-0 left-0 w-full h-3 bg-[#0B6AA9]"></div>

        {/* Header Section */}
        <div className="flex justify-between items-start border-b dark:border-gray-700 pb-8 mb-8 mt-4">
          <div>
            <h1 className="text-4xl font-extrabold text-[#0B6AA9] tracking-tight mb-2">INVOICE</h1>
            <p className="text-gray-500 font-medium text-sm">#{data._id?.toString().slice(-8).toUpperCase()}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Manajemen Sewa Unit</h2>
            <p className="text-gray-500 text-sm mt-1">{data.nama_apart || 'Apartment Management'}</p>
            <p className="text-gray-500 text-sm mt-1">Tanggal: <span className="font-semibold text-gray-800 dark:text-gray-200">{new Date(data.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
          </div>
        </div>

        {/* Customer & Unit Details */}
        <div className="grid grid-cols-2 gap-10 mb-10">
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl border border-gray-100 dark:border-gray-600">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Ditagihkan Kepada</h3>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{data.nama_tamu}</p>
            <p className="text-gray-600 dark:text-gray-300 mt-2 font-medium">{data.nomor_telp_tamu || '-'}</p>
          </div>
          
          <div className="bg-[#0B6AA9]/5 dark:bg-[#0B6AA9]/20 p-6 rounded-xl border border-[#0B6AA9]/10 dark:border-[#0B6AA9]/30">
            <h3 className="text-xs font-bold text-[#0B6AA9] uppercase tracking-wider mb-4">Detail Reservasi</h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div className="text-gray-500">Unit:</div>
              <div className="font-bold text-gray-900 dark:text-white text-right">{data.nama_unit}</div>
              
              <div className="text-gray-500">Check-in:</div>
              <div className="font-semibold text-gray-800 dark:text-gray-200 text-right">{data.check_in || '-'}</div>
              
              <div className="text-gray-500">Check-out:</div>
              <div className="font-semibold text-gray-800 dark:text-gray-200 text-right">{data.check_out || '-'}</div>

              <div className="text-gray-500">Durasi:</div>
              <div className="font-semibold text-gray-800 dark:text-gray-200 text-right">{data.data_durasi || '-'}</div>
            </div>
          </div>
        </div>

        {/* Payment Summary Table */}
        <div className="border dark:border-gray-700 rounded-xl overflow-hidden mb-8 shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Deskripsi</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
              <tr>
                <td className="px-6 py-5 text-gray-800 dark:text-gray-200 font-medium">Sewa Unit ({data.nama_unit})</td>
                <td className="px-6 py-5 text-gray-900 dark:text-white font-bold text-right text-lg">{formatRupiah(data.data_harga)}</td>
              </tr>
              <tr>
                <td className="px-6 py-5 text-gray-500">Deposit / Uang Masuk</td>
                <td className="px-6 py-5 text-green-600 font-bold text-right">- {formatRupiah(data.uang_masuk)}</td>
              </tr>
            </tbody>
            <tfoot className="bg-[#0B6AA9]/5 dark:bg-[#0B6AA9]/20 border-t-2 border-[#0B6AA9]/20 dark:border-[#0B6AA9]/40">
              <tr>
                <td className="px-6 py-5 text-[#0B6AA9] font-bold text-lg">Sisa Pembayaran</td>
                <td className="px-6 py-5 text-[#0B6AA9] font-extrabold text-right text-2xl">
                  {formatRupiah(data.sisa_pembayaran)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Notes */}
        <div className="mb-12">
          {data.note_pelunasan && (
            <div className="mb-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Note Pelunasan:</h3>
              <p className="text-gray-700 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-100 dark:border-gray-600">{data.note_pelunasan}</p>
            </div>
          )}
          {data.note_admin && (
            <div className="mb-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Note Tamu:</h3>
              <p className="text-gray-700 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-100 dark:border-gray-600">{data.note_admin}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center border-t dark:border-gray-700 pt-8">
          <p className="text-gray-500 text-sm font-medium">Terima kasih atas kepercayaan Anda menyewa unit kami!</p>
          <p className="text-gray-400 text-xs mt-2">Invoice ini sah sebagai bukti pembayaran yang dicetak oleh sistem.</p>
        </div>
      </div>
    </div>
    </>
  )
}
