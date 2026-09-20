'use client';

import { useEffect, useState } from 'react';
import { Users, DollarSign, Wallet, ShieldCheck, Loader2, Check, X, PieChart as PieChartIcon, TrendingUp, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import UserManagement from './UserManagement';
import styles from './page.module.css';

const COLORS = ['#94a3b8', '#3b82f6', '#f59e0b']; // Free, Pro, Max

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchDisputes();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data) {
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputes = async () => {
    try {
      const res = await fetch('/api/admin/disputes');
      const data = await res.json();
      if (data.disputes) setDisputes(data.disputes);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Loader2 size={40} className="spin" style={{ color: '#ef4444' }} />
        </div>
      </div>
    );
  }

  const pieData = stats ? [
    { name: 'Free', value: stats.freeUsers },
    { name: 'Pro', value: stats.proUsers },
    { name: 'Max', value: stats.maxUsers }
  ] : [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Admin <span className={styles.gradient}>Command Center</span></h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Platform overview and analytics.</p>
      </div>

      {stats && (
        <>
          <div className={styles.grid}>
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <Users size={20} color="#3b82f6" /> Total Users
              </div>
              <div className={styles.statValue}>{stats.totalUsers}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <ShieldCheck size={20} color="#22c55e" /> Total Trainers
              </div>
              <div className={styles.statValue}>{stats.totalTrainers}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <DollarSign size={20} color="#f59e0b" /> Escrow Revenue (15%)
              </div>
              <div className={styles.statValue}>${stats.totalEscrowRevenue?.toFixed(2) || '0.00'}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <Wallet size={20} color="#8b5cf6" /> Funds in Escrow
              </div>
              <div className={styles.statValue}>${stats.heldFunds?.toFixed(2) || '0.00'}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
            {/* User Growth Chart */}
            <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><BarChart2 size={18} color="#3b82f6" /> New User Growth (6 Months)</h3>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <BarChart data={stats.userGrowth}>
                    <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: 'var(--color-surface-elevated)', border: 'none', borderRadius: '8px', color: 'var(--color-text)' }} />
                    <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Escrow Revenue Chart */}
            <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><TrendingUp size={18} color="#f59e0b" /> Escrow Revenue Trend</h3>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <AreaChart data={stats.escrowGrowth}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip contentStyle={{ background: 'var(--color-surface-elevated)', border: 'none', borderRadius: '8px', color: 'var(--color-text)' }} formatter={v => `$${v.toFixed(2)}`} />
                    <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subscription Breakdown Chart */}
            <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><PieChartIcon size={18} color="#8b5cf6" /> Subscription Distribution</h3>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--color-surface-elevated)', border: 'none', borderRadius: '8px', color: 'var(--color-text)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
                {pieData.map((entry, index) => (
                  <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: COLORS[index] }} />
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div className={styles.section} style={{ marginTop: '40px' }}>
        <h2>Manage Active Disputes</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>Review escrow payments that have been disputed by users.</p>
        
        {disputes.length === 0 ? (
          <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>No active disputes found.</p>
          </div>
        ) : (
          <div className={styles.escrowList}>
            {disputes.map(dispute => {
              const b = dispute.booking;
              return (
                <div key={dispute._id} className={styles.trainerCard} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                  <div className={styles.trainerInfo}>
                    <span className={styles.trainerName}>Dispute for Booking: {b.trainee?.username} → {b.trainer?.username} ({b.program?.title})</span>
                    <span className={styles.trainerEmail}>Amount Paid: ${b.amountPaid.toFixed(2)} | Raised by: {dispute.raisedBy?.username}</span>
                    <p style={{ marginTop: '8px', fontStyle: 'italic', color: 'var(--color-text-muted)' }}>Reason: "{dispute.reason}"</p>
                  </div>
                  <div className={styles.actions}>
                    <button 
                      className={styles.rejectBtn}
                      onClick={async () => {
                        const res = await fetch('/api/admin/disputes', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ disputeId: dispute._id, action: 'refund_trainee', resolution: 'Admin resolved in favor of trainee (Refund)' })
                        });
                        if (res.ok) fetchDisputes();
                      }}
                    >
                      <X size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Refund Trainee
                    </button>
                    <button 
                      className={styles.approveBtn} 
                      onClick={async () => {
                        const res = await fetch('/api/admin/disputes', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ disputeId: dispute._id, action: 'release_to_trainer', resolution: 'Admin resolved in favor of trainer (Release)' })
                        });
                        if (res.ok) fetchDisputes();
                      }}
                    >
                      <Check size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Force Release to Trainer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <UserManagement />
    </div>
  );
}
