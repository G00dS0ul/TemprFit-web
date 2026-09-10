import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// Called once by the dashboard right after it renders the "Welcome to your
// new dashboard" message for a brand-new account. Flipping this server-side
// (instead of just in client state) means the switch to "Welcome back"
// survives a refresh and isn't lost if the user closes the tab immediately.
export async function POST() {
  await connectDB()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  if (!user.firstLoginCompleted) {
    user.firstLoginCompleted = true
    await user.save()
  }

  return NextResponse.json({ ok: true })
}
