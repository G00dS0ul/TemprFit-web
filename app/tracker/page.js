'use client';

import WeightTracker from '@/components/WeightTracker';
import styles from './page.module.css';

export default function Tracker() {
  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1>Progress <span className={styles.gradient}>Tracker</span></h1>
          <p>Monitor your weight, body composition, and fitness milestones.</p>
        </div>
        <WeightTracker />
      </div>
    </div>
  );
}
