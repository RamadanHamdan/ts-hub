import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI as string

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined')
}

declare global {
  var _mongoosePromise: Promise<typeof mongoose> | undefined
}

let cached = global._mongoosePromise

export async function connectDB() {
  if (cached) {
    return cached
  }

  cached = mongoose.connect(MONGODB_URI)
  global._mongoosePromise = cached

  return cached
}
