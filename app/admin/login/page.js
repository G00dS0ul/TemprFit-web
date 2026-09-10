'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, Lock } from 'lucide-react';
import Logo3D from '@/components/Logo3D';
import AnimatedBackground from '@/components/AnimatedBackground';
import styles from '../../login/page.module.css';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      router.push('/admin');
    } catch (err) {
      setError('Could not reach the server.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.bgWrapper}>
          <AnimatedBackground />
        </div>
        <div className={styles.leftContent}>
          <Logo3D size={120} />
          <h2>Command Center</h2>
          <p>Restricted access. Only authorized platform administrators may proceed past this point.</p>
          <div className={styles.benefits}>
            <div className={styles.benefit}><Shield size={16} /> Secure access required</div>
          </div>
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.formCard}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <h1>Admin Authentication</h1>
            <p>Enter the master password to access the admin panel.</p>

            <div className={styles.inputGroup}>
              <label>Master Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type="password"
                  placeholder="Enter password..."
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className={styles.eyeBtn} style={{ cursor: 'default' }}>
                  <Lock size={16} />
                </button>
              </div>
            </div>

            {error && <p className={styles.errorText}>{error}</p>}

            <button type="submit" className={styles.submitBtn} disabled={loading || !password}>
              {loading ? 'Authenticating...' : 'Access Command Center'} <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
