'use client';

import Link from 'next/link';
import { Heart, Dumbbell } from 'lucide-react';
import ExercisePreview from '@/components/ExercisePreview';
import styles from './ExerciseCard.module.css';

export default function ExerciseCard({ exercise, favorited, onToggleFavorite }) {
  return (
    <div className={styles.card}>
      <Link href={`/explore/${exercise.slug}`} className={styles.mediaLink}>
        <div className={styles.media}>
          <ExercisePreview media={exercise.media} alt={exercise.name} className={styles.mediaImg} />
        </div>
      </Link>

      <button
        className={`${styles.favoriteBtn} ${favorited ? styles.favorited : ''}`}
        onClick={() => onToggleFavorite?.(exercise.slug)}
        aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart size={16} fill={favorited ? 'currentColor' : 'none'} />
      </button>

      <div className={styles.body}>
        <Link href={`/explore/${exercise.slug}`} className={styles.name}>
          {exercise.name}
        </Link>
        <div className={styles.badges}>
          <span className={styles.badge}>{exercise.targetMuscles?.primary}</span>
          <span className={`${styles.badge} ${styles[`difficulty-${exercise.difficulty}`]}`}>
            {exercise.difficulty}
          </span>
        </div>
        <div className={styles.meta}>
          {(exercise.equipment || []).slice(0, 2).join(', ') || 'Bodyweight'}
        </div>
      </div>
    </div>
  );
}
