'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';
import styles from './AuthBackground.module.css';

const SCENES = [
  {
    dark: '/images/hero/scene-1-male-pushup-dark.webp',
    light: '/images/hero/scene-1-male-pushup-light.webp',
  },
  {
    dark: '/images/hero/scene-2-female-pushup-dark.webp',
    light: '/images/hero/scene-2-male-seated-light.webp',
  },
  {
    dark: '/images/hero/scene-3-male-deadlift-dark.webp',
    light: '/images/hero/scene-3-male-deadlift-light.webp',
  },
  {
    dark: '/images/hero/scene-4-male-seated-dark.webp',
    light: '/images/hero/scene-1-male-pushup-light.webp',
  },
];

const AUTO_ADVANCE_MS = 6500;

export default function AuthBackground() {
  const [index, setIndex] = useState(0);
  const { theme } = useTheme();

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % SCENES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [next]);

  const scene = SCENES[index];
  const imageSrc = theme === 'light' ? scene.light : scene.dark;

  return (
    <div className={styles.container}>
      <AnimatePresence mode="sync">
        <motion.div
          key={imageSrc}
          className={styles.slide}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        >
          <Image
            src={imageSrc}
            alt=""
            fill
            priority={index === 0}
            className={styles.slideImage}
            sizes="50vw"
          />
        </motion.div>
      </AnimatePresence>
      <div className={styles.scrim} />
    </div>
  );
}
