'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ExerciseCard from '@/components/ExerciseCard';
import ExploreFilters from '@/components/ExploreFilters';
import styles from './explore.module.css';

function buildQuery(filters, page) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.muscle) params.set('muscle', filters.muscle);
  if (filters.equipment) params.set('equipment', filters.equipment);
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  if (filters.environment) params.set('environment', filters.environment);
  if (filters.category) params.set('category', filters.category);
  params.set('page', String(page));
  return params.toString();
}

export default function ExplorePage() {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());
  const debounceRef = useRef(null);

  const fetchExercises = useCallback(async (nextFilters, nextPage) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/exercises?${buildQuery(nextFilters, nextPage)}`);
      const data = await res.json();
      if (nextPage === 1) setItems(data.items);
      else setItems((prev) => [...prev, ...data.items]);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchExercises(filters, 1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    fetch('/api/exercises/favorites')
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => setFavorites(new Set((data.items || []).map((e) => e.slug))))
      .catch(() => {});
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchExercises(filters, nextPage);
  };

  const toggleFavorite = async (slug) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
    try {
      const res = await fetch(`/api/exercises/${slug}/favorite`, { method: 'POST' });
      if (res.status === 401) {
        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(slug);
          return next;
        });
      }
    } catch {
      // best-effort; UI already optimistically toggled
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Explore Exercises</h1>
          <p className={styles.subtitle}>
            A normalized catalogue you can search and filter by muscle, equipment, difficulty, and discipline.
          </p>
        </div>

        <ExploreFilters
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters({})}
          resultCount={total}
        />

        {loading && items.length === 0 ? (
          <div className={styles.empty}>Loading exercises...</div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>No exercises match those filters.</div>
        ) : (
          <>
            <div className={styles.grid}>
              {items.map((exercise) => (
                <ExerciseCard
                  key={exercise.slug}
                  exercise={exercise}
                  favorited={favorites.has(exercise.slug)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>

            {page < totalPages && (
              <div className={styles.loadMoreWrap}>
                <button className={styles.loadMoreBtn} onClick={loadMore} disabled={loading}>
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
