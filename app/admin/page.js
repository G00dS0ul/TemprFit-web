'use client';

import { useState } from 'react';
import { 
  Users, DollarSign, Activity, TrendingUp, TrendingDown,
  Search, Filter, MoreHorizontal, Shield, CheckCircle, XCircle
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ChartWidget from '@/components/ChartWidget';
import StatsCard from '@/components/StatsCard';
import { adminStats, monetizationFeatures } from '@/lib/data';
import styles from './page.module.css';

export default function Admin() {
  const [tab, setTab] = useState('overview');

  const revenueData = [
    { value: 85000 }, { value: 92000 }, { value: 88000 }, { value: 95000 },
    { value: 102000 }, { value: 98000 }, { value: 110000 }, { value: 125000 },
  ];

  const userGrowth = [
    { value: 35000 }, { value: 38000 }, { value: 41000 }, { value: 43000 },
    { value: 45000 }, { value: 47000 }, { value: 49000 }, { value: 50000 },
  ];

  const recentUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', plan: 'Pro', status: 'active', joined: '2 hours ago' },
    { id: 2, name: 'Sarah Smith', email: 'sarah@example.com', plan: 'Elite', status: 'active', joined: '5 hours ago' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', plan: 'Free', status: 'pending', joined: '1 day ago' },
    { id: 4, name: 'Emily Brown', email: 'emily@example.com', plan: 'Pro', status: 'active', joined: '2 days ago' },
    { id: 5, name: 'Chris Wilson', email: 'chris@example.com', plan: 'Free', status: 'suspended', joined: '3 days ago' },
  ];

  return (
    <div className={styles.page}>
      <Sidebar />
      <div className={styles.content}>
        <div className="container">
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Admin Panel</h1>
              <p className={styles.subtitle}>Platform analytics, user management, and monetization controls.</p>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.actionBtn}><Search size={16} /></button>
              <button className={styles.actionBtn}><Filter size={16} /></button>
            </div>
          </div>

          <div className={styles.tabs}>
            {['overview', 'users', 'monetization', 'trainers', 'reports'].map(t => (
              <button
                key={t}
                className={`${styles.tab} ${tab === t ? styles.activeTab : ''}`}
                onClick={() => setTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <>
              <div className={styles.statsGrid}>
                <StatsCard label="Total Users" value="50,000" change="+12%" />
                <StatsCard label="Revenue (MTD)" value="$125,000" change="+18%" />
                <StatsCard label="Active Trainers" value="1,200" change="+8%" />
                <StatsCard label="Churn Rate" value="2.1%" change="-0.3%" />
              </div>

              <div className={styles.chartsRow}>
                <ChartWidget data={revenueData} type="line" title="Monthly Revenue" color="#22c55e" />
                <ChartWidget data={userGrowth} type="bar" title="User Growth" color="#06b6d4" />
              </div>
            </>
          )}

          {tab === 'users' && (
            <div className={styles.tableSection}>
              <div className={styles.tableHeader}>
                <h3>Recent Users</h3>
                <input type="text" placeholder="Search users..." className={styles.searchInput} />
              </div>
              <div className={styles.table}>
                <div className={styles.tableHead}>
                  <span>User</span>
                  <span>Plan</span>
                  <span>Status</span>
                  <span>Joined</span>
                  <span>Actions</span>
                </div>
                {recentUsers.map(user => (
                  <div key={user.id} className={styles.tableRow}>
                    <div className={styles.userCell}>
                      <div className={styles.userAvatar}>{user.name.charAt(0)}</div>
                      <div>
                        <span className={styles.userName}>{user.name}</span>
                        <span className={styles.userEmail}>{user.email}</span>
                      </div>
                    </div>
                    <span className={`${styles.planBadge} ${styles[user.plan.toLowerCase()]}`}>{user.plan}</span>
                    <span className={`${styles.statusBadge} ${styles[user.status]}`}>
                      {user.status === 'active' ? <CheckCircle size={12} /> : 
                       user.status === 'suspended' ? <XCircle size={12} /> : <Shield size={12} />}
                      {user.status}
                    </span>
                    <span className={styles.timeCell}>{user.joined}</span>
                    <button className={styles.moreBtn}><MoreHorizontal size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'monetization' && (
            <div className={styles.monetizationSection}>
              <div className={styles.monetizationGrid}>
                {monetizationFeatures.map((item, i) => (
                  <div key={i} className={styles.monetizationCard}>
                    <div className={styles.monetizationHeader}>
                      <h4>{item.title}</h4>
                      <span className={`${styles.growthBadge} ${item.growth.startsWith('+') ? styles.positive : styles.negative}`}>
                        <TrendingUp size={12} /> {item.growth}
                      </span>
                    </div>
                    <span className={styles.monetizationRevenue}>{item.revenue}</span>
                  </div>
                ))}
              </div>

              <div className={styles.affiliateSection}>
                <h3>Affiliate Program</h3>
                <p>Earn 30% recurring commission for every user you refer to RepForge.</p>
                <div className={styles.affiliateCode}>
                  <code>FORGE-AFF-2024-X7K9M2</code>
                  <button>Copy</button>
                </div>
                <div className={styles.affiliateStats}>
                  <div>
                    <span className={styles.affiliateValue}>234</span>
                    <span className={styles.affiliateLabel}>Referrals</span>
                  </div>
                  <div>
                    <span className={styles.affiliateValue}>$4,200</span>
                    <span className={styles.affiliateLabel}>Earned</span>
                  </div>
                  <div>
                    <span className={styles.affiliateValue}>$1,800</span>
                    <span className={styles.affiliateLabel}>Pending</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
