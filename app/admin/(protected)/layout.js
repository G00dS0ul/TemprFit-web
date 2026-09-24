import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';

export default function AdminLayout({ children }) {
  const cookieStore = cookies();
  const adminToken = cookieStore.get('admin_token')?.value;

  let isAdmin = false;
  if (adminToken === 'true') {
    isAdmin = true;
  } else if (adminToken) {
    const payload = verifyToken(adminToken);
    if (payload && (payload.role === 'admin' || payload.isAdmin)) {
      isAdmin = true;
    }
  }

  // If there's no valid admin_token cookie, redirect to the admin login page
  if (!isAdmin) {
    redirect('/admin/login');
  }

  return <>{children}</>;
}
