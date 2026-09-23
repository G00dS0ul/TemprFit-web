import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days (Reduced from 10 years per D-4)

if (!JWT_SECRET) {
  console.warn(
    'JWT_SECRET is not set. Add it to .env.local — see .env.local.example'
  )
}

export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(plainPassword, salt)
}

export async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword)
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function signToken(payload) {
  const jti = payload.jti || crypto.randomUUID()
  return jwt.sign({ ...payload, jti }, JWT_SECRET, { expiresIn: TOKEN_MAX_AGE_SECONDS })
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export const AUTH_COOKIE_NAME = 'repily_token'
export const AUTH_COOKIE_MAX_AGE = TOKEN_MAX_AGE_SECONDS

export async function isTokenRevoked({ jti, token }) {
  if (!jti && !token) return false
  try {
    const { default: mongoose } = await import('mongoose')
    const { default: RevokedToken } = await import('@/models/RevokedToken')
    if (mongoose.connection?.readyState === 0 && !RevokedToken.findOne?.mock) {
      return false
    }
    const query = []
    if (jti) query.push({ jti })
    if (token) query.push({ tokenHash: hashToken(token) })
    if (query.length === 0) return false
    const revoked = await RevokedToken.findOne({ $or: query })
    return !!revoked
  } catch (err) {
    return false
  }
}

export async function revokeToken({ token, userId }) {
  if (!token) return null
  try {
    const { default: mongoose } = await import('mongoose')
    const { default: RevokedToken } = await import('@/models/RevokedToken')
    if (mongoose.connection?.readyState === 0 && !RevokedToken.findOneAndUpdate?.mock) {
      return null
    }
    const decoded = jwt.decode(token)
    const tokenHash = hashToken(token)
    const jti = decoded?.jti || tokenHash
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + TOKEN_MAX_AGE_SECONDS * 1000)

    return await RevokedToken.findOneAndUpdate(
      { tokenHash },
      {
        tokenHash,
        jti,
        userId: userId || decoded?.userId,
        revokedAt: new Date(),
        expiresAt,
      },
      { upsert: true, new: true }
    )
  } catch (err) {
    return null
  }
}

// Shared helper for API routes: resolves the logged-in user (or null) from
// the Authorization Bearer header or auth cookie. Callers must already have called connectDB().
export async function getSessionUser() {
  const { cookies, headers } = await import('next/headers')
  let token = null
  let authSource = null

  // 1. Dual-read: check Authorization: Bearer <token>
  try {
    const authHeader = headers().get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim()
      authSource = 'bearer'
    }
  } catch {}

  // 2. Dual-read: fall back to repily_token cookie during 90-day migration window
  if (!token) {
    try {
      const cookieVal = cookies().get(AUTH_COOKIE_NAME)?.value
      if (cookieVal) {
        token = cookieVal
        authSource = 'cookie'
      }
    } catch {}
  }

  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  // D-6 telemetry: log metric counter when legacy cookie auth is used
  if (authSource === 'cookie') {
    console.log('[AUTH_DUAL_READ] Legacy cookie auth used for session:', payload.userId)
  }

  // Check revocation status against MongoDB RevokedToken collection
  const revoked = await isTokenRevoked({ jti: payload.jti, token })
  if (revoked) return null

  const { default: User } = await import('@/models/User')
  let user = await User.findById(payload.userId)

  if (!user) return null
  if (user.isBanned) return null

  // The UI and RoleGate upgrade is handled safely in /api/auth/me instead.
  if (user && user.plan !== 'free' && user.planExpiresAt && new Date() > user.planExpiresAt) {
    const expiredPlan = user.plan
    user.plan = 'free'
    user.planExpiresAt = null
    await user.save()

    const { default: Notification } = await import('@/models/Notification')
    await Notification.create({
      user: user._id,
      title: 'Plan Expired',
      message: `Your ${expiredPlan} plan has expired. You are now on the Free plan. Upgrade to regain premium features!`,
      type: 'subscription',
      link: '/upgrade',
    })
  }

  return user
}
