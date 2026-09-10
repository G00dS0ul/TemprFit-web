'use client';

import { Check, Star } from 'lucide-react';
import styles from './PricingCard.module.css';

export default function PricingCard({ plan }) {
  return (
    <div className={`${styles.card} ${plan.popular ? styles.popular : ''}`}>
      {plan.popular && (
        <div className={styles.badge}>
          <Star size={12} fill="currentColor" /> Most Popular
        </div>
      )}

      <div className={styles.header}>
        <h3 className={styles.name}>{plan.name}</h3>
        <div className={styles.price}>
          <span className={styles.priceValue}>${plan.price}</span>
          <span className={styles.pricePeriod}>/{plan.period}</span>
        </div>
      </div>

      <ul className={styles.features}>
        {plan.features.map((feature, i) => (
          <li key={i}>
            <Check size={16} className={styles.check} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button className={`${styles.cta} ${plan.popular ? styles.ctaPopular : ''}`}>
        {plan.cta}
      </button>
    </div>
  );
}
