'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function ReservationCards() {
  const fields = [
    { label: 'Nama Tamu', type: 'text', placeholder: 'Nama Tamu' },
    { label: 'Tipe Kamar', type: 'text', placeholder: 'Tipe Kamar' },
    { label: 'Apart', type: 'text', placeholder: 'Apart' },
    { label: 'Check In', type: 'date', placeholder: 'Check In' },
    { label: 'Check Out', type: 'date', placeholder: 'Check Out' },
    { label: 'Duration', type: 'text', placeholder: 'Duration' },
    { label: 'Harga', type: 'number', placeholder: 'Harga' },
    { label: 'Uang Masuk', type: 'number', placeholder: 'Uang Masuk' },
    { label: 'Sisa Pembayaran', type: 'number', placeholder: 'Sisa Pembayaran' },
    { label: 'Note Pelunasan', type: 'text', placeholder: 'Note Pelunasan' },
    { label: 'Note Tamu / Admin', type: 'text', placeholder: 'Note' },
  ]

  return (
    <form className='w-full space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold'>Input Reservasi Baru</h1>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        {fields.map((field) => (
          <div key={field.label} className='flex flex-col gap-1.5'>
            <label className='text-sm font-medium text-muted-foreground'>
              {field.label}
            </label>
            <Input
              type={field.type}
              placeholder={field.placeholder}
              className='h-10 text-sm'
            />
          </div>
        ))}
      </div>
      <div className='grid grid-cols-2 gap-2 pt-4 border-t'>
        <Button type='submit' className='w-full'>
          Simpan Reservasi
        </Button>
        <Button type='reset' variant='outline' className='w-full'>
          Bersihkan
        </Button>
      </div>
    </form>
  )
}
