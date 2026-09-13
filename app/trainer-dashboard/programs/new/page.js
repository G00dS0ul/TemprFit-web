'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

export default function NewProgram() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: 'General Fitness',
    description: '',
    price: 100,
    sessionsPerWeek: 3,
    totalSessions: 12,
    freeSessions: 1,
    trainingMode: 'remote',
    language: 'English',
    country: 'Global'
  });

  const CATEGORIES = [
    'General Fitness', 'Hypertrophy', 'Strength', 'Endurance', 
    'Flexibility', 'Weight Loss', 'Athletic Performance', 'Rehabilitation'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to create program');
      } else {
        router.push('/trainer-dashboard/programs');
      }
    } catch (err) {
      setError('An error occurred while creating the program.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Sidebar />
      <div className={styles.content}>
        <div className="container">
          <Link href="/trainer-dashboard/programs" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', marginBottom: '24px', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back to Programs
          </Link>

          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Create New Program</h1>
              <p className={styles.subtitle}>Define the structure and pricing for your new training program.</p>
            </div>
          </div>

          <form className={styles.card} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              {error && <div className={styles.errorText}>{error}</div>}

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>Program Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. 12-Week Body Recomposition" 
                  required 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>Description</label>
                <textarea 
                  placeholder="Detail what clients can expect, requirements, and outcomes..." 
                  required
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>Training Mode</label>
                <div className={styles.optionsGrid}>
                  {['remote', 'physical', 'hybrid'].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      className={`${styles.optionBtn} ${formData.trainingMode === mode ? styles.selected : ''}`}
                      onClick={() => setFormData({...formData, trainingMode: mode})}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Total Price ($)</label>
                <input 
                  type="number" 
                  min={1} 
                  required 
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Sessions Per Week</label>
                <input 
                  type="number" 
                  min={1} 
                  max={7}
                  required 
                  value={formData.sessionsPerWeek}
                  onChange={e => setFormData({...formData, sessionsPerWeek: e.target.value})}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Total Sessions in Program</label>
                <input 
                  type="number" 
                  min={1} 
                  required 
                  value={formData.totalSessions}
                  onChange={e => setFormData({...formData, totalSessions: e.target.value})}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Free Trial Sessions (Optional)</label>
                <input 
                  type="number" 
                  min={0} 
                  value={formData.freeSessions}
                  onChange={e => setFormData({...formData, freeSessions: e.target.value})}
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Language</label>
                <input 
                  type="text" 
                  placeholder="e.g. English" 
                  value={formData.language}
                  onChange={e => setFormData({...formData, language: e.target.value})}
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Target Country / Region</label>
                <input 
                  type="text" 
                  placeholder="e.g. Global, US, UK" 
                  value={formData.country}
                  onChange={e => setFormData({...formData, country: e.target.value})}
                />
              </div>

              <div className={`${styles.actions} ${styles.fullWidth}`}>
                <Link href="/trainer-dashboard/programs" className={styles.cancelBtn}>
                  Cancel
                </Link>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? <Loader2 size={18} className={styles.spin} /> : <Save size={18} />}
                  Publish Program
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
