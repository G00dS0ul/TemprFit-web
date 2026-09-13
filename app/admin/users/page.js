'use client';

import { useEffect, useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import styles from '../page.module.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [notifyUserId, setNotifyUserId] = useState(null);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserPlan = async (userId, plan) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates: { plan } })
      });
      fetchUsers();
    } catch (e) {}
  };

  const handleSendNotification = async () => {
    if (!notifyMessage) return;
    setActionLoading(true);
    try {
      await fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: notifyUserId, title: 'Admin Notice', message: notifyMessage })
      });
      setNotifyUserId(null);
      setNotifyMessage('');
      alert('Notification sent!');
    } catch (e) {}
    setActionLoading(false);
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
      <div className={styles.header}>
        <h1>User <span className={styles.gradient}>Directory</span></h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Manage all platform users, update plans, and send notices.</p>
      </div>

      <div className={styles.section} style={{ marginTop: '24px' }}>
        <div style={{ overflowX: 'auto', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '16px' }}>Username</th>
                <th style={{ padding: '16px' }}>Email</th>
                <th style={{ padding: '16px' }}>Role</th>
                <th style={{ padding: '16px' }}>Plan Tier</th>
                <th style={{ padding: '16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px', fontWeight: 600 }}>{u.username}</td>
                  <td style={{ padding: '16px', color: 'var(--color-text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                      background: u.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : u.role === 'trainer' ? 'rgba(34, 197, 94, 0.1)' : 'var(--color-surface-elevated)',
                      color: u.role === 'admin' ? '#ef4444' : u.role === 'trainer' ? '#22c55e' : 'var(--color-text)'
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <select 
                      value={u.plan} 
                      onChange={(e) => handleUpdateUserPlan(u._id, e.target.value)}
                      style={{ padding: '6px', borderRadius: '6px', background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="max">Max</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button 
                      onClick={() => setNotifyUserId(u._id)}
                      style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Notify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {notifyUserId && (
          <div style={{ marginTop: '24px', background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <h3>Send Direct Notification</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>Send a direct system alert/warning to this user.</p>
            <textarea 
              rows={3} 
              placeholder="Notification message..." 
              value={notifyMessage}
              onChange={e => setNotifyMessage(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-border)', marginBottom: '12px', resize: 'none' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleSendNotification} disabled={actionLoading} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                {actionLoading ? 'Sending...' : 'Send Notification'}
              </button>
              <button onClick={() => setNotifyUserId(null)} style={{ background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
