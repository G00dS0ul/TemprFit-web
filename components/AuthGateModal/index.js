'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn, X } from 'lucide-react';
import styles from './AuthGateModal.module.css';

export default function AuthGateModal({ open, onClose, message }) {
  const pathname = usePathname();
  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <h3>Sign in required</h3>
        <p>{message || 'Sign in to your TemprFit account to do that.'}</p>
        <Link href={`/login?next=${encodeURIComponent(pathname || '/')}`} className={styles.ctaBtn}>
          <LogIn size={16} /> Sign In
        </Link>
        <Link href="/register" className={styles.secondaryLink}>Don&apos;t have an account? Create one</Link>
      </div>
    </div>
  );
}
