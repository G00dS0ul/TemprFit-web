'use client';

import { useEffect, useState } from 'react';
import { Sparkles, X, Flame } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './CheckInReminder.module.css';

export default function CheckInReminder() {
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only check if user is logged in
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (!data.user) return;
        
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        // If they already checked in, do nothing
        if (data.user.lastCheckInDate === todayStr) return;

        const hour = today.getHours();
        // Trigger at mid-day (12-16) or night (18+)
        const isMidDay = hour >= 12 && hour < 17;
        const isNight = hour >= 18;

        if (isMidDay || isNight) {
          // Check if we already reminded them during this period
          const periodKey = isNight ? 'night' : 'midday';
          const cacheKey = `temprfit_reminder_${todayStr}_${periodKey}`;
          
          if (!localStorage.getItem(cacheKey)) {
            setShow(true);
            localStorage.setItem(cacheKey, 'true');
          }
        }
      })
      .catch(() => {});
  }, []);

  if (!show) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={() => setShow(false)}>
          <X size={20} />
        </button>
        <div className={styles.iconWrap}>
          <Flame size={32} className={styles.icon} />
          <Sparkles size={16} className={styles.sparkle1} />
          <Sparkles size={16} className={styles.sparkle2} />
        </div>
        <h2 className={styles.title}>Don't Break Your Streak!</h2>
        <p className={styles.desc}>
          You haven't completed your daily check-in yet. Claim your XP now and keep your streak alive!
        </p>
        <button className={styles.claimBtn} onClick={() => {
          setShow(false);
          router.push('/dashboard');
        }}>
          Claim Daily XP
        </button>
      </div>
    </div>
  );
}
