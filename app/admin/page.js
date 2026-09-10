'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Users, Activity, DollarSign, Wallet, ShieldCheck, Loader2, Check, X } from 'lucide-react';
import styles from './page.module.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingTrainers, setPendingTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
        setPendingTrainers(data.pendingTrainers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (trainerId, isApproved) => {
    try {
      const res = await fetch('/api/admin/trainers/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainerId, isApproved })
      });
      const data = await res.json();
      if (data.success) {
        setPendingTrainers(pendingTrainers.filter(t => t._id !== trainerId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <Sidebar />
        <div style={{ marginLeft: '250px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Loader2 size={40} className="spin" style={{ color: '#ef4444' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <Sidebar />
      <div className="container" style={{ marginLeft: '250px', width: 'calc(100% - 250px)' }}>
        <div className={styles.header}>
          <h1>Admin <span className={styles.gradient}>Command Center</span></h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Platform overview and management.</p>
        </div>

        {stats && (
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
              <div className={styles.statValue}>${stats.totalRevenue?.toFixed(2) || '0.00'}</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <Wallet size={20} color="#8b5cf6" /> Funds in Escrow
              </div>
              <div className={styles.statValue}>${stats.heldFunds?.toFixed(2) || '0.00'}</div>
            </div>
          </div>
        )}

        <div className={styles.trainersSection}>
          <h2>Pending Trainer Approvals</h2>
          {pendingTrainers.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>No trainers pending approval.</p>
          ) : (
            <div className={styles.trainerList}>
              {pendingTrainers.map(trainer => (
                <div key={trainer._id} className={styles.trainerCard}>
                  <div className={styles.trainerInfo}>
                    <span className={styles.trainerName}>{trainer.username}</span>
                    <span className={styles.trainerEmail}>{trainer.email}</span>
                  </div>
                  <div className={styles.actions}>
                    <button 
                      className={styles.approveBtn} 
                      onClick={() => handleApproval(trainer._id, true)}
                    >
                      <Check size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Approve
                    </button>
                    <button 
                      className={styles.rejectBtn}
                      onClick={() => handleApproval(trainer._id, false)}
                    >
                      <X size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
