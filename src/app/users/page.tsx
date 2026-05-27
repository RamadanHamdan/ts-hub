'use client'

import { useSession } from '@/components/session/SessionProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import {
  UserPlus,
  Users,
  Shield,
  ShieldCheck,
  User as UserIcon,
  X,
  Eye,
  EyeOff,
  Loader2,
  Search,
} from 'lucide-react'

type UserData = {
  _id: string
  userId: string
  username: string
  email: string
  fullName: string
  role: string
  phone: string
  isActive: boolean
  createdAt: string
}

export default function UsersPage() {
  const { user, loading: sessionLoading } = useSession()
  const router = useRouter()

  const [users, setUsers] = useState<UserData[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: 'user',
    phone: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formSuccess, setFormSuccess] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true)
    try {
      const res = await fetch('/api/users')
      const json = await res.json()
      if (res.ok && json.users) {
        setUsers(json.users)
      }
    } catch (err) {
      console.error('Fetch users error:', err)
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  useEffect(() => {
    if (!sessionLoading && user) {
      if (user.role !== 'super_admin') {
        router.replace('/dashboard')
      } else {
        fetchUsers()
      }
    }
  }, [user, sessionLoading, router, fetchUsers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    setFormLoading(true)

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const json = await res.json()

      if (!res.ok) {
        setFormError(json.error || 'Gagal membuat user')
        return
      }

      setFormSuccess(`User "${json.user.fullName}" berhasil dibuat!`)
      setFormData({
        fullName: '',
        username: '',
        email: '',
        password: '',
        role: 'user',
        phone: '',
      })

      // Refresh list
      await fetchUsers()

      // Close modal after delay
      setTimeout(() => {
        setShowModal(false)
        setFormSuccess('')
      }, 1500)
    } catch (err) {
      setFormError('Terjadi kesalahan koneksi')
    } finally {
      setFormLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'>
            <ShieldCheck className='w-3 h-3' />
            Super Admin
          </span>
        )
      case 'admin':
        return (
          <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'>
            <Shield className='w-3 h-3' />
            Admin
          </span>
        )
      default:
        return (
          <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'>
            <UserIcon className='w-3 h-3' />
            User
          </span>
        )
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (sessionLoading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='h-8 w-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin' />
      </div>
    )
  }

  if (!user || user.role !== 'super_admin') return null

  return (
    <div className='p-6 lg:p-8 space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3'>
            <Users className='w-8 h-8 text-blue-600' />
            Kelola Users
          </h1>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Tambah dan kelola user sistem. Hanya Super Admin yang bisa mengakses halaman ini.
          </p>
        </div>
        <button
          onClick={() => {
            setShowModal(true)
            setFormError('')
            setFormSuccess('')
          }}
          className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:from-blue-500 hover:to-blue-600 transition-all active:scale-95'
        >
          <UserPlus className='w-4 h-4' />
          Tambah User
        </button>
      </div>

      {/* Search */}
      <div className='relative max-w-md'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
        <input
          type='text'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder='Cari user berdasarkan nama, username, atau email...'
          className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all'
        />
      </div>

      {/* Users Table */}
      <div className='rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden'>
        {loadingUsers ? (
          <div className='flex items-center justify-center py-16'>
            <Loader2 className='w-6 h-6 animate-spin text-blue-500' />
            <span className='ml-2 text-sm text-gray-500'>Memuat data users...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className='text-center py-16'>
            <Users className='w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3' />
            <p className='text-gray-500 dark:text-gray-400 text-sm'>
              {searchQuery ? 'Tidak ada user yang cocok dengan pencarian.' : 'Belum ada user terdaftar.'}
            </p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'>
                  <th className='text-left py-3.5 px-5 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider'>
                    User
                  </th>
                  <th className='text-left py-3.5 px-5 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider'>
                    Username
                  </th>
                  <th className='text-left py-3.5 px-5 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider'>
                    Email
                  </th>
                  <th className='text-left py-3.5 px-5 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider'>
                    Role
                  </th>
                  <th className='text-left py-3.5 px-5 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider'>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50 dark:divide-gray-700/50'>
                {filteredUsers.map((u) => (
                  <tr
                    key={u._id}
                    className='hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors'
                  >
                    <td className='py-3.5 px-5'>
                      <div className='flex items-center gap-3'>
                        <div className='h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm'>
                          {u.fullName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className='font-semibold text-gray-900 dark:text-white'>
                            {u.fullName}
                          </p>
                          <p className='text-xs text-gray-400'>{u.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className='py-3.5 px-5 text-gray-700 dark:text-gray-300'>
                      {u.username}
                    </td>
                    <td className='py-3.5 px-5 text-gray-700 dark:text-gray-300'>
                      {u.email}
                    </td>
                    <td className='py-3.5 px-5'>{getRoleBadge(u.role)}</td>
                    <td className='py-3.5 px-5'>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.isActive ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                        {u.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD USER MODAL */}
      {showModal && (
        <div className='fixed inset-0 z-[100] flex items-center justify-center'>
          {/* Backdrop */}
          <div
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={() => setShowModal(false)}
          />

          {/* Modal */}
          <div className='relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto'>
            {/* Modal Header */}
            <div className='flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700'>
              <div className='flex items-center gap-3'>
                <div className='h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center'>
                  <UserPlus className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                </div>
                <div>
                  <h2 className='text-lg font-bold text-gray-900 dark:text-white'>
                    Tambah User Baru
                  </h2>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    Isi data user yang akan dibuat
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className='p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
              >
                <X className='w-5 h-5 text-gray-500' />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className='p-6 space-y-4'>
              {/* Full Name */}
              <div>
                <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5'>
                  Nama Lengkap <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className='w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
                  placeholder='Masukkan nama lengkap'
                  required
                />
              </div>

              {/* Username & Email */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5'>
                    Username <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className='w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
                    placeholder='username'
                    required
                  />
                </div>
                <div>
                  <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5'>
                    Email <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='email'
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className='w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
                    placeholder='user@email.com'
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5'>
                  Password <span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className='w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
                    placeholder='Minimal 6 karakter'
                    minLength={6}
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                  >
                    {showPassword ? (
                      <EyeOff className='w-4 h-4' />
                    ) : (
                      <Eye className='w-4 h-4' />
                    )}
                  </button>
                </div>
              </div>

              {/* Role & Phone */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5'>
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className='w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
                  >
                    <option value='user'>User</option>
                    <option value='admin'>Admin</option>
                    <option value='super_admin'>Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className='block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5'>
                    No. Telepon
                  </label>
                  <input
                    type='tel'
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className='w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
                    placeholder='08xxxxxxxxxx'
                  />
                </div>
              </div>

              {/* Error / Success Messages */}
              {formError && (
                <div className='p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-sm text-red-600 dark:text-red-400'>
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className='p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-sm text-green-600 dark:text-green-400'>
                  {formSuccess}
                </div>
              )}

              {/* Submit */}
              <div className='flex justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setShowModal(false)}
                  className='px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                >
                  Batal
                </button>
                <button
                  type='submit'
                  disabled={formLoading}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all ${
                    formLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-lg shadow-blue-500/25'
                  }`}
                >
                  {formLoading && <Loader2 className='w-4 h-4 animate-spin' />}
                  {formLoading ? 'Membuat...' : 'Buat User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
