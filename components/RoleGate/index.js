'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RoleGate({ allowedRoles, children }) {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setRole(data.user.role);
        } else {
          router.push('/login');
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [router]);

  if (loading) return null; // Or a spinner

  if (role && !allowedRoles.includes(role)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', textAlign: 'center', padding: '20px' }}>
        <ShieldAlert size={64} style={{ color: '#ef4444', marginBottom: '20px' }} />
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Trainer Mode Active</h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '500px', marginBottom: '30px', lineHeight: '1.6' }}>
          You cannot use this feature because you are currently in Trainer Mode. This tool is designed for Trainee personal development.
          <br /><br />
          If you wish to use these features, please create a separate Trainee account.
        </p>
        <Link href="/trainer-dashboard" style={{ background: 'var(--color-primary)', color: '#fff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={18} /> Return to Dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
