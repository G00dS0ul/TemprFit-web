'use client';

import { Flame, Beef, Wheat, Droplets } from 'lucide-react';
import styles from './MacroSummary.module.css';

function Row({ icon: Icon, color, label, value, target, unit }) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : null;
  return (
    <div className={styles.row}>
      <div className={styles.rowHeader}>
        <span className={styles.rowLabel}>
          <Icon size={15} style={{ color }} /> {label}
        </span>
        <span className={styles.rowValue}>
          {value}{unit} {target ? <span className={styles.target}>/ {target}{unit}</span> : null}
        </span>
      </div>
      {target ? (
        <div className={styles.bar}>
          <div className={styles.barFill} style={{ width: `${pct}%`, background: color }} />
        </div>
      ) : null}
    </div>
  );
}

export default function MacroSummary({ totals, targets }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Today</h3>
      <Row icon={Flame} color="#f97316" label="Calories" value={totals.calories} target={targets?.calorieTarget} unit=" kcal" />
      <Row icon={Beef} color="#22c55e" label="Protein" value={totals.protein} target={targets?.proteinTarget} unit="g" />
      <Row icon={Wheat} color="#eab308" label="Carbs" value={totals.carbs} target={targets?.carbsTarget} unit="g" />
      <Row icon={Droplets} color="#a855f7" label="Fat" value={totals.fat} target={targets?.fatTarget} unit="g" />
    </div>
  );
}
