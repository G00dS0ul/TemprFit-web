'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { Check } from 'lucide-react';
import styles from './SetRow.module.css';

export default function SetRow({ 
  setIndex, 
  set, 
  isCompleted, 
  onComplete, 
  onUpdate,
  onUndo,
  isBodyweight = false,
  isTimeBased = false
}) {
  const [weight, setWeight] = useState(set.weight || '');
  const [reps, setReps] = useState(set.reps || set.targetReps || '');
  const [localIsBW, setLocalIsBW] = useState(isBodyweight);
  const [localIsTime, setLocalIsTime] = useState(isTimeBased);
  
  const x = useMotionValue(0);
  const controls = useAnimation();
  
  const background = useTransform(
    x,
    [0, 100],
    ['var(--color-surface)', 'var(--color-primary)']
  );

  const opacity = useTransform(x, [0, 80], [0, 1]);

  useEffect(() => {
    setWeight(set.weight || '');
    setReps(set.reps || set.targetReps || '');
  }, [set.weight, set.reps, set.targetReps]);

  const handleDragEnd = async (e, info) => {
    if (isCompleted) return;
    
    if (info.offset.x > 80) {
      // Complete the set
      await controls.start({ x: 100, transition: { duration: 0.2 } });
      onUpdate({ weight: localIsBW ? 0 : Number(weight), reps: Number(reps) });
      onComplete();
    } else {
      // Snap back
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  if (isCompleted) {
    return (
      <div 
        className={`${styles.setRow} ${styles.completed}`}
        onClick={() => {
          if (onUndo) {
            controls.set({ x: 0 });
            onUndo();
          }
        }}
        style={{ cursor: onUndo ? 'pointer' : 'default' }}
      >
        <div className={styles.setIndex}>{setIndex + 1}</div>
        <div className={styles.completedData}>
          <span>{localIsBW || weight === 0 ? 'BW' : `${weight} kg`}</span>
          <span>&times;</span>
          <span>{reps} {localIsTime ? 'sec' : 'reps'}</span>
        </div>
        <Check size={20} className={styles.checkIcon} />
      </div>
    );
  }

  return (
    <div className={styles.setRowWrap}>
      <motion.div className={styles.swipeBackground} style={{ background }}>
        <motion.div className={styles.swipeIconWrap} style={{ opacity }}>
          <Check size={24} color="#fff" />
        </motion.div>
      </motion.div>

      <motion.div
        className={styles.setRow}
        drag="x"
        dragConstraints={{ left: 0, right: 100 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        whileTap={{ scale: 0.98, cursor: 'grabbing' }}
      >
        <div className={styles.setIndex}>{setIndex + 1}</div>
        
        <div className={styles.inputs}>
          {localIsBW ? (
            <div className={`${styles.inputWrap} ${styles.bodyweightBadge}`} onClick={() => setLocalIsBW(false)} style={{ cursor: 'pointer' }}>
              <span className={styles.bwText}>BW</span>
            </div>
          ) : (
            <div className={styles.inputWrap}>
              <input 
                type="number" 
                value={weight} 
                onChange={e => setWeight(e.target.value)}
                placeholder="0"
                onPointerDownCapture={e => e.stopPropagation()} 
              />
              <span className={styles.unitToggle} onClick={() => setLocalIsBW(true)}>kg</span>
            </div>
          )}
          
          <div className={styles.inputWrap}>
            <input 
              type="number" 
              value={reps} 
              onChange={e => setReps(e.target.value)}
              placeholder="0"
              onPointerDownCapture={e => e.stopPropagation()} 
            />
            <span className={styles.unitToggle} onClick={() => setLocalIsTime(!localIsTime)}>
              {localIsTime ? 'sec' : 'reps'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
