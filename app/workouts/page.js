'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Sparkles, Dumbbell } from 'lucide-react';
import styles from './workouts.module.css';

export default function WorkoutsPage() {
  const [templates, setTemplates] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/workouts')
      .then((r) => {
        if (r.status === 401) throw new Error('signin');
        return r.json();
      })
      .then((data) => setTemplates(data.items))
      .catch((e) => setError(e.message === 'signin' ? 'signin' : 'error'));
  }, []);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>My Workouts</h1>
            <p className={styles.subtitle}>Build your own routine, or let TemprFit put one together from your equipment and time.</p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/workouts/generate" className={styles.secondaryBtn}>
              <Sparkles size={16} /> Generate
            </Link>
            <Link href="/workouts/new" className={styles.primaryBtn}>
              <Plus size={16} /> Build Workout
            </Link>
          </div>
        </div>

        {error === 'signin' && (
          <div className={styles.empty}>
            <p>Sign in to build and save workouts.</p>
            <Link href="/login" className={styles.primaryBtn}>Sign In</Link>
          </div>
        )}

        {error === 'error' && <div className={styles.empty}>Something went wrong loading your workouts.</div>}

        {templates && templates.length === 0 && (
          <div className={styles.empty}>
            <Dumbbell size={28} />
            <p>No workouts yet — build one manually or generate one from your goals.</p>
          </div>
        )}

        {templates && templates.length > 0 && (
          <div className={styles.grid}>
            {templates.map((t) => (
              <Link key={t._id} href={`/workouts/${t._id}`} className={styles.card}>
                <h3>{t.name}</h3>
                <p className={styles.cardMeta}>
                  {t.exercises.length} exercise{t.exercises.length === 1 ? '' : 's'}
                  {t.goal ? ` \u00b7 ${t.goal.replace('-', ' ')}` : ''}
                  {t.source === 'generated' ? ' \u00b7 generated' : ''}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
