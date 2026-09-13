'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Calendar, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

export default function MyClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trainer/clients')
      .then(r => {
        if (!r.ok) {
          if (r.status === 401) router.push('/dashboard');
          throw new Error('Failed to fetch clients');
        }
        return r.json();
      })
      .then(data => {
        if (data.clients) setClients(data.clients);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  const handleMessage = async (userId) => {
    try {
      const res = await fetch('/api/messages/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId })
      });
      const data = await res.json();
      if (data.success) {
        router.push('/messages');
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Loader2 size={40} className="spin" style={{ color: '#22c55e' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <Sidebar />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>My Clients</h1>
          <p>Manage your active and past clients.</p>
        </div>

        {clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'var(--surface)', borderRadius: '12px' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>You don't have any clients yet.</p>
          </div>
        ) : (
          <div className={styles.clientGrid}>
            {clients.map(client => (
              <div key={client.user._id} className={styles.clientCard}>
                <div className={styles.clientHeader}>
                  <img 
                    src={client.user.avatarUrl || `https://ui-avatars.com/api/?name=${client.user.username}&background=22c55e&color=fff`} 
                    alt={client.user.username} 
                    className={styles.avatar} 
                  />
                  <div className={styles.clientInfo}>
                    <h3>{client.user.username}</h3>
                    <p>{client.user.email}</p>
                  </div>
                </div>

                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Active Program</span>
                    <span className={styles.statValue} style={{ color: client.activeProgram ? '#22c55e' : 'inherit', fontSize: '0.9rem' }}>
                      {client.activeProgram || 'None'}
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Total Paid</span>
                    <span className={styles.statValue}>${client.totalPaid.toFixed(2)}</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button className={styles.btnPrimary} onClick={() => handleMessage(client.user._id)}>
                    <MessageSquare size={16} /> Message
                  </button>
                  <button className={styles.btnSecondary} onClick={() => router.push('/trainer-dashboard/schedule')}>
                    <Calendar size={16} /> Schedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
