import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { connectDB } from '@/lib/mongoose'
import { User, verifyPassword } from '@/models/User'

export async function POST(req: NextRequest) {
  let body: { identity?: string; password?: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Request body tidak valid.' },
      { status: 400 },
    )
  }

  const { identity, password } = body

  if (!identity || !password) {
    return NextResponse.json(
      { error: 'Username/email dan password harus diisi.' },
      { status: 400 },
    )
  }

  try {
    await connectDB()
  } catch (dbError) {
    console.error('Database connection error:', dbError)
    return NextResponse.json(
      { error: 'Gagal terhubung ke database. Silakan coba lagi.' },
      { status: 503 },
    )
  }

  try {
    // Cari user berdasarkan username atau email
    const user = await User.findOne({
      $or: [
        { username: identity.toLowerCase() },
        { email: identity.toLowerCase() },
      ],
      isActive: true,
    }).lean()

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan atau tidak aktif.' },
        { status: 401 },
      )
    }

    // Verifikasi password
    const isValid = verifyPassword(password, user.password, user.salt)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Password salah.' },
        { status: 401 },
      )
    }

    // Buat session data
    const sessionData = {
      _id: user._id.toString(),
      userId: user.userId,
      role: user.role,
      username: user.username,
      fullName: user.fullName,
    }

    // Set cookie session
    const cookieStore = await cookies()
    cookieStore.set('session', JSON.stringify(sessionData), {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      sameSite: 'lax',
    })

    return NextResponse.json({
      message: 'Login berhasil.',
      user: sessionData,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server.' },
      { status: 500 },
    )
  }
}
