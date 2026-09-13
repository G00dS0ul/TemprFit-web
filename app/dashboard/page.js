'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity, Flame, Timer, Trophy, TrendingUp, TrendingDown,
  Dumbbell, Calendar, Target, Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ChartWidget from '@/components/ChartWidget';
import WeightTracker from '@/components/WeightTracker';
import AIModal from '@/components/AIModal';
import HealthGraphs from '@/components/HealthGraphs';
import DashboardMeals from '@/components/DashboardMeals';
import { displayName } from '@/lib/utils';
import styles from './page.module.css';

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function Dashboard() {
  const router = useRouter();
  const [aiOpen, setAiOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [escrows, setEscrows] = useState([]);
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [signedIn, setSignedIn] = useState(true);
  const [showFirstWelcome, setShowFirstWelcome] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        // Redirect approved trainers to their dedicated dashboard if they are in trainer mode
        const activeMode = typeof window !== 'undefined' ? localStorage.getItem('activeMode') : 'trainee';
        if (data.user?.role === 'trainer' && data.user?.trainerInfo?.isApproved && activeMode === 'trainer') {
          router.replace('/trainer-dashboard');
          return;
        }
        setUser(data.user);
        // First-ever dashboard visit gets a distinct greeting. The flag is
        // flipped server-side right after we read it here, so a refresh
        // (even an immediate one) correctly shows "Welcome back" from then on.
        if (data.user && !data.user.firstLoginCompleted) {
          setShowFirstWelcome(true);
          fetch('/api/user/first-login', { method: 'POST' }).catch(() => {});
        }
      });

    fetch('/api/stats')
      .then((r) => {
        if (r.status === 401) throw new Error('signin');
        return r.json();
      })
      .then(setStats)
      .catch((e) => {
        if (e.message === 'signin') setSignedIn(false);
      });

    // Fetch active bookings
    fetch('/api/bookings?escrowStatus=held')
      .then(r => r.json())
      .then(data => {
        if (data.bookings) setEscrows(data.bookings);
      })
      .catch(() => {});

    // Fetch AI workouts
    fetch('/api/workouts/generate')
      .then(r => r.json())
      .then(data => {
        if (data.plans) setSavedWorkouts(data.plans.slice(0, 3));
      })
      .catch(() => {});
  }, [router]);

  const handleReleaseFunds = async (txId, amount) => {
    if (!confirm('Are you sure you want to release funds to the trainer? This cannot be undone.')) return;
    const res = await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: txId, action: 'release', amountToRelease: amount })
    });
    const data = await res.json();
    if (data.success) {
      setEscrows(prev => prev.map(t => t._id === txId ? data.booking : t).filter(t => t.escrowStatus !== 'released'));
      alert('Funds released successfully! Thank you.');
    } else {
      alert(data.error || 'Failed to release funds.');
    }
  };

  const handleDisputeEscrow = async (txId) => {
    if (!confirm('Are you sure you want to dispute this transaction? This will freeze the funds and notify an Admin to intervene.')) return;
    const res = await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: txId, action: 'dispute' })
    });
    const data = await res.json();
    if (data.success) {
      setEscrows(prev => prev.filter(t => t._id !== txId)); // Remove from active view
      alert('Dispute raised. An Admin will review the transaction soon.');
    } else {
      alert(data.error || 'Failed to raise dispute.');
    }
  };

  if (!signedIn) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <div className={styles.content}>
          <div className="container">
            <p style={{ padding: '60px 0', textAlign: 'center' }}>
              Sign in to see your dashboard. <Link href="/login" style={{ color: '#22c55e' }}>Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const sessionsGoal = stats?.goals?.weeklySessions || 4;
  const sessionsThisWeek = stats?.sessionsThisWeek ?? 0;
  const sessionsPct = Math.min(100, Math.round((sessionsThisWeek / sessionsGoal) * 100));

  const targetWeight = stats?.goals?.targetWeight;
  const currentBest1RM = stats?.currentBest1RM;
  const liftPct =
    targetWeight && currentBest1RM
      ? Math.min(100, Math.round((currentBest1RM / targetWeight) * 100))
      : null;

  return (
    <div className={styles.page}>
      <Sidebar />
      <div className={styles.content}>
        <div className="container">
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Dashboard</h1>
              <p className={styles.subtitle}>
                {user
                  ? showFirstWelcome
                    ? `Welcome to your new dashboard, ${displayName(user).split(' ')[0]}! Here is your fitness overview.`
                    : `Welcome back, ${displayName(user).split(' ')[0]}! Here is your fitness overview.`
                  : 'Here is your fitness overview.'}
              </p>
            </div>
            <button className={styles.aiBtn} onClick={() => setAiOpen(true)}>
              <Zap size={18} /> Ask AI Coach
            </button>
          </div>

          <div className={styles.quickStats}>
            <div className={styles.qsCard}>
              <div className={styles.qsIcon} style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                <Flame size={22} />
              </div>
              <div>
                <span className={styles.qsValue}>{stats ? stats.caloriesThisWeek.toLocaleString() : '—'}</span>
                <span className={styles.qsLabel}>Est. Calories (7d)</span>
              </div>
            </div>
            <div className={styles.qsCard}>
              <div className={styles.qsIcon} style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4' }}>
                <Timer size={22} />
              </div>
              <div>
                <span className={styles.qsValue}>{stats ? formatDuration(stats.workoutSecondsThisWeek) : '—'}</span>
                <span className={styles.qsLabel}>Workout Time (7d)</span>
              </div>
            </div>
            <div className={styles.qsCard}>
              <div className={styles.qsIcon} style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316' }}>
                <Dumbbell size={22} />
              </div>
              <div>
                <span className={styles.qsValue}>{stats ? stats.totalSessions : '—'}</span>
                <span className={styles.qsLabel}>Total Sessions</span>
              </div>
            </div>
            <div className={styles.qsCard}>
              <div className={styles.qsIcon} style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
                <Trophy size={22} />
              </div>
              <div>
                <span className={styles.qsValue}>{stats ? stats.currentStreak : '—'}</span>
                <span className={styles.qsLabel}>Day Streak</span>
              </div>
            </div>
          </div>

          {stats && stats.totalSessions === 0 && (
            <div className={styles.emptyBanner}>
              <p>No completed workouts yet — once you finish your first session, your real stats and charts show up here.</p>
              <Link href="/workouts" className={styles.aiBtn} style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>Start a workout</Link>
            </div>
          )}

          <div className={styles.chartsRow}>
            <ChartWidget
              data={stats ? stats.weeklyVolume : Array(8).fill({ value: 0 })}
              type="bar"
              title="Weekly Volume (last 8 weeks)"
              color="#22c55e"
            />
            <ChartWidget
              data={stats && stats.strengthTrend.length > 1 ? stats.strengthTrend : Array(8).fill({ value: 0 })}
              type="line"
              title={stats?.targetExercise ? `Est. 1RM — ${stats.targetExercise.name}` : 'Strength Progress'}
              color="#06b6d4"
            />
          </div>
          
          <DashboardMeals />

          <div className={styles.trackerSection}>
            <WeightTracker />
            <HealthGraphs />
          </div>

          <div className={styles.goalsSection}>
            <h3 className={styles.sectionTitle}>Active Goals</h3>
            <div className={styles.goalsGrid}>
              <div className={styles.goalCard}>
                <div className={styles.goalHeader}>
                  <Target size={18} style={{ color: '#22c55e' }} />
                  <span>{stats?.targetExercise?.name || 'Set a lift goal'} PR</span>
                </div>
                {targetWeight ? (
                  <>
                    <div className={styles.goalProgress}>
                      <div className={styles.goalBar}>
                        <div className={styles.goalFill} style={{ width: `${liftPct ?? 0}%` }} />
                      </div>
                      <span className={styles.goalPercent}>{liftPct ?? 0}%</span>
                    </div>
                    <span className={styles.goalTarget}>
                      Target: {targetWeight} {user?.weightUnit || 'lbs'} | Current: {currentBest1RM ?? '—'} {user?.weightUnit || 'lbs'} (est. 1RM)
                    </span>
                  </>
                ) : (
                  <span className={styles.goalTarget}>
                    No target set yet — <Link href="/settings" style={{ color: '#22c55e' }}>set one in Settings</Link>.
                  </span>
                )}
              </div>

              <div className={styles.goalCard}>
                <div className={styles.goalHeader}>
                  <Calendar size={18} style={{ color: '#f97316' }} />
                  <span>Weekly Sessions</span>
                </div>
                <div className={styles.goalProgress}>
                  <div className={styles.goalBar}>
                    <div className={styles.goalFill} style={{ width: `${sessionsPct}%` }} />
                  </div>
                  <span className={styles.goalPercent}>{sessionsPct}%</span>
                </div>
                <span className={styles.goalTarget}>Target: {sessionsGoal} | Current: {sessionsThisWeek}</span>
              </div>

              <div className={styles.goalCard}>
                <div className={styles.goalHeader}>
                  <Activity size={18} style={{ color: '#06b6d4' }} />
                  <span>Longest Streak</span>
                </div>
                <div className={styles.goalProgress}>
                  <div className={styles.goalBar}>
                    <div className={styles.goalFill} style={{ width: stats?.longestStreak ? '100%' : '0%' }} />
                  </div>
                  <span className={styles.goalPercent}>{stats?.longestStreak ?? 0}d</span>
                </div>
                <span className={styles.goalTarget}>Current streak: {stats?.currentStreak ?? 0} days</span>
              </div>
            </div>
          </div>

          {escrows.length > 0 && (
            <div className={styles.goalsSection} style={{ marginTop: '40px' }}>
              <h3 className={styles.sectionTitle}>Active Training Bookings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {escrows.map(escrow => {
                  const trainerName = escrow.trainer?.username || 'Trainer';
                  const remaining = escrow.amountPaid - (escrow.releasedAmount || 0);
                  const stepVal = escrow.amountPaid * 0.25;

                  return (
                    <div key={escrow._id} style={{ background: 'var(--color-bg-elevated)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ marginBottom: '8px' }}>Training with {trainerName}</h4>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>{escrow.program?.title || 'Program'}</p>
                        <div style={{ color: '#22c55e', fontSize: '0.85rem' }}>
                          Released: ${(escrow.releasedAmount || 0).toFixed(2)} / ${escrow.amountPaid.toFixed(2)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button 
                          onClick={async () => {
                            const res = await fetch('/api/messages/init', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ targetUserId: escrow.trainer._id })
                            });
                            const data = await res.json();
                            if (data.success) {
                              router.push('/messages');
                            }
                          }}
                          style={{ background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Message
                        </button>
                        <button 
                          onClick={() => handleDisputeEscrow(escrow._id)} 
                          style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Dispute
                        </button>
                        <button 
                          onClick={() => handleReleaseFunds(escrow._id, stepVal)} 
                          style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Release 25% (${stepVal.toFixed(2)})
                        </button>
                        <button 
                          onClick={() => handleReleaseFunds(escrow._id, remaining)} 
                          style={{ background: '#22c55e', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Release Remaining (${remaining.toFixed(2)})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {savedWorkouts.length > 0 && (
            <div className={styles.goalsSection} style={{ marginTop: '40px' }}>
              <h3 className={styles.sectionTitle}>Recent AI Workouts</h3>
              <div className={styles.goalsGrid}>
                {savedWorkouts.map(plan => (
                  <div key={plan._id} className={styles.goalCard} style={{ cursor: 'pointer' }} onClick={() => router.push('/workouts/ai')}>
                    <div className={styles.goalHeader}>
                      <Zap size={18} style={{ color: '#3b82f6' }} />
                      <span>{plan.goal}</span>
                    </div>
                    <span className={styles.goalTarget}>
                      {plan.days.length} Days • {plan.equipment}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '8px' }}>
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '40px', background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(16,185,129,0.1))', padding: '32px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: '#22c55e' }}>Are you a fitness professional?</h3>
              <p style={{ color: 'var(--color-text-muted)' }}>Join the TemprFit Trainer Network to coach clients and earn money.</p>
            </div>
            <Link href="/become-trainer" style={{ background: '#22c55e', color: '#fff', padding: '12px 24px', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' }}>
              Become a Trainer
            </Link>
          </div>

          <div style={{ marginTop: '20px', background: 'var(--color-bg-elevated)', padding: '24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Platform Administration</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Access the admin command center (Master password required).</p>
            </div>
            <Link href="/admin/login" style={{ background: '#22c55e', color: '#fff', padding: '12px 24px', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' }}>
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
      <AIModal isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
