'use client';

import { Flame, Wheat, Droplets, Beef } from 'lucide-react';
import styles from './DietPlan.module.css';

export default function DietPlan({ plan }) {
  const macros = [
    { label: 'Protein', value: plan.protein, icon: Beef, color: '#f97316' },
    { label: 'Carbs', value: plan.carbs, icon: Wheat, color: '#eab308' },
    { label: 'Fat', value: plan.fat, icon: Droplets, color: '#a855f7' },
  ];

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.planIcon}>{plan.image}</div>
        <div>
          <h3 className={styles.name}>{plan.name}</h3>
          <span className={`${styles.type} ${styles[plan.type]}`}>{plan.type}</span>
        </div>
      </div>

      <div className={styles.calories}>
        <Flame size={20} className={styles.flame} />
        <div>
          <span className={styles.calValue}>{plan.calories}</span>
          <span className={styles.calLabel}>calories / day</span>
        </div>
      </div>

      <div className={styles.meals}>
        <span className={styles.mealsLabel}>{plan.meals} meals per day</span>
      </div>

      <div className={styles.macros}>
        {macros.map(macro => (
          <div key={macro.label} className={styles.macro}>
            <macro.icon size={16} style={{ color: macro.color }} />
            <div>
              <span className={styles.macroValue}>{macro.value}g</span>
              <span className={styles.macroLabel}>{macro.label}</span>
            </div>
          </div>
        ))}
      </div>

      <button className={styles.selectBtn}>Select Plan</button>
    </div>
  );
}
