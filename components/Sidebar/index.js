'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, BarChart3, LineChart, Users, MessageSquare,
  Apple, Dumbbell, BookOpen, Sparkles, DollarSign, Settings, LogOut, Salad, ScanFace, Heart
} from 'lucide-react';
import { displayName } from '@/lib/utils';
import styles from './Sidebar.module.css';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transformation', label: 'Transformation', icon: Sparkles },
  { href: '/dashboard/favorites', label: 'Favorites', icon: Heart },
  { href: '/progress', label: 'Progress', icon: LineChart },
  { href: '/tracker', label: 'Tracker', icon: BarChart3 },
  { href: '/trainers', label: 'Trainers', icon: Users },
  { href: '/forum', label: 'Forum', icon: MessageSquare },
  { href: '/diet', label: 'Diet Plans', icon: Apple },
  { href: '/nutrition', label: 'Nutrition', icon: Salad },
  { href: '/coach', label: 'AI Coach', icon: Sparkles },
  { href: '/form-check', label: 'Form Check', icon: ScanFace },
  { href: '/notes', label: 'Notes', icon: BookOpen },
  { href: '/monetization', label: 'Monetization', icon: DollarSign },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <aside className={styles.sidebar}>
      {user && (
        <Link href="/settings" className={styles.profile}>
          <div className={styles.avatar}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={displayName(user)} />
            ) : (
              <span>{displayName(user)?.[0]?.toUpperCase() || '?'}</span>
            )}
          </div>
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{displayName(user)}</span>
            <span className={styles.profilePlan}>{user.plan || 'free'} plan</span>
          </div>
        </Link>
      )}

      <div className={styles.menu}>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className={styles.bottom}>
        <Link href="/settings" className={`${styles.menuItem} ${pathname === '/settings' ? styles.active : ''}`}>
          <Settings size={20} />
          <span>Settings</span>
        </Link>
        {user?.role === 'admin' && (
          <Link href="/admin" className={styles.menuItem}>
            <Settings size={20} />
            <span>Admin Panel</span>
          </Link>
        )}
        <button className={styles.logout} onClick={handleLogout} disabled={loggingOut}>
          <LogOut size={20} />
          <span>{loggingOut ? 'Signing out…' : 'Sign Out'}</span>
        </button>
      </div>
    </aside>
  );
}
