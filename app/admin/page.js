'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Users, Activity, DollarSign, Wallet, ShieldCheck, Loader2, Check, X } from 'lucide-react';
import styles from './page.module.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingTrainers, setPendingTrainers] = useState([]);
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchEscrows();
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

  const fetchEscrows = async () => {
    try {
      const res = await fetch('/api/escrow');
      const data = await res.json();
      if (data.transactions) {
        setEscrows(data.transactions);
      }
    } catch (e) {
      console.error(e);
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Loader2 size={40} className="spin" style={{ color: '#ef4444' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={`container ${styles.adminContainer}`}>
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

        <div className={styles.section} style={{ marginTop: '40px' }}>
          <h2>Manage Escrow Transactions</h2>
          {escrows.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>No escrow transactions found.</p>
          ) : (
            <div className={styles.escrowList}>
              {escrows.map(tx => (
                <div key={tx._id} className={styles.trainerCard} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                  <div className={styles.trainerInfo}>
                    <span className={styles.trainerName}>Booking: {tx.trainee?.username} → {tx.trainer?.username}</span>
                    <span className={styles.trainerEmail}>Amount: ${tx.amount.toFixed(2)} | Status: <strong>{tx.status.toUpperCase()}</strong></span>
                  </div>
                  {tx.status === 'requested' || tx.status === 'held' ? (
                    <div className={styles.actions}>
                      <button 
                        className={styles.approveBtn} 
                        onClick={async () => {
                          const res = await fetch('/api/escrow', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ transactionId: tx._id, action: 'release' })
                          });
                          const data = await res.json();
                          if (data.success) {
                            fetchEscrows(); // Reload
                          } else {
                            alert(data.error);
                          }
                        }}
                      >
                        <Check size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Admin Force Release
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
