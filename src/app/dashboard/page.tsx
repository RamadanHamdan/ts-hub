'use client'

import { useSession } from '@/components/session/SessionProvider'
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  TrendingUp,
} from 'lucide-react'

export default function DashboardPage() {
  const { user, loading } = useSession()

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='h-8 w-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin' />
      </div>
    )
  }

  if (!user) return null

  const roleLabel =
    user.role === 'super_admin'
      ? 'Super Admin'
      : user.role === 'admin'
        ? 'Admin'
        : 'User'

  const cards = [
    {
      title: 'Total Reservasi',
      value: '—',
      icon: CalendarCheck,
      color: 'from-blue-500 to-blue-600',
      shadowColor: 'shadow-blue-500/25',
    },
    {
      title: 'Reservasi Hari Ini',
      value: '—',
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      shadowColor: 'shadow-emerald-500/25',
    },
    {
      title: 'Total Users',
      value: '—',
      icon: Users,
      color: 'from-violet-500 to-violet-600',
      shadowColor: 'shadow-violet-500/25',
    },
    {
      title: 'Dashboard',
      value: roleLabel,
      icon: LayoutDashboard,
      color: 'from-amber-500 to-orange-500',
      shadowColor: 'shadow-amber-500/25',
    },
  ]

  return (
    <div className='p-6 lg:p-8 space-y-8'>
      {/* Welcome Header */}
      <div className='space-y-2'>
        <h1 className='text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white'>
          Selamat Datang, {user.fullName} 👋
        </h1>
        <p className='text-sm text-gray-500 dark:text-gray-400'>
          Anda login sebagai <span className='font-semibold text-blue-600 dark:text-blue-400'>{roleLabel}</span>. Berikut ringkasan sistem Anda.
        </p>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5'>
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.color} p-6 text-white shadow-xl ${card.shadowColor} transition-transform hover:scale-[1.02] hover:shadow-2xl`}
            >
              <div className='absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10' />
              <div className='absolute bottom-0 left-0 -mb-6 -ml-6 h-20 w-20 rounded-full bg-white/5' />
              <div className='relative z-10'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm'>
                    <Icon className='w-6 h-6' />
                  </div>
                </div>
                <p className='text-2xl font-bold'>{card.value}</p>
                <p className='text-sm text-white/80 font-medium mt-1'>
                  {card.title}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Info */}
      <div className='rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 shadow-sm'>
        <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
          Informasi Akun
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50'>
            <div className='h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center'>
              <Users className='w-5 h-5 text-blue-600 dark:text-blue-400' />
            </div>
            <div>
              <p className='text-xs text-gray-500 dark:text-gray-400'>Username</p>
              <p className='text-sm font-semibold text-gray-900 dark:text-white'>{user.username}</p>
            </div>
          </div>
          <div className='flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50'>
            <div className='h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center'>
              <LayoutDashboard className='w-5 h-5 text-emerald-600 dark:text-emerald-400' />
            </div>
            <div>
              <p className='text-xs text-gray-500 dark:text-gray-400'>Role</p>
              <p className='text-sm font-semibold text-gray-900 dark:text-white'>{roleLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
