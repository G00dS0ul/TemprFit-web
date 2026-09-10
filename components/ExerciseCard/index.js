'use client';

import Link from 'next/link';
import { Heart, Dumbbell } from 'lucide-react';
import styles from './ExerciseCard.module.css';

export default function ExerciseCard({ exercise, favorited, onToggleFavorite }) {
  const image = exercise.media?.[0]?.url;

  return (
    <div className={styles.card}>
      <Link href={`/explore/${exercise.slug}`} className={styles.mediaLink}>
        <div className={styles.media}>
          {image ? (
            // Real photos from the public-domain Free Exercise DB (or
            // hand-authored entries with no photo yet) — plain <img> since
            // these are remote, unoptimized demo assets, not next/image
            // candidates.
            <img src={image} alt={exercise.name} loading="lazy" className={styles.mediaImg} />
          ) : (
            <Dumbbell size={28} />
          )}
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
