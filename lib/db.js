import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.warn(
    'MONGODB_URI is not set. Add it to .env.local — see .env.local.example'
  )
}

// Reuse the connection across hot reloads in dev and across serverless
// function invocations in production, instead of opening a new one per request.
let cached = global._mongoose
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null }
}

export async function connectDB() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { 
        bufferCommands: false,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000
      })
      .then((mongooseInstance) => mongooseInstance)
  }

  cached.conn = await cached.promise
  return cached.conn
}
