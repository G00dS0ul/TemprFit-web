'use client';

import { useEffect, useState } from 'react';
import { getLocalWorkouts, removeLocalWorkout } from '@/lib/offlineSync';
import { useToast } from '@/components/ToastProvider';

export default function SyncManager() {
  const [isOnline, setIsOnline] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      flushSyncQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also run on mount in case we came online while the app was closed
    if (navigator.onLine) {
      flushSyncQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const flushSyncQueue = async () => {
    const workouts = await getLocalWorkouts();
    if (workouts.length === 0) return;

    let successCount = 0;
    
    for (const w of workouts) {
      try {
        const res = await fetch(`/api/sessions/${w.id}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exercises: w.exercises })
        });
        
        if (res.ok) {
          await removeLocalWorkout(w.id);
          successCount++;
        }
      } catch (e) {
        console.error('Failed to sync workout:', w.id);
      }
    }

    if (successCount > 0) {
      addToast('success', `Synced ${successCount} offline workout(s) to the cloud!`);
    }
  };

  if (!isOnline) {
    return (
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#ef4444',
        color: '#fff',
        textAlign: 'center',
        padding: '4px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        zIndex: 9999
      }}>
        Offline Mode - Your progress will be saved locally.
      </div>
    );
  }

  return null;
}
