'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Check, SkipForward, Repeat2,
  Trophy, Flame, Clock, Search, X,
} from 'lucide-react';
import styles from './session.module.css';

export default function WorkoutSessionPage() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [restSeconds, setRestSeconds] = useState(null);
  const [summary, setSummary] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [replaceQuery, setReplaceQuery] = useState('');
  const [replaceResults, setReplaceResults] = useState([]);
  const saveTimer = useRef(null);

  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.session) setSession(data.session);
        else setError(data.error || 'Session not found.');
      })
      .catch(() => setError('Something went wrong.'));
  }, [id]);

  useEffect(() => {
    if (restSeconds === null) return;
    if (restSeconds <= 0) {
      setRestSeconds(null);
      return;
    }
    const t = setTimeout(() => setRestSeconds((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [restSeconds]);

  const autosave = (nextExercises) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercises: nextExercises }),
      }).catch(() => {});
    }, 500);
  };

  const updateSet = (exIdx, setIdx, field, value) => {
    setSession((prev) => {
      const exercises = [...prev.exercises];
      const sets = [...exercises[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      exercises[exIdx] = { ...exercises[exIdx], sets };
      autosave(exercises);
      return { ...prev, exercises };
    });
  };

  const completeSet = (exIdx, setIdx) => {
    const set = session.exercises[exIdx].sets[setIdx];
    updateSet(exIdx, setIdx, 'completed', !set.completed);
    if (!set.completed) {
      const rest = session.exercises[exIdx].sets[setIdx].restSeconds || 60;
      setRestSeconds(rest > 0 ? rest : null);
    }
  };

  const skipExercise = () => {
    setSession((prev) => {
      const exercises = [...prev.exercises];
      exercises[currentIndex] = { ...exercises[currentIndex], skipped: true };
      autosave(exercises);
      return { ...prev, exercises };
    });
    goNext();
  };

  const goNext = () => setCurrentIndex((i) => Math.min(i + 1, session.exercises.length - 1));
  const goPrev = () => setCurrentIndex((i) => Math.max(i - 1, 0));

  useEffect(() => {
    if (!replaceQuery.trim()) { setReplaceResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/exercises?q=${encodeURIComponent(replaceQuery)}`)
        .then((r) => r.json())
        .then((d) => setReplaceResults(d.items || []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [replaceQuery]);

  const doReplace = (newExercise) => {
    setSession((prev) => {
      const exercises = [...prev.exercises];
      exercises[currentIndex] = { ...exercises[currentIndex], exercise: newExercise, replaced: true };
      autosave(exercises);
      return { ...prev, exercises };
    });
    setReplacing(false);
    setReplaceQuery('');
    setReplaceResults([]);
  };

  const finish = async () => {
    setFinishing(true);
    try {
      const res = await fetch(`/api/sessions/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercises: session.exercises }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSummary(data);
    } catch {
      setError('Could not finish the workout.');
      setFinishing(false);
    }
  };

  if (error) return <div className={styles.page}><div className="container"><p className={styles.error}>{error}</p></div></div>;
  if (!session) return <div className={styles.page}><div className="container"><p className={styles.loading}>Loading...</p></div></div>;

  if (summary) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.summaryCard}>
            <Trophy size={40} className={styles.summaryIcon} />
            <h1>Workout Complete</h1>
            <div className={styles.summaryStats}>
              <div><Clock size={16} /> {Math.round(summary.session.durationSeconds / 60)} min</div>
              <div><Flame size={16} /> {summary.session.totalVolume} kg total volume</div>
              {summary.session.prCount > 0 && (
                <div className={styles.prStat}><Trophy size={16} /> {summary.session.prCount} new PR{summary.session.prCount > 1 ? 's' : ''}!</div>
              )}
            </div>
            <p className={styles.streakNote}>Current streak: {summary.streak.current} day{summary.streak.current === 1 ? '' : 's'}</p>
            <div className={styles.summaryActions}>
              <Link href="/history" className={styles.secondaryBtn}>View History</Link>
              <Link href="/workouts" className={styles.primaryBtn}>Back to Workouts</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const current = session.exercises[currentIndex];

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.progressBar}>
          Exercise {currentIndex + 1} of {session.exercises.length}
        </div>

        <div className={styles.exerciseCard}>
          <div className={styles.exerciseHeader}>
            <h2>{current.exercise?.name || 'Exercise'}</h2>
            <div className={styles.headerActions}>
              <button onClick={() => setReplacing(!replacing)} title="Replace exercise"><Repeat2 size={16} /></button>
              <button onClick={skipExercise} title="Skip exercise"><SkipForward size={16} /></button>
            </div>
          </div>

          {replacing && (
            <div className={styles.replaceBox}>
              <div className={styles.replaceSearchRow}>
                <Search size={14} />
                <input
                  autoFocus
                  placeholder="Search a replacement..."
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                />
                <button onClick={() => setReplacing(false)}><X size={14} /></button>
              </div>
              {replaceResults.map((ex) => (
                <button key={ex.slug} className={styles.replaceResult} onClick={() => doReplace(ex)}>
                  {ex.name}
                </button>
              ))}
            </div>
          )}

          {restSeconds !== null && (
            <div className={styles.restBanner}>
              Resting: {restSeconds}s
              <button onClick={() => setRestSeconds(null)}>Skip rest</button>
            </div>
          )}

          <div className={styles.setsTable}>
            <div className={styles.setsHeader}>
              <span>Set</span><span>Target</span><span>Reps</span><span>Weight</span><span>Done</span>
            </div>
            {current.sets.map((set, setIdx) => (
              <div key={setIdx} className={`${styles.setRow} ${set.completed ? styles.setDone : ''}`}>
                <span className={styles.setNum}>{setIdx + 1}{set.isPR && <Trophy size={12} className={styles.prIcon} />}</span>
                <span className={styles.targetReps}>{set.targetReps || '-'}</span>
                <input
                  type="number"
                  value={set.reps ?? ''}
                  onChange={(e) => updateSet(currentIndex, setIdx, 'reps', Number(e.target.value))}
                  placeholder="reps"
                />
                <input
                  type="number"
                  value={set.weight ?? ''}
                  onChange={(e) => updateSet(currentIndex, setIdx, 'weight', Number(e.target.value))}
                  placeholder="kg"
                />
                <button
                  className={styles.checkBtn}
                  onClick={() => completeSet(currentIndex, setIdx)}
                >
                  <Check size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.navRow}>
          <button className={styles.navBtn} onClick={goPrev} disabled={currentIndex === 0}>
            <ChevronLeft size={16} /> Previous
          </button>
          {currentIndex < session.exercises.length - 1 ? (
            <button className={styles.navBtn} onClick={goNext}>
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button className={styles.finishBtn} onClick={finish} disabled={finishing}>
              {finishing ? 'Finishing...' : 'Finish Workout'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
