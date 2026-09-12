'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, BarChart3, LineChart, Users, MessageSquare,
  Apple, Dumbbell, BookOpen, Sparkles, DollarSign, Settings, LogOut,
  Salad, ScanFace, Heart, CalendarDays, Star, TrendingUp, Megaphone, Wallet, Shield, ChevronDown, ChevronRight, Zap
} from 'lucide-react';
import { displayName } from '@/lib/utils';
import styles from './Sidebar.module.css';

import { traineeCategories, trainerCategories } from '@/lib/navConfig';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [openCategory, setOpenCategory] = useState('');

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
  const categories = isTrainer ? trainerCategories : traineeCategories;

  useEffect(() => {
    if (!categories) return;
    const activeCat = categories.find(cat => cat.links.some(link => pathname === link.href || (link.href !== '/dashboard' && link.href !== '/trainer-dashboard' && pathname.startsWith(link.href))));
    if (activeCat && !openCategory) setOpenCategory(activeCat.title);
  }, [pathname, categories]);

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
        {categories.map(category => (
          <div key={category.title} className={styles.categoryGroup}>
            <button 
              className={styles.categoryHeader} 
              onClick={() => setOpenCategory(openCategory === category.title ? '' : category.title)}
            >
              <span className={styles.categoryTitle}>{category.title}</span>
              {openCategory === category.title ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            
            <div className={`${styles.categoryLinks} ${openCategory === category.title ? styles.open : ''}`}>
              {category.links.map(item => {
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
          </div>
        ))}
      </div>

      <div className={styles.bottom}>
        {!isTrainer && (
          <Link href="/upgrade" className={`${styles.menuItem} ${styles.upgradeBtn}`}>
            <Zap size={20} />
            <span>Upgrade Plan</span>
          </Link>
        )}
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
