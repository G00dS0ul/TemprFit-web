'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Dumbbell } from 'lucide-react';
import ExerciseCard from '@/components/ExerciseCard';
import styles from './page.module.css';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/favorites')
      .then((r) => r.json())
      .then((data) => setFavorites(data.favorites || []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleFavorite = async (slug, id) => {
    // Optimistic remove
    setFavorites(prev => prev.filter(f => f._id !== id));
    
    try {
      await fetch('/api/user/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId: id, action: 'remove' }),
      });
    } catch (e) {
      console.error(e);
      // Re-fetch to sync state if error occurs
      fetch('/api/user/favorites').then(r => r.json()).then(d => setFavorites(d.favorites || []));
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/dashboard" className={styles.backBtn}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1>Favorite Exercises</h1>
        <p>Your personal collection of saved exercises.</p>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <Loader2 size={32} className={styles.spin} />
          <p>Loading favorites...</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className={styles.empty}>
          <Dumbbell size={48} className={styles.emptyIcon} />
          <h2>No favorites yet</h2>
          <p>Explore the exercise database and save the ones you like.</p>
          <Link href="/explore" className={styles.exploreBtn}>Explore Exercises</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {favorites.map((exercise) => (
            <ExerciseCard
              key={exercise._id}
              exercise={exercise}
              favorited={true}
              onToggleFavorite={() => handleToggleFavorite(exercise.slug, exercise._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
