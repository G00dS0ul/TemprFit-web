'use client';

import { useEffect, useState } from 'react';
import { ScanFace } from 'lucide-react';
import FormCheckUpload from '@/components/FormCheckUpload';
import styles from './form-check.module.css';

export default function FormCheckPage() {
  const [signedIn, setSignedIn] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch('/api/form-check')
      .then((r) => {
        if (r.status === 401) throw new Error('signin');
        return r.json();
      })
      .then((d) => setHistory(d.sessions || []))
      .catch((e) => {
        if (e.message === 'signin') setSignedIn(false);
      });
  }, []);

  if (!signedIn) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <ScanFace size={36} />
          <h1>Form Check</h1>
          <p>Sign in to check your form against a video.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <ScanFace size={24} />
        <div>
          <h1>Form Check</h1>
          <p className={styles.subtitle}>
            Upload a video of a rep and get automated feedback on squat, push-up, plank, lunge, or deadlift form.
            Analysis runs in your browser — nothing is uploaded.
          </p>
        </div>
      </div>

      <FormCheckUpload onSaved={(session) => setHistory((prev) => [session, ...prev])} />

      {history.length > 0 && (
        <div className={styles.historySection}>
          <h2>Recent checks</h2>
          <ul className={styles.historyList}>
            {history.map((s) => (
              <li key={s._id} className={styles.historyItem}>
                <div className={styles.historyTop}>
                  <span className={styles.historyExercise}>{s.exerciseSlug}</span>
                  <span className={styles.historyDate}>{new Date(s.createdAt).toLocaleDateString()}</span>
                </div>
                <p className={styles.historySummary}>{s.aiSummary}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
