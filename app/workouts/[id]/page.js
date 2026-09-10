'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Play, Clock } from 'lucide-react';
import styles from './template.module.css';

export default function WorkoutTemplatePage() {
  const { id } = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetch(`/api/workouts/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.template) setTemplate(data.template);
        else setError(data.error || 'Not found.');
      })
      .catch(() => setError('Something went wrong.'));
  }, [id]);

  const start = async () => {
    setStarting(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/sessions/${data.session._id}`);
    } catch {
      setError('Could not start this workout.');
      setStarting(false);
    }
  };

  if (error) return <div className={styles.page}><div className="container"><p className={styles.error}>{error}</p></div></div>;
  if (!template) return <div className={styles.page}><div className="container"><p className={styles.loading}>Loading...</p></div></div>;

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{template.name}</h1>
            <p className={styles.meta}>
              {template.exercises.length} exercises
              {template.goal ? ` \u00b7 ${template.goal.replace('-', ' ')}` : ''}
            </p>
          </div>
          <button className={styles.startBtn} onClick={start} disabled={starting}>
            <Play size={16} /> {starting ? 'Starting...' : 'Start Workout'}
          </button>
        </div>

        <div className={styles.list}>
          {template.exercises.map((item, i) => (
            <div key={i} className={styles.exerciseRow}>
              <Link href={`/explore/${item.exercise?.slug}`} className={styles.exerciseName}>
                {item.exercise?.name || 'Unknown exercise'}
              </Link>
              <div className={styles.setsSummary}>
                {item.sets.length} sets &times; {item.sets[0]?.targetReps || '-'}
                <span className={styles.restNote}><Clock size={12} /> {item.sets[0]?.restSeconds || 60}s rest</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
