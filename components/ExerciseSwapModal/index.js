'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ExerciseSwapModal.module.css';

export default function ExerciseSwapModal({ isOpen, onClose, currentExerciseName, onSwap }) {
  const [loading, setLoading] = useState(false);
  const [alternatives, setAlternatives] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && currentExerciseName) {
      setLoading(true);
      setError('');
      setAlternatives([]);
      
      fetch('/api/exercises/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          exerciseName: currentExerciseName,
          // Could pull equipment from global user context here if available
          currentEquipment: 'Dumbbells, Bodyweight' 
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.alternatives) {
          setAlternatives(data.alternatives);
        } else {
          setError(data.error || 'Failed to find alternatives.');
        }
      })
      .catch(() => setError('Network error occurred.'))
      .finally(() => setLoading(false));
    }
  }, [isOpen, currentExerciseName]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className={styles.overlay}>
        <div className={styles.backdrop} onClick={onClose} />
        <motion.div 
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <div className={styles.header}>
            <h3>Swap: {currentExerciseName}</h3>
            <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
          </div>
          
          <div className={styles.content}>
            {loading ? (
              <div className={styles.loadingState}>
                <Loader2 className="spin" size={32} />
                <p>AI is analyzing alternatives...</p>
              </div>
            ) : error ? (
              <p className={styles.error}>{error}</p>
            ) : (
              <div className={styles.altList}>
                {alternatives.map((alt, idx) => (
                  <div key={idx} className={styles.altCard}>
                    <div>
                      <h4>{alt.name}</h4>
                      <p>{alt.reason}</p>
                    </div>
                    {alt.slug ? (
                      <button 
                        className={styles.swapBtn} 
                        onClick={() => onSwap(alt)}
                      >
                        Swap <ArrowRight size={16} />
                      </button>
                    ) : (
                      <span className={styles.missingBadge}>Not in library</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
