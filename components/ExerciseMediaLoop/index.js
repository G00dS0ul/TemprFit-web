'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import styles from './ExerciseMediaLoop.module.css';

const FRAME_MS = 650; // how long each image shows before crossfading to the other

export default function ExerciseMediaLoop({ startImg, finishImg, alt }) {
  const [playing, setPlaying] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (playing && finishImg) {
      intervalRef.current = setInterval(() => {
        setShowFinish((v) => !v);
      }, FRAME_MS);
    } else {
      clearInterval(intervalRef.current);
      setShowFinish(false);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, finishImg]);

  return (
    <div className={styles.hero}>
      <img src={startImg} alt={`${alt} — starting position`} className={`${styles.img} ${!showFinish ? styles.visible : ''}`} />
      {finishImg && (
        <img src={finishImg} alt={`${alt} — finishing position`} className={`${styles.img} ${showFinish ? styles.visible : ''}`} />
      )}

      {finishImg && (
        <button
          type="button"
          className={styles.playBtn}
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause movement loop' : 'Play movement loop'}
        >
          {playing ? <Pause size={22} /> : <Play size={22} />}
        </button>
      )}
    </div>
  );
}
