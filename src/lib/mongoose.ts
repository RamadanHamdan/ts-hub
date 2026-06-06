import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI as string

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined')
}

declare global {
  var _mongoosePromise: Promise<typeof mongoose> | undefined
}

export async function connectDB() {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose
  }

  // If a connection attempt is in progress, wait for it
  if (global._mongoosePromise) {
    return global._mongoosePromise
  }

  // Start a new connection attempt
  global._mongoosePromise = mongoose
    .connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 2, // Keep minimum connections alive to avoid cold starts
    })
    .catch((err) => {
      // Clear the cached promise on failure so next call can retry
      global._mongoosePromise = undefined
      throw err
    })

  return global._mongoosePromise
}

// Pre-warm: initiate connection immediately on module load (development only)
// This ensures the connection is already being established before the first request
if (process.env.NODE_ENV === 'development') {
  connectDB().catch((err) => {
    console.warn('[mongoose] Pre-warm connection failed, will retry on first request:', err.message)
  })
}
