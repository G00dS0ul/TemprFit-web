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

  if (role) {
    const isTrainer = role === 'trainer';
    const activeMode = typeof window !== 'undefined' ? (localStorage.getItem('activeMode') || 'trainee') : 'trainee';
    
    // A trainer can access trainee pages if their active mode is 'trainee'
    let isAllowed = allowedRoles.includes(role);
    if (!isAllowed && allowedRoles.includes('user') && isTrainer) {
      if (activeMode === 'trainee') {
        isAllowed = true;
      }
    }

    if (!isAllowed) {
      if (isTrainer && allowedRoles.includes('user') && activeMode === 'trainer') {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', textAlign: 'center', padding: '20px' }}>
            <ShieldAlert size={64} style={{ color: '#ef4444', marginBottom: '20px' }} />
            <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Trainer Mode Active</h2>
            <p style={{ color: 'var(--color-text-muted)', maxWidth: '500px', marginBottom: '30px', lineHeight: '1.6' }}>
              You cannot use this feature because you are currently in Trainer Mode. This tool is designed for your Trainee profile.
            </p>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center' }}>
              <Link href="/trainer-dashboard" style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeft size={18} /> Return to Dashboard
              </Link>
              <button 
                onClick={() => {
                  localStorage.setItem('activeMode', 'trainee');
                  window.location.reload();
                }}
                style={{ background: 'var(--color-primary)', color: '#fff', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                Switch to Trainee Mode
              </button>
            </div>
          </div>
        );
      }

      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', textAlign: 'center', padding: '20px' }}>
          <ShieldAlert size={64} style={{ color: '#ef4444', marginBottom: '20px' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Access Denied</h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '500px', marginBottom: '30px', lineHeight: '1.6' }}>
            You do not have permission to view this page.
            {allowedRoles.includes('admin') && !allowedRoles.includes('user') && " This area is strictly restricted to administrators."}
            {!allowedRoles.includes('admin') && allowedRoles.includes('trainer') && " You must be an approved trainer to access this feature. If you'd like to offer your services, you can apply to become a trainer."}
          </p>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center' }}>
            <Link href="/dashboard" style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <ArrowLeft size={18} /> Return to Dashboard
            </Link>
            {!allowedRoles.includes('admin') && allowedRoles.includes('trainer') && (
              <Link href="/become-trainer" style={{ background: 'var(--color-primary)', color: '#fff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                Become a Trainer
              </Link>
            )}
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
