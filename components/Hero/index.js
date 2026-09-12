'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Activity, TrendingUp, Flame, BrainCircuit, Dumbbell, Apple, LineChart } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import styles from './Hero.module.css';

const QUICK_NAV = [
  { label: 'AI Coach', href: '/coach', icon: BrainCircuit },
  { label: 'Workouts', href: '/workouts', icon: Dumbbell },
  { label: 'Nutrition', href: '/nutrition', icon: Apple },
  { label: 'Progress', href: '/progress', icon: LineChart },
];

const SCENES = [
  {
    title: 'BUILD YOURSELF.',
    subtitle: 'Train smarter. Become stronger.',
    cta: 'Start Training',
    href: '/register',
    dark: '/images/hero/scene-1-male-pushup-dark.webp',
    light: '/images/hero/scene-1-male-pushup-light.webp',
  },
  {
    title: 'TRAIN WITH PURPOSE.',
    subtitle: 'Personalized workouts built around you.',
    cta: 'Explore Workouts',
    href: '/explore',
    dark: '/images/hero/scene-2-female-pushup-dark.webp',
    light: '/images/hero/scene-2-male-seated-light.webp',
  },
  {
    title: 'SEE YOUR PROGRESS.',
    subtitle: 'Every rep becomes part of your journey.',
    cta: 'View Progress',
    href: '/progress',
    dark: '/images/hero/scene-3-male-deadlift-dark.webp',
    light: '/images/hero/scene-3-male-deadlift-light.webp',
  },
  {
    title: 'YOUR COACH. ALWAYS ON.',
    subtitle: 'Ask. Adapt. Improve.',
    cta: 'Meet Your Coach',
    href: '/coach',
    dark: '/images/hero/scene-4-male-seated-dark.webp',
    light: '/images/hero/scene-1-male-pushup-light.webp',
  },
];

const AUTO_ADVANCE_MS = 6500;

export default function Hero() {
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
    <section className={styles.hero}>
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
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>

      <div className={styles.scrim} />

      <div className={`container ${styles.heroInner}`}>
        <div className={styles.eyebrow}>TRAIN / IMPROVE / EVOLVE</div>

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className={styles.title}>{scene.title}</h1>
            <p className={styles.subtitle}>{scene.subtitle}</p>
            <Link href={scene.href} className={styles.cta}>
              {scene.cta} <ArrowRight size={18} />
            </Link>
          </motion.div>
        </AnimatePresence>

        <div className={styles.dots}>
          {SCENES.map((s, i) => (
            <button
              key={s.title}
              className={`${styles.dot} ${i === index ? styles.dotActive : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Show scene ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className={styles.statCard1}>
        <Activity size={16} />
        <div>
          <span className={styles.statLabel}>Form Analysis</span>
          <span className={styles.statValue}>96%</span>
        </div>
      </div>
      <div className={styles.statCard2}>
        <TrendingUp size={16} />
        <div>
          <span className={styles.statLabel}>Muscle Growth</span>
          <span className={styles.statValue}>+12%</span>
        </div>
      </div>
      <div className={styles.statCard3}>
        <Flame size={16} />
        <div>
          <span className={styles.statLabel}>Calories</span>
          <span className={styles.statValue}>482 kcal</span>
        </div>
      </div>

      {/* Quick nav — clicking any of these opens the real routed view
          instead of scrolling to an in-page section (spec: no infinite
          scroll on the homepage; supplementary content lives behind
          routes/modals, triggered from here). */}
      <div className={styles.quickNav}>
        {QUICK_NAV.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} className={styles.quickNavItem}>
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
