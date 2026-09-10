'use client';

import { Search, X } from 'lucide-react';
import styles from './ExploreFilters.module.css';

const MUSCLES = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'abdominals', 'glutes', 'quads', 'hamstrings', 'calves', 'full body'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const ENVIRONMENTS = ['home', 'gym', 'outdoor', 'studio'];
const CATEGORIES = ['calisthenics', 'bodybuilding', 'powerlifting', 'stretching', 'cardio', 'olympic weightlifting', 'plyometrics', 'strongman'];
const EQUIPMENT = ['bodyweight', 'barbell', 'dumbbell', 'kettlebell', 'cable machine', 'machine', 'resistance band', 'bench', 'pull-up bar', 'squat rack', 'jump rope', 'yoga mat'];

// Rounds down to a clean "X+" so the count doesn't look like an odd, oddly-specific
// number (897) when filters are cleared — but shows the exact number once a filter
// narrows it down to something small enough that "+" would be misleading/unhelpful.
function formatExerciseCount(count) {
  if (count < 50) return `${count} exercise${count === 1 ? '' : 's'}`;
  const rounded = Math.floor(count / 100) * 100;
  return `${rounded.toLocaleString()}+ exercises`;
}

export default function ExploreFilters({ filters, onChange, onClear, resultCount }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });
  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className={styles.wrap}>
      <div className={styles.searchRow}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search exercises..."
          value={filters.q || ''}
          onChange={set('q')}
          className={styles.searchInput}
        />
        {hasActiveFilters && (
          <button className={styles.clearBtn} onClick={onClear}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      <div className={styles.selects}>
        <select value={filters.muscle || ''} onChange={set('muscle')} className={styles.select}>
          <option value="">Muscle group</option>
          {MUSCLES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <select value={filters.equipment || ''} onChange={set('equipment')} className={styles.select}>
          <option value="">Equipment</option>
          {EQUIPMENT.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>

        <select value={filters.difficulty || ''} onChange={set('difficulty')} className={styles.select}>
          <option value="">Difficulty</option>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <select value={filters.environment || ''} onChange={set('environment')} className={styles.select}>
          <option value="">Environment</option>
          {ENVIRONMENTS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>

        <select value={filters.category || ''} onChange={set('category')} className={styles.select}>
          <option value="">Training style</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {typeof resultCount === 'number' && (
        <div className={styles.resultCount}>{formatExerciseCount(resultCount)}</div>
      )}
    </div>
  );
}
