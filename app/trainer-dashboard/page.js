'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users, DollarSign, Calendar, MessageSquare, Star, TrendingUp,
  Eye, Wallet, Zap, Award, ArrowUpRight, Megaphone, Settings, Loader2, Bell, Clock, Shield
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

export default function TrainerDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trainer/stats')
      .then(r => {
        if (r.status === 401) {
          router.push('/login?next=/trainer-dashboard');
          return null;
        }
        return r.json();
      })
      .then(d => { if (d) setData(d); })
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false));

    fetch('/api/escrow?status=held')
      .then(r => r.json())
      .then(d => { if (d.transactions) setEscrows(d.transactions); })
      .catch(() => {});
  }, [router]);

  const handleRequestFunds = async (txId) => {
    const res = await fetch('/api/escrow', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId: txId, action: 'request' })
    });
    const data = await res.json();
    if (data.success || res.ok) {
      alert('Request sent to the trainee successfully!');
    } else {
      alert(data.error || 'Failed to request funds.');
    }
  };

  if (loading || !data) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <div className={styles.content}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <Loader2 size={32} className={styles.spin} style={{ color: '#22c55e' }} />
          </div>
        </div>
      </div>
    );
  }

  const { stats, profile } = data;

  return (
    <div className={styles.page}>
      <Sidebar />
      <div className={styles.content}>
        <div className="container">

          {/* Header */}
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>
                Welcome back, {profile.username}
                {profile.isFeatured && <Zap size={20} style={{ color: 'gold', marginLeft: '8px' }} />}
              </h1>
              <p className={styles.subtitle}>
                {profile.specialties.length > 0
                  ? profile.specialties.join(' · ')
                  : 'Manage your clients, schedule, and earnings.'}
              </p>
            </div>
            <div className={styles.headerActions}>
              <Link href="/settings" className={styles.actionBtnOutline}><Settings size={16} /> Edit Profile</Link>
              <Link href="/upgrade" className={styles.actionBtnSolid}><Megaphone size={16} /> Boost Profile</Link>
            </div>
          </div>

          {profile.isApproved ? (
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '16px 24px', borderRadius: '12px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: '#22c55e', color: '#000', padding: '8px', borderRadius: '50%' }}>
                <Award size={24} />
              </div>
              <div>
                <h3 style={{ color: '#22c55e', margin: 0, fontSize: '1.1rem' }}>Profile Approved & Active</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                  Your trainer profile is live! You can now accept bookings from clients.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '24px', borderRadius: '12px', marginBottom: '32px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ background: '#f59e0b', color: '#000', padding: '8px', borderRadius: '50%' }}>
                <Clock size={24} />
              </div>
              <div>
                <h3 style={{ color: '#f59e0b', marginBottom: '8px' }}>Profile Pending Approval</h3>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                  Your trainer application has been received and is currently under review by our Admin team. 
                  You will get a feedback in less than 48 hours. Once approved, your profile will go live in the Trainer Directory and you'll be able to accept bookings.
                </p>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className={styles.statsGrid} style={{ opacity: profile.isApproved ? 1 : 0.5, pointerEvents: profile.isApproved ? 'auto' : 'none' }}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}><Wallet size={20} /></div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>${stats.escrowBalance.toFixed(2)}</span>
                <span className={styles.statLabel}>Escrow Balance</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}><Users size={20} /></div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.followersCount}</span>
                <span className={styles.statLabel}>Followers</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><Calendar size={20} /></div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.upcomingSessions}</span>
                <span className={styles.statLabel}>Upcoming Sessions</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}><Eye size={20} /></div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.profileViews}</span>
                <span className={styles.statLabel}>Profile Views</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className={styles.mainGrid} style={{ opacity: profile.isApproved ? 1 : 0.5, pointerEvents: profile.isApproved ? 'auto' : 'none' }}>

            {/* Left Column */}
            <div className={styles.col}>
              {/* Earnings Overview */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3><DollarSign size={18} /> Earnings Overview</h3>
                  <span className={styles.badge} style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>15% platform fee</span>
                </div>
                <div className={styles.earningsGrid}>
                  <div className={styles.earningItem}>
                    <span className={styles.earningLabel}>Total Earnings</span>
                    <span className={styles.earningValue}>${stats.totalEarnings.toFixed(2)}</span>
                  </div>
                  <div className={styles.earningItem}>
                    <span className={styles.earningLabel}>This Month</span>
                    <span className={styles.earningValue}>${stats.monthlyEarnings.toFixed(2)}</span>
                  </div>
                  <div className={styles.earningItem}>
                    <span className={styles.earningLabel}>Available to Withdraw</span>
                    <span className={styles.earningValue} style={{ color: '#22c55e' }}>${stats.escrowBalance.toFixed(2)}</span>
                  </div>
                </div>
                <button className={styles.withdrawBtn} disabled={stats.escrowBalance === 0}>
                  <Wallet size={16} /> {stats.escrowBalance > 0 ? 'Withdraw Funds' : 'No funds to withdraw'}
                </button>
              </div>

              {/* Recent Messages */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3><MessageSquare size={18} /> Recent Messages</h3>
                </div>
                <div className={styles.emptyState}>
                  <MessageSquare size={36} style={{ opacity: 0.2 }} />
                  <p>No client messages yet.</p>
                  <span>Messages from your clients will appear here.</span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className={styles.col}>
              {/* Schedule */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3><Calendar size={18} /> Active Bookings</h3>
                </div>
                {escrows.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Calendar size={36} style={{ opacity: 0.2 }} />
                    <p>No active bookings.</p>
                    <span>Your booked training sessions will show up here.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
                    {escrows.map(tx => (
                      <div key={tx._id} style={{ background: 'var(--color-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 600 }}>Session with {tx.trainee?.username || 'Client'}</span>
                          <span style={{ color: '#22c55e', fontWeight: 600 }}>${tx.trainerEarnings.toFixed(2)}</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>{tx.description}</p>
                        <button
                          onClick={() => handleRequestFunds(tx._id)}
                          style={{ width: '100%', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '8px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Request Fund Release
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reviews */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3><Star size={18} /> Reviews & Ratings</h3>
                  <span className={styles.badge} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                    <Star size={12} /> {stats.rating > 0 ? stats.rating.toFixed(1) : 'New'}
                  </span>
                </div>
                <div className={styles.emptyState}>
                  <Award size={36} style={{ opacity: 0.2 }} />
                  <p>No reviews yet.</p>
                  <span>Client reviews will appear here after sessions.</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3><Zap size={18} /> Quick Actions</h3>
                </div>
                <div className={styles.quickActions}>
                  <Link href="/settings" className={styles.quickAction}>
                    <Settings size={16} /> Update Profile <ArrowUpRight size={14} />
                  </Link>
                  <Link href="/upgrade" className={styles.quickAction}>
                    <Megaphone size={16} /> Boost Profile <ArrowUpRight size={14} />
                  </Link>
                  <Link href="/trainer-dashboard/programs" className={styles.quickAction}>
                    <TrendingUp size={16} /> Create Program <ArrowUpRight size={14} />
                  </Link>
                  <Link href="/admin/login" className={styles.quickAction} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '8px', paddingTop: '16px' }}>
                    <Shield size={16} /> Platform Administration <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
