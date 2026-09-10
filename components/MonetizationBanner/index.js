'use client';

import { DollarSign, TrendingUp, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import styles from './MonetizationBanner.module.css';

export default function MonetizationBanner() {
  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <DollarSign size={28} />
        </div>
        <div>
          <h3>Monetize Your Fitness Journey</h3>
          <p>Earn money as a trainer, affiliate, or content creator on RepForge.</p>
        </div>
      </div>
      <Link href="/monetization" className={styles.cta}>
        Start Earning <ArrowRight size={16} />
      </Link>
    </div>
  );
}
