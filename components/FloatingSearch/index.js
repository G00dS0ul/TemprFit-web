'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, X, Dumbbell, Loader2 } from 'lucide-react';
import styles from './FloatingSearch.module.css';

export default function FloatingSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [role, setRole] = useState('user');

  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user) setRole(data.user.role);
      })
      .catch(() => {});
  }, []);

  if (role === 'trainer' || pathname.startsWith('/admin')) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/exercises?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      <button className={styles.fab} onClick={() => setOpen(true)} aria-label="Quick Exercise Search">
        <Dumbbell size={24} />
      </button>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setOpen(false)}>
              <X size={20} />
            </button>
            <h3 className={styles.title}>Quick Exercise Search</h3>
            
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <Search size={18} className={styles.searchIcon} />
              <input 
                type="text" 
                autoFocus 
                placeholder="E.g., bench press, squats..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={styles.searchInput}
              />
              <button type="submit" disabled={searching} className={styles.submitBtn}>
                {searching ? <Loader2 size={16} className={styles.spin} /> : 'Search'}
              </button>
            </form>

            <div className={styles.resultsContainer}>
              {results.length === 0 && !searching && query && (
                <p className={styles.empty}>No exercises found.</p>
              )}
              {results.map((ex) => (
                <div key={ex._id} className={styles.exerciseCard}>
                  {ex.media && ex.media.length > 0 && (
                    <div className={styles.imageWrap}>
                      <img src={ex.media[0].url} alt={ex.name} className={styles.image} />
                    </div>
                  )}
                  <div className={styles.info}>
                    <h4>{ex.name}</h4>
                    <p>{ex.targetMuscles?.primary}</p>
                    <p className={styles.aiSummary}>
                      <span className={styles.aiBadge}>AI</span> 
                      Great for building {ex.targetMuscles?.primary || 'strength'}. 
                      Keep your core tight and maintain proper form throughout the movement.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
