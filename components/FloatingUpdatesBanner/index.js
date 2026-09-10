'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, X, ChevronRight, RefreshCw, BarChart2, Zap } from 'lucide-react';
import styles from './FloatingUpdatesBanner.module.css';

const UPDATES = [
  {
    id: 1,
    title: "Don't know where to start?",
    desc: "Let our AI build a personalized weekly plan for you.",
    cta: "Generate Workout",
    link: "/workouts/generate",
    icon: Sparkles,
  },
  {
    id: 2,
    title: "Track your transformation",
    desc: "Compare your before and after images with our new AI feature.",
    cta: "Try Transformation",
    link: "/transformation",
    icon: RefreshCw,
  },
  {
    id: 3,
    title: "Review your progress",
    desc: "Check out your dashboard to see how you're trending this month.",
    cta: "View Dashboard",
    link: "/dashboard",
    icon: BarChart2,
  },
  {
    id: 4,
    title: "Need diet advice?",
    desc: "Our AI Dietitian can generate a tailored meal plan for you instantly.",
    cta: "Get Diet Plan",
    link: "/nutrition",
    icon: Zap,
  }
];

export default function FloatingUpdatesBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % UPDATES.length);
    }, 6000); // Change every 6 seconds
    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  const currentUpdate = UPDATES[currentIndex];
  const Icon = currentUpdate.icon;

  return (
    <div className={styles.banner}>
      <button className={styles.closeBtn} onClick={() => setVisible(false)} aria-label="Close">
        <X size={14} />
      </button>
      <div className={styles.content}>
        <div className={styles.iconWrap}>
          <Icon size={18} />
        </div>
        <div className={styles.textWrap}>
          <h4>{currentUpdate.title}</h4>
          <p>{currentUpdate.desc}</p>
        </div>
      </div>
      <Link href={currentUpdate.link} className={styles.ctaBtn}>
        {currentUpdate.cta} <ChevronRight size={14} />
      </Link>
    </div>
  );
}
