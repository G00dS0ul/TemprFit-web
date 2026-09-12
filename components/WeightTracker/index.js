'use client';

import { useEffect, useState } from 'react';
import { Scale, TrendingDown, TrendingUp, Activity } from 'lucide-react';
import ChartWidget from '@/components/ChartWidget';
import styles from './WeightTracker.module.css';

export default function WeightTracker() {
  const [entries, setEntries] = useState(null); // null = loading
  const [signedIn, setSignedIn] = useState(true);
  const [newWeight, setNewWeight] = useState('');
  const [newBodyFat, setNewBodyFat] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    fetch('/api/weight')
      .then((r) => {
        if (r.status === 401) throw new Error('signin');
        return r.json();
      })
      .then((data) => setEntries(data.entries || []))
      .catch((e) => {
        if (e.message === 'signin') setSignedIn(false);
        else setEntries([]);
      });
  };

  useEffect(load, []);

  const addEntry = async () => {
    if (!newWeight) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: parseFloat(newWeight),
          bodyFatPercent: newBodyFat ? parseFloat(newBodyFat) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not save entry.');
        return;
      }
      setNewWeight('');
      setNewBodyFat('');
      load();
    } finally {
      setSaving(false);
    }
  };

  if (!signedIn) {
    return (
      <div className={styles.container}>
        <p style={{ color: 'var(--color-text-muted, var(--color-text-muted))', padding: '20px 0' }}>
          Sign in to track your weight and body fat over time.
        </p>
      </div>
    );
  }

  if (!entries) {
    return <div className={styles.container} />;
  }

  if (entries.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.addEntry}>
          <h4>Log your first entry</h4>
          <div className={styles.inputRow}>
            <input
              type="number"
              placeholder="Weight (lbs)"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
            />
            <input
              type="number"
              placeholder="Body Fat % (optional)"
              value={newBodyFat}
              onChange={(e) => setNewBodyFat(e.target.value)}
            />
            <button onClick={addEntry} disabled={saving}>{saving ? 'Saving…' : 'Add Entry'}</button>
          </div>
          {error && <p className={styles.negativeText}>{error}</p>}
        </div>
      </div>
    );
  }

  const current = entries[entries.length - 1];
  const previous = entries[entries.length - 2];
  const weightChange = previous ? (current.weight - previous.weight).toFixed(1) : 0;
  const fatChange =
    previous && current.bodyFatPercent != null && previous.bodyFatPercent != null
      ? (current.bodyFatPercent - previous.bodyFatPercent).toFixed(1)
      : null;

  return (
    <div className={styles.container}>
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <Scale size={24} className={styles.statIcon} />
          <div>
            <span className={styles.statValue}>{current.weight} {current.unit || 'lbs'}</span>
            <span className={styles.statLabel}>Current Weight</span>
          </div>
          <span className={`${styles.changeBadge} ${weightChange < 0 ? styles.negative : styles.positive}`}>
            {weightChange < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
            {weightChange} {current.unit || 'lbs'}
          </span>
        </div>

        {current.bodyFatPercent != null && (
          <div className={styles.statCard}>
            <Activity size={24} className={styles.statIcon} />
            <div>
              <span className={styles.statValue}>{current.bodyFatPercent}%</span>
              <span className={styles.statLabel}>Body Fat</span>
            </div>
            {fatChange != null && (
              <span className={`${styles.changeBadge} ${fatChange < 0 ? styles.negative : styles.positive}`}>
                {fatChange < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                {fatChange}%
              </span>
            )}
          </div>
        )}
      </div>

      <div className={styles.charts}>
        <ChartWidget
          data={entries.map((e) => ({ value: e.weight }))}
          type="line"
          title="Weight Progress"
          color="#22c55e"
        />
        {entries.some((e) => e.bodyFatPercent != null) && (
          <ChartWidget
            data={entries.filter((e) => e.bodyFatPercent != null).map((e) => ({ value: e.bodyFatPercent }))}
            type="bar"
            title="Body Fat %"
            color="#06b6d4"
          />
        )}
      </div>

      <div className={styles.addEntry}>
        <h4>Log New Entry</h4>
        <div className={styles.inputRow}>
          <input
            type="number"
            placeholder={`Weight (${current.unit || 'lbs'})`}
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
          />
          <input
            type="number"
            placeholder="Body Fat % (optional)"
            value={newBodyFat}
            onChange={(e) => setNewBodyFat(e.target.value)}
          />
          <button onClick={addEntry} disabled={saving}>{saving ? 'Saving…' : 'Add Entry'}</button>
        </div>
        {error && <p className={styles.negativeText}>{error}</p>}
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, var(--color-text-muted))', marginTop: '6px' }}>
          Logging again today updates today's entry instead of adding a duplicate.
        </p>
      </div>

      <div className={styles.history}>
        <h4>History</h4>
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Date</span>
            <span>Weight</span>
            <span>Body Fat</span>
            <span>Change</span>
          </div>
          {entries.slice().reverse().map((entry, i) => {
            const prev = entries[entries.length - 1 - i - 1];
            const change = prev ? (entry.weight - prev.weight).toFixed(1) : '-';
            return (
              <div key={entry._id || entry.date} className={styles.tableRow}>
                <span>{new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>{entry.weight} {entry.unit || 'lbs'}</span>
                <span>{entry.bodyFatPercent != null ? `${entry.bodyFatPercent}%` : '—'}</span>
                <span className={change < 0 ? styles.negativeText : styles.positiveText}>
                  {change !== '-' ? (change > 0 ? '+' : '') + change : '-'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
