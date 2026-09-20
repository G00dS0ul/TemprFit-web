'use client';

import { useEffect, useState } from 'react';
import { X, SkipForward, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './RestTimer.module.css';

export default function RestTimer({ initialSeconds = 60, onComplete, onSkip, onWarning }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isActive || seconds <= 0) {
      if (seconds === 0 && isActive) {
        // Vibrate if supported
        if (typeof window !== 'undefined' && 'navigator' in window && window.navigator.vibrate) {
          window.navigator.vibrate([200, 100, 200]);
        }
        
        // Play beep (optional fallback)
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          osc.connect(ctx.destination);
          osc.frequency.value = 800;
          osc.start();
          setTimeout(() => osc.stop(), 300);
        } catch (e) {
          // AudioContext not supported or blocked
        }
        
        onComplete();
      }
      return;
    }

    const timer = setInterval(() => {
      setSeconds(s => {
        if (s - 1 === 5 && onWarning) {
          onWarning();
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, seconds, onComplete, onWarning]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = 100 - ((seconds / initialSeconds) * 100);

  return (
    <AnimatePresence>
      <motion.div 
        className={styles.restOverlay}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className={styles.restHeader}>
          <h3>Rest Period</h3>
          <button onClick={() => { setIsActive(false); onSkip(); }} className={styles.iconBtn}>
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.circleWrap}>
          <svg viewBox="0 0 100 100" className={styles.progressCircle}>
            <circle cx="50" cy="50" r="45" className={styles.bgCircle} />
            <circle 
              cx="50" cy="50" r="45" 
              className={styles.fgCircle} 
              strokeDasharray="283" 
              strokeDashoffset={283 - (283 * progress) / 100}
            />
          </svg>
          <div className={styles.timeDisplay}>
            {formatTime(seconds)}
          </div>
        </div>

        <div className={styles.controls}>
          <button onClick={() => setSeconds(s => s + 30)} className={styles.adjustBtn}>+30s</button>
          <button onClick={() => { setIsActive(false); onSkip(); }} className={styles.skipBtn}>
            <SkipForward size={18} /> Skip
          </button>
          <button onClick={() => setSeconds(s => Math.max(0, s - 30))} className={styles.adjustBtn}>-30s</button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
