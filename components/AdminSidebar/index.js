'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Activity, ShieldCheck, Users, Tag, Dumbbell, 
  MessageSquare, Settings, LogOut 
} from 'lucide-react';
import Image from 'next/image';
import styles from './AdminSidebar.module.css';

export default function AdminSidebar() {
  const pathname = usePathname();
  const [counters, setCounters] = useState({ trainers: 0, users: 0, bookings: 0 });

  useEffect(() => {
    fetch('/api/admin/sidebar-counters')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setCounters(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    // Admins log out by clearing the token and returning to normal dashboard
    document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = '/dashboard';
  };

  const menuItems = [
    { href: '/admin', label: 'Overview', icon: Activity, exact: true },
    { href: '/admin/trainers', label: 'Trainers', icon: ShieldCheck, exact: false, count: counters.trainers },
    { href: '/admin/users', label: 'Users', icon: Users, exact: false, count: counters.users },
    { href: '/admin/coupons', label: 'Coupons', icon: Tag, exact: false },
    { href: '/admin/exercises', label: 'Exercises', icon: Dumbbell, exact: false },
    { href: '/admin/moderation', label: 'Moderation', icon: MessageSquare, exact: false },
    { href: '/admin/bookings', label: 'Bookings', icon: Activity, exact: false, count: counters.bookings },
  ];

  return (
    <aside className={styles.sidebar}>
      <Link href="/admin" className={styles.logo}>
        <Image src="/images/brand/my-logo.png" alt="TemprFit" width={32} height={32} priority />
        <span className={styles.logoText}>TemprFit</span>
        <span className={styles.logoAdmin}>Admin</span>
      </Link>

      <div className={styles.menu}>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          
          return (
            <Link key={item.href} href={item.href} className={`${styles.menuItem} ${isActive ? styles.active : ''}`}>
              <Icon size={20} />
              <span>{item.label}</span>
              {item.count > 0 && <span className={styles.badge}>{item.count}</span>}
            </Link>
          );
        })}
      </div>

      <div className={styles.bottom}>
        <Link href="/admin/settings" className={`${styles.menuItem} ${pathname.startsWith('/admin/settings') ? styles.active : ''}`}>
          <Settings size={20} />
          <span>Settings</span>
        </Link>
        <button onClick={handleLogout} className={styles.menuItem} style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', color: '#ef4444' }}>
          <LogOut size={20} />
          <span>Exit Admin</span>
        </button>
      </div>
    </aside>
  );
}
