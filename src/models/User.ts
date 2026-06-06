import { Schema, model, models } from 'mongoose'
import { createHash, randomBytes } from 'crypto'

export type UserRole = 'super_admin' | 'admin' | 'user'

export interface IUser {
  userId: string
  username: string
  email: string
  password: string
  salt: string
  fullName: string
  role: UserRole
  phone?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true, lowercase: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    salt: { type: String, required: true },
    fullName: { type: String, required: true },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'user'],
      default: 'user',
    },
    phone: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

// Compound indexes for optimized login query ($or with isActive filter)
UserSchema.index({ username: 1, isActive: 1 })
UserSchema.index({ email: 1, isActive: 1 })

// Helper: hash password with salt
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || randomBytes(16).toString('hex')
  const hash = createHash('sha256')
    .update(password + s)
    .digest('hex')
  return { hash, salt: s }
}

// Helper: verify password
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const result = hashPassword(password, salt)
  return result.hash === hash
}

export const User = models.User || model<IUser>('User', UserSchema, 'users')
