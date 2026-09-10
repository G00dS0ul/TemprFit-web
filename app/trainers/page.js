'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, Loader2, Zap } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

export default function Trainers() {
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('All');
  const [priceRange, setPriceRange] = useState('Any');
  const [filterOpen, setFilterOpen] = useState(false);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let minPrice = 0;
    let maxPrice = 99999;
    
    if (priceRange === '$0-50') maxPrice = 50;
    if (priceRange === '$50-75') { minPrice = 50; maxPrice = 75; }
    if (priceRange === '$75-100') { minPrice = 75; maxPrice = 100; }
    if (priceRange === '$100+') minPrice = 100;

    const query = new URLSearchParams({
      q: search,
      specialty: specialty !== 'All' ? specialty : '',
      minPrice,
      maxPrice
    });

    // Debounce search slightly
    const timeout = setTimeout(() => {
      fetch(`/api/trainers?${query.toString()}`)
        .then(r => r.json())
        .then(data => {
          setTrainers(data.trainers || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, specialty, priceRange]);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1>Find Your <span className={styles.gradient}>Perfect Trainer</span></h1>
          <p>Browse certified trainers and book with secure escrow payments.</p>
        </div>

        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by name, specialty, or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className={styles.filterBtn} onClick={() => setFilterOpen(!filterOpen)}>
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>

        {filterOpen && (
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <label>Specialty</label>
              <div className={styles.filterTags}>
                {['All', 'Strength', 'HIIT', 'Bodybuilding', 'Yoga', 'Cardio'].map(tag => (
                  <button 
                    key={tag} 
                    className={`${styles.filterTag} ${specialty === tag ? styles.activeTag : ''}`}
                    onClick={() => setSpecialty(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.filterGroup}>
              <label>Price Range</label>
              <div className={styles.filterTags}>
                {['Any', '$0-50', '$50-75', '$75-100', '$100+'].map(tag => (
                  <button 
                    key={tag} 
                    className={`${styles.filterTag} ${priceRange === tag ? styles.activeTag : ''}`}
                    onClick={() => setPriceRange(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#22c55e' }}>
            <Loader2 size={40} className="spin" />
          </div>
        ) : trainers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
            <p>No trainers found matching your search.</p>
          </div>
        ) : (
          <div className={styles.trainerGrid}>
            {trainers.map(trainer => {
              const isFeatured = trainer.trainerInfo?.isFeatured;
              const price = trainer.trainerInfo?.price || 50;
              const location = trainer.trainerInfo?.location || 'Remote';
              const specs = trainer.trainerInfo?.specialties?.slice(0,2).join(', ') || 'General Fitness';

              return (
                <div key={trainer._id} className={styles.trainerCard}>
                  {isFeatured && <div className={styles.featuredBadge}><Zap size={12} /> Featured</div>}
                  <div className={styles.cardTop}>
                    <img src={trainer.avatarUrl || `https://ui-avatars.com/api/?name=${trainer.username}&background=22c55e&color=fff`} alt={trainer.username} className={styles.avatar} />
                    <div className={styles.info}>
                      <h3>{trainer.username}</h3>
                      <p className={styles.specialty}>{specs}</p>
                      <p className={styles.location}>{location}</p>
                    </div>
                  </div>
                  <div className={styles.cardBottom}>
                    <div className={styles.price}>
                      <span className={styles.amount}>${price}</span>
                      <span className={styles.per}>/session</span>
                    </div>
                    <Link href={`/trainers/${trainer._id}`} className={styles.viewProfileBtn}>
                      View Profile
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
