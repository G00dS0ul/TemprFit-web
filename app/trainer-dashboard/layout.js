import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export default async function TrainerDashboardLayout({ children }) {
  await connectDB();
  const sessionUser = await getSessionUser();

  if (!sessionUser || sessionUser.role !== 'trainer') {
    redirect('/dashboard');
  }

  // Double check approval status from DB to ensure it's up to date
  const user = await User.findById(sessionUser._id).lean();
  
  if (!user?.trainerInfo?.isApproved) {
    // If they somehow navigate here without approval, redirect them to trainee dashboard
    redirect('/dashboard?error=pending_approval');
  }

  return (
    <>
      {children}
    </>
  );
}
