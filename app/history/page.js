'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Flame, Trophy } from 'lucide-react';
import styles from './history.module.css';

export default function HistoryPage() {
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/sessions?status=completed')
      .then((r) => {
        if (r.status === 401) throw new Error('signin');
        return r.json();
      })
      .then((data) => setSessions(data.items))
      .catch((e) => setError(e.message === 'signin' ? 'signin' : 'error'));
  }, []);

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Workout History</h1>

        {error === 'signin' && (
          <div className={styles.empty}>
            <p>Sign in to see your workout history.</p>
            <Link href="/login" className={styles.primaryBtn}>Sign In</Link>
          </div>
        )}

        {error === 'error' && <div className={styles.empty}>Something went wrong.</div>}

        {sessions && sessions.length === 0 && (
          <div className={styles.empty}>
            <Calendar size={26} />
            <p>No completed workouts yet.</p>
            <Link href="/workouts" className={styles.primaryBtn}>Start a workout</Link>
          </div>
        )}

        {sessions && sessions.length > 0 && (
          <div className={styles.list}>
            {sessions.map((s) => (
              <div key={s._id} className={styles.row}>
                <div>
                  <h3>{s.name}</h3>
                  <span className={styles.date}>{new Date(s.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className={styles.stats}>
                  <span><Clock size={14} /> {Math.round((s.durationSeconds || 0) / 60)} min</span>
                  <span><Flame size={14} /> {s.totalVolume || 0} kg</span>
                  {s.prCount > 0 && <span className={styles.pr}><Trophy size={14} /> {s.prCount} PR{s.prCount > 1 ? 's' : ''}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
