import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { connectDB } from '@/lib/mongoose'
import { User, hashPassword } from '@/models/User'

// Helper: get current session user
async function getSessionUser() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  if (!sessionCookie?.value) return null
  try {
    return JSON.parse(sessionCookie.value)
  } catch {
    return null
  }
}

// GET: List semua users (superadmin only)
export async function GET() {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser || sessionUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya super admin yang bisa melihat daftar user.' },
        { status: 403 },
      )
    }

    await connectDB()

    const users = await User.find({}, { password: 0, salt: 0 })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data users.' },
      { status: 500 },
    )
  }
}

// POST: Create user baru (superadmin only)
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser || sessionUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya super admin yang bisa membuat user.' },
        { status: 403 },
      )
    }

    const body = await req.json()
    const { username, email, password, fullName, role, phone } = body

    if (!username || !email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Username, email, password, dan nama lengkap harus diisi.' },
        { status: 400 },
      )
    }

    await connectDB()

    // Cek duplikat username atau email
    const existing = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() },
      ],
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Username atau email sudah digunakan.' },
        { status: 409 },
      )
    }

    // Hash password
    const { hash, salt } = hashPassword(password)

    // Generate userId
    const count = await User.countDocuments()
    const userId = `USR-${String(count + 1).padStart(4, '0')}`

    const newUser = await User.create({
      userId,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hash,
      salt,
      fullName,
      role: role || 'user',
      phone: phone || '',
      isActive: true,
    })

    return NextResponse.json(
      {
        message: 'User berhasil dibuat.',
        user: {
          _id: newUser._id,
          userId: newUser.userId,
          username: newUser.username,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
          phone: newUser.phone,
          isActive: newUser.isActive,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Gagal membuat user.' },
      { status: 500 },
    )
  }
}
