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
  const [programs, setPrograms] = useState([]);
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
      category: specialty !== 'All' ? specialty : '',
    });
    
    if (search) query.append('q', search);

    const timeout = setTimeout(() => {
      fetch(`/api/programs?${query.toString()}`)
        .then(r => r.json())
        .then(data => {
          setPrograms(data.programs || []);
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
        ) : programs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
            <p>No programs found matching your search.</p>
          </div>
        ) : (
          <div className={styles.trainerGrid}>
            {programs.map(program => {
              const trainer = program.trainer;
              const isFeatured = trainer?.trainerInfo?.isFeatured;
              const isVerified = trainer?.trainerInfo?.isVerified;
              const rating = trainer?.trainerInfo?.rating || 0;
              const reviewsCount = trainer?.trainerInfo?.reviews?.length || 0;
              const tagline = trainer?.trainerInfo?.tagline || 'Certified Fitness Professional';
              const specialties = trainer?.trainerInfo?.specialties || [];
              const responseTime = trainer?.trainerInfo?.responseTime || 'Usually replies in 2 hrs';
              const activeClients = trainer?.trainerInfo?.activeClients || 0;
              const price = program.price;
              const location = program.trainingMode;

              return (
                <div key={program._id} className={styles.trainerCard}>
                  {isFeatured && <div className={styles.featuredBadge}><Zap size={12} /> Featured</div>}
                  
                  <div className={styles.cardHeader}>
                    <img 
                      src={trainer?.avatarUrl || `https://ui-avatars.com/api/?name=${trainer?.username}&background=22c55e&color=fff`} 
                      alt={trainer?.username} 
                      className={styles.avatar} 
                    />
                    <div className={styles.headerInfo}>
                      <div className={styles.nameRow}>
                        <h3>{trainer?.username}</h3>
                        {isVerified && <span className={styles.verifiedIcon} title="Verified Identity & Certs">✓</span>}
                      </div>
                      <p className={styles.tagline}>{tagline}</p>
                      
                      <div className={styles.statsRow}>
                        <span className={styles.rating}>★ {rating.toFixed(1)} <span className={styles.reviewCount}>({reviewsCount} reviews)</span></span>
                        <span className={styles.clientCount}>• {activeClients} active clients</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <h4 className={styles.programTitle}>{program.title}</h4>
                    <p className={styles.responseTime}>💬 {responseTime}</p>
                    
                    <div className={styles.tagsContainer}>
                      {specialties.slice(0, 3).map((spec, idx) => (
                        <span key={idx} className={styles.specialtyPill}>{spec}</span>
                      ))}
                      {specialties.length > 3 && <span className={styles.specialtyPill}>+{specialties.length - 3}</span>}
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.priceBox}>
                      <span className={styles.priceLabel}>Starting from</span>
                      <div className={styles.priceAmount}>
                        <span className={styles.amount}>${price}</span>
                        <span className={styles.per}>total</span>
                      </div>
                    </div>
                    <div className={styles.actionButtons}>
                      <Link href={`/trainers/programs/${program._id}`} className={styles.viewProfileBtn}>
                        View Profile
                      </Link>
                    </div>
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
