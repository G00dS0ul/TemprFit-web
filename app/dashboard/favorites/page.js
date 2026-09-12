'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Dumbbell, Heart } from 'lucide-react';
import ExerciseCard from '@/components/ExerciseCard';
import styles from './page.module.css';

export default function FavoritesPage() {
  const [activeTab, setActiveTab] = useState('exercises');
  const [exercises, setExercises] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/user/favorites').then(r => r.json()),
      fetch('/api/workouts').then(r => r.json())
    ]).then(([favData, workoutData]) => {
      setExercises(favData.favorites || []);
      if (workoutData.items) {
        setWorkouts(workoutData.items.filter(w => w.isFavorite));
      }
    }).catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleExerciseFavorite = async (slug, id) => {
    setExercises(prev => prev.filter(f => f._id !== id));
    try {
      await fetch('/api/user/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId: id, action: 'remove' }),
      });
    } catch (e) {
      console.error(e);
      fetch('/api/user/favorites').then(r => r.json()).then(d => setExercises(d.favorites || []));
    }
  };

  const handleToggleWorkoutFavorite = async (e, id) => {
    e.preventDefault();
    setWorkouts(prev => prev.filter(w => w._id !== id));
    try {
      await fetch(`/api/workouts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: false })
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/dashboard" className={styles.backBtn}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1>Favorites</h1>
        <p>Your personal collection of saved exercises and workouts.</p>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'exercises' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('exercises')}
        >
          Exercises ({exercises.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'workouts' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('workouts')}
        >
          Workouts ({workouts.length})
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <Loader2 size={32} className={styles.spin} />
          <p>Loading favorites...</p>
        </div>
      ) : activeTab === 'exercises' ? (
        exercises.length === 0 ? (
          <div className={styles.empty}>
            <Dumbbell size={48} className={styles.emptyIcon} />
            <h2>No favorite exercises yet</h2>
            <p>Explore the exercise database and save the ones you like.</p>
            <Link href="/explore" className={styles.exploreBtn}>Explore Exercises</Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {exercises.map((exercise) => (
              <ExerciseCard
                key={exercise._id}
                exercise={exercise}
                favorited={true}
                onToggleFavorite={() => handleToggleExerciseFavorite(exercise.slug, exercise._id)}
              />
            ))}
          </div>
        )
      ) : (
        workouts.length === 0 ? (
          <div className={styles.empty}>
            <Dumbbell size={48} className={styles.emptyIcon} />
            <h2>No favorite workouts yet</h2>
            <p>Go to your workouts and click the heart icon to save them here.</p>
            <Link href="/workouts" className={styles.exploreBtn}>My Workouts</Link>
          </div>
        ) : (
          <div className={styles.workoutGrid}>
            {workouts.map((t) => (
              <Link key={t._id} href={`/workouts/${t._id}`} className={styles.workoutCard}>
                <div className={styles.cardHeader}>
                  <h3>{t.name}</h3>
                  <button onClick={(e) => handleToggleWorkoutFavorite(e, t._id)} className={styles.favBtn}>
                    <Heart size={20} fill="var(--color-primary)" color="var(--color-primary)" />
                  </button>
                </div>
                <p className={styles.cardMeta}>
                  {t.exercises.length} exercise{t.exercises.length === 1 ? '' : 's'}
                  {t.goal ? ` \u00b7 ${t.goal.replace('-', ' ')}` : ''}
                </p>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
