'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Dumbbell, Heart, Clock, Repeat, Plus, Sparkles, ShieldAlert, AlertTriangle, Lightbulb, Send, Loader2 } from 'lucide-react';
import { prescribe, GOALS } from '@/lib/prescription';
import ExercisePreview from '@/components/ExercisePreview';
import AuthGateModal from '@/components/AuthGateModal';
import AIResponseRenderer from '@/components/AIResponseRenderer';
import styles from './detail.module.css';

export default function ExerciseDetailPage() {
  const { slug } = useParams();
  const [exercise, setExercise] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [goal, setGoal] = useState('hypertrophy');
  const [askOpen, setAskOpen] = useState(false);
  const [askQuestion, setAskQuestion] = useState('');
  const [askAnswer, setAskAnswer] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState('');
  const [authGateOpen, setAuthGateOpen] = useState(false);

  useEffect(() => {
    setExercise(null);
    setNotFound(false);
    fetch(`/api/exercises/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then((data) => setExercise(data.exercise))
      .catch(() => setNotFound(true));
  }, [slug]);

  const plan = useMemo(() => (exercise ? prescribe(exercise, { goal }) : null), [exercise, goal]);

  const toggleFavorite = async () => {
    setFavorited((f) => !f);
    try {
      const res = await fetch(`/api/exercises/${slug}/favorite`, { method: 'POST' });
      if (res.status === 401) {
        setFavorited((f) => !f);
        setAuthGateOpen(true);
      } 
    } catch {
      setFavorited((f) => !f);
    }
  };

  const askAboutMove = async () => {
    const question = askQuestion.trim() || `What should I focus on with ${exercise.name} form?`;
    setAskLoading(true);
    setAskError('');
    setAskAnswer('');
    try {
      const res = await fetch('/api/coach/ask-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseSlug: slug, question }),
      });
      if (res.status === 401) {
        setAuthGateOpen(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setAskError(data.error || 'Could not get an answer.');
        return;
      }
      setAskAnswer(data.answer);
    } catch {
      setAskError('Could not reach the AI coach. Check your connection.');
    } finally {
      setAskLoading(false);
    }
  };

  if (notFound) {
    return (
      <div className={styles.page}>
        <div className="container">
          <p className={styles.notFound}>
            We couldn&apos;t find that exercise. <Link href="/explore">Back to Explore</Link>
          </p>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className={styles.page}>
        <div className="container">
          <p className={styles.loading}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.layout}>
          <div className={styles.main}>
            <div className={styles.mediaHeroPlaceholder} style={{ background: 'transparent' }}>
              <ExercisePreview media={exercise.media} alt={exercise.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
            </div>

            <div className={styles.titleRow}>
              <h1 className={styles.title}>{exercise.name}</h1>
              <button
                className={`${styles.favoriteBtn} ${favorited ? styles.favorited : ''}`}
                onClick={toggleFavorite}
              >
                <Heart size={18} fill={favorited ? 'currentColor' : 'none'} />
                {favorited ? 'Favorited' : 'Favorite'}
              </button>
            </div>

            <div className={styles.badges}>
              <span className={styles.badge}>{exercise.targetMuscles?.primary}</span>
              {(exercise.targetMuscles?.secondary || []).map((m) => (
                <span key={m} className={styles.badgeMuted}>{m}</span>
              ))}
              <span className={styles.badge}>{exercise.difficulty}</span>
              <span className={styles.badgeMuted}>{exercise.category}</span>
              {(exercise.equipment || []).map((e) => (
                <span key={e} className={styles.badgeMuted}>{e}</span>
              ))}
            </div>

            {exercise.description && <p className={styles.description}>{exercise.description}</p>}

            {exercise.instructions?.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Instructions</h2>
                <ol className={styles.stepsList}>
                  {exercise.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </section>
            )}

            {exercise.formTips?.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}><Lightbulb size={16} /> Form tips</h2>
                <ul className={styles.plainList}>
                  {exercise.formTips.map((tip, i) => <li key={i}>{tip}</li>)}
                </ul>
              </section>
            )}

            {exercise.commonMistakes?.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}><AlertTriangle size={16} /> Common mistakes</h2>
                <ul className={styles.plainList}>
                  {exercise.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </section>
            )}

            {exercise.safetyNotes?.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}><ShieldAlert size={16} /> Safety notes</h2>
                <ul className={styles.plainList}>
                  {exercise.safetyNotes.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </section>
            )}

            {(exercise.variations?.length > 0 || exercise.alternatives?.length > 0) && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Variations &amp; alternatives</h2>
                <div className={styles.relatedRow}>
                  {(exercise.variations || []).map((v) => (
                    <span key={v} className={styles.relatedPill}>{v}</span>
                  ))}
                  {(exercise.alternatives || []).map((alt) => (
                    <Link key={alt.slug} href={`/explore/${alt.slug}`} className={styles.relatedPillLink}>
                      {alt.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.statBlock}>
              <label className={styles.goalLabel}>Prescribe for</label>
              <select
                className={styles.goalSelect}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              >
                {GOALS.map((g) => (
                  <option key={g} value={g}>{g.replace('-', ' ')}</option>
                ))}
              </select>

              <div className={styles.statRow}>
                <Repeat size={16} />
                <span>
                  {plan.sets} sets &times; {plan.reps || `${plan.durationSeconds}s`}
                </span>
              </div>
              <div className={styles.statRow}>
                <Clock size={16} />
                <span>{plan.restSeconds}s rest</span>
              </div>
              <p className={styles.prescriptionNote}>
                Computed for this goal — not stored on the exercise. The AI coach (Phase 5) will refine this further per person.
              </p>
            </div>

            <Link href={`/workouts/new?exercise=${exercise.slug}`} className={styles.primaryAction}>
              <Plus size={16} /> Add to Workout
            </Link>
            <button className={styles.secondaryAction} onClick={() => setAskOpen((v) => !v)}>
              <Sparkles size={16} /> Ask AI about this move
            </button>

            {askOpen && (
              <div className={styles.askPanel}>
                <textarea
                  className={styles.askInput}
                  placeholder={`e.g. "Is this safe with a bad lower back?" or leave blank for general form tips`}
                  value={askQuestion}
                  onChange={(e) => setAskQuestion(e.target.value)}
                  rows={2}
                />
                <button className={styles.askSendBtn} onClick={askAboutMove} disabled={askLoading}>
                  {askLoading ? <Loader2 size={14} className={styles.spin} /> : <Send size={14} />}
                  {askLoading ? 'Asking…' : 'Ask'}
                </button>
                {askError && <p className={styles.askError}>{askError}</p>}
                {askAnswer && (
                  <div className={styles.askAnswer}>
                    <AIResponseRenderer content={askAnswer} />
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>

      <AuthGateModal
        open={authGateOpen}
        onClose={() => setAuthGateOpen(false)}
        message="Sign in to favorite exercises and ask the AI coach about specific moves."
      />
    </div>
  );
}
