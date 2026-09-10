import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function AdminLayout({ children }) {
  const cookieStore = cookies();
  const adminToken = cookieStore.get('admin_token');

  // If there's no admin_token cookie, redirect to the admin login page
  if (!adminToken || adminToken.value !== 'true') {
    redirect('/admin/login');
  }

  return <>{children}</>;
}
