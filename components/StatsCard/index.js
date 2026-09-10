'use client';

import { TrendingUp } from 'lucide-react';
import styles from './StatsCard.module.css';

export default function StatsCard({ label, value, change, delay = 0 }) {
  const isPositive = change.startsWith('+');

  return (
    <div className={styles.card} style={{ animationDelay: `${delay}ms` }}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
          <TrendingUp size={14} />
          {change}
        </span>
      </div>
      <div className={styles.value}>{value}</div>
      <div className={styles.bar}>
        <div className={styles.barFill} style={{ width: `${Math.random() * 40 + 60}%` }} />
      </div>
    </div>
  );
}
