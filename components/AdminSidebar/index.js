'use client';

import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Wallet, TicketCheck, BarChart3,
  Settings, LogOut, Shield
} from 'lucide-react';
import styles from './AdminSidebar.module.css';

export default function AdminSidebar({ activeTab, onTabChange }) {
  const router = useRouter();

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'applications', label: 'Applications', icon: Shield },
    { id: 'escrow', label: 'Escrow & Disputes', icon: Wallet },
    { id: 'coupons', label: 'Coupons', icon: TicketCheck },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    // Clear admin cookie
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/');
    router.refresh();
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandIcon}><Shield size={20} /></div>
        <div className={styles.brandInfo}>
          <span className={styles.brandName}>TemprFit</span>
          <span className={styles.brandRole}>Admin Console</span>
        </div>
      </div>

      <div className={styles.menu}>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.bottom}>
        <button className={styles.logout} onClick={handleLogout}>
          <LogOut size={18} />
          <span>Exit Admin</span>
        </button>
      </div>
    </aside>
  );
}
