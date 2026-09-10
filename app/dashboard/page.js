'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity, Flame, Timer, Trophy, TrendingUp, TrendingDown,
  Dumbbell, Calendar, Target, Zap
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ChartWidget from '@/components/ChartWidget';
import WeightTracker from '@/components/WeightTracker';
import AIModal from '@/components/AIModal';
import { displayName } from '@/lib/utils';
import styles from './page.module.css';

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function Dashboard() {
  const [aiOpen, setAiOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [signedIn, setSignedIn] = useState(true);
  const [showFirstWelcome, setShowFirstWelcome] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
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
  }, []);

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

          <div className={styles.trackerSection}>
            <WeightTracker />
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
        </div>
      </div>
      <AIModal isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
