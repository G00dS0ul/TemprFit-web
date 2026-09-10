'use client';

import { useState } from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import TrainerCard from '@/components/TrainerCard';
import EscrowWidget from '@/components/EscrowWidget';
import { trainers } from '@/lib/data';
import styles from './page.module.css';

export default function Trainers() {
  const [search, setSearch] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [showEscrow, setShowEscrow] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = trainers.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.specialty.toLowerCase().includes(search.toLowerCase()) ||
    t.location.toLowerCase().includes(search.toLowerCase())
  );

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
                  <button key={tag} className={styles.filterTag}>{tag}</button>
                ))}
              </div>
            </div>
            <div className={styles.filterGroup}>
              <label>Price Range</label>
              <div className={styles.filterTags}>
                {['Any', '$0-50', '$50-75', '$75-100', '$100+'].map(tag => (
                  <button key={tag} className={styles.filterTag}>{tag}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className={styles.trainerGrid}>
          {filtered.map(trainer => (
            <div key={trainer.id} className={styles.trainerWrapper}>
              <TrainerCard trainer={trainer} />
              <button 
                className={styles.escrowBtn}
                onClick={() => { setSelectedTrainer(trainer); setShowEscrow(true); }}
              >
                Book with Escrow
              </button>
            </div>
          ))}
        </div>

        {showEscrow && (
          <div className={styles.escrowOverlay} onClick={() => setShowEscrow(false)}>
            <div className={styles.escrowModal} onClick={e => e.stopPropagation()}>
              <EscrowWidget trainer={selectedTrainer} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
