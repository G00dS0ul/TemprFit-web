'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, BarChart3, LineChart, Users, MessageSquare,
  Apple, Dumbbell, BookOpen, Sparkles, DollarSign, Settings, LogOut,
  Salad, ScanFace, Heart, CalendarDays, Star, TrendingUp, Megaphone, Wallet, Shield
} from 'lucide-react';
import { displayName } from '@/lib/utils';
import styles from './Sidebar.module.css';

/* ─── Role-specific menu configs ─── */

const traineeMenu = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transformation', label: 'Transformation', icon: Sparkles },
  { href: '/dashboard/favorites', label: 'Favorites', icon: Heart },
  { href: '/progress', label: 'Progress', icon: LineChart },
  { href: '/tracker', label: 'Tracker', icon: BarChart3 },
  { href: '/health/calculator', label: 'BMI Calc', icon: BarChart3 },
  { href: '/trainers', label: 'Trainers', icon: Users },
  { href: '/moments', label: 'Moments', icon: Sparkles },
  { href: '/forum', label: 'Forum', icon: MessageSquare },
  { href: '/diet', label: 'Diet Plans', icon: Apple },
  { href: '/nutrition', label: 'Nutrition', icon: Salad },
  { href: '/coach', label: 'AI Coach', icon: Sparkles },
  { href: '/form-check', label: 'Form Check', icon: ScanFace },
  { href: '/notes', label: 'Notes', icon: BookOpen },
];

const trainerMenu = [
  { href: '/trainer-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/trainer-dashboard/clients', label: 'My Clients', icon: Users },
  { href: '/trainer-dashboard/messages', label: 'Messages', icon: MessageSquare },
  { href: '/trainer-dashboard/earnings', label: 'Escrow & Earnings', icon: Wallet },
  { href: '/trainer-dashboard/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/trainer-dashboard/programs', label: 'My Programs', icon: Dumbbell },
  { href: '/trainer-dashboard/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/trainer-dashboard/reviews', label: 'Reviews', icon: Star },
  { href: '/upgrade', label: 'Boost Profile', icon: Megaphone },
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

  const isTrainer = user?.role === 'trainer';
  const menuItems = isTrainer ? trainerMenu : traineeMenu;

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
            <Link href="/upgrade" onClick={(e) => e.stopPropagation()}>
              <span className={styles.profilePlan} style={{ cursor: 'pointer' }}>
                {isTrainer ? 'Trainer' : (user.plan || 'free') + ' plan'}
              </span>
            </Link>
          </div>
        </Link>
      )}

      {isTrainer && (
        <div className={styles.roleBadge}>
          <Dumbbell size={14} /> <span>Trainer Mode</span>
        </div>
      )}

      <div className={styles.menu}>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/trainer-dashboard' && item.href !== '/dashboard' && pathname.startsWith(item.href));
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
        {user?.role === 'admin' && (
          <Link href="/admin" className={styles.menuItem} style={{ color: '#ef4444' }}>
            <Shield size={20} />
            <span>Admin Portal</span>
          </Link>
        )}
        <Link href="/settings" className={`${styles.menuItem} ${pathname === '/settings' ? styles.active : ''}`}>
          <Settings size={20} />
          <span>Settings</span>
        </Link>
        <button className={styles.logout} onClick={handleLogout} disabled={loggingOut}>
          <LogOut size={20} />
          <span>{loggingOut ? 'Signing out…' : 'Sign Out'}</span>
        </button>
      </div>
    </aside>
  );
}
