'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ChartWidget from '@/components/ChartWidget';
import styles from './page.module.css';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trainer/analytics')
      .then(r => r.json())
      .then(d => {
        if (!d.error) setData(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className={styles.page}>
        <Navbar />
        <Sidebar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Loader2 size={40} className="spin" style={{ color: '#22c55e' }} />
        </div>
      </div>
    );
  }

  // Ensure charts have default data if array is empty
  const revData = data.revenueData.length > 0 ? data.revenueData : [{ label: 'N/A', value: 0 }];
  const bookData = data.bookingsData.length > 0 ? data.bookingsData : [{ label: 'N/A', value: 0 }];

  return (
    <div className={styles.page}>
      <Navbar />
      <Sidebar />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Analytics</h1>
          <p>Track your business growth and performance over time.</p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Total Lifetime Revenue</h3>
            <p className={styles.value}>${data.totalRevenue.toFixed(2)}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Total Lifetime Bookings</h3>
            <p className={styles.value}>{data.totalBookings}</p>
          </div>
        </div>

        <div className={styles.chartsGrid}>
          <div>
            <ChartWidget
              data={revData.map(d => ({ value: d.value, label: d.label }))}
              type="bar"
              title="Revenue by Month"
              color="#22c55e"
            />
          </div>
          <div>
            <ChartWidget
              data={bookData.map(d => ({ value: d.value, label: d.label }))}
              type="line"
              title="Bookings by Month"
              color="#3b82f6"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
