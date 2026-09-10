'use client';

import { useEffect, useRef } from 'react';
import styles from './Logo3D.module.css';

export default function Logo3D({ size = 200 }) {
  const cubeRef = useRef(null);

  useEffect(() => {
    const cube = cubeRef.current;
    if (!cube) return;

    let angle = 0;
    let animationId;

    const animate = () => {
      angle += 0.5;
      if (cube) {
        cube.style.transform = `rotateX(${angle * 0.7}deg) rotateY(${angle}deg)`;
      }
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className={styles.scene} style={{ width: size, height: size }}>
      <div className={styles.cube} ref={cubeRef}>
        <div className={`${styles.face} ${styles.front}`}>
          <span className={styles.faceText}>R</span>
        </div>
        <div className={`${styles.face} ${styles.back}`}>
          <span className={styles.faceText}>F</span>
        </div>
        <div className={`${styles.face} ${styles.right}`}>
          <span className={styles.faceText}>E</span>
        </div>
        <div className={`${styles.face} ${styles.left}`}>
          <span className={styles.faceText}>P</span>
        </div>
        <div className={`${styles.face} ${styles.top}`}>
          <span className={styles.faceText}>🔥</span>
        </div>
        <div className={`${styles.face} ${styles.bottom}`}>
          <span className={styles.faceText}>💪</span>
        </div>
      </div>
      <div className={styles.glow} />
    </div>
  );
}
