'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

export default function LeaderboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('bronze'); // bronze, silver, gold, platinum
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.replace('/login');
          return;
        }
        setUser(data.user);
        
        // Auto-select tab based on user's XP
        if (data.user.xp >= 100000) setActiveTab('platinum');
        else if (data.user.xp >= 25000) setActiveTab('gold');
        else if (data.user.xp >= 5000) setActiveTab('silver');
        else setActiveTab('bronze');
      });

    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    setLeaderboard([]); // clear while loading
    fetch(`/api/leaderboard?league=${activeTab}`)
      .then(r => r.json())
      .then(data => {
        if (data.leaderboard) {
          // Identify if the logged in user is in the list
          const mapped = data.leaderboard.map(entry => ({
            ...entry,
            isMe: user && (entry.id === user._id)
          }));
          setLeaderboard(mapped);
        }
      })
      .catch(() => {});
  }, [user, activeTab]);

  if (!user || !stats) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <div className={styles.content}>
          <div className="container">
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Sidebar />
      <div className={styles.content}>
        <div className="container">
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Leaderboard Leagues</h1>
              <p className={styles.subtitle}>Compete in your XP bracket. Rise through the ranks to hit Platinum!</p>
            </div>
          </div>

          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'bronze' ? styles.active : ''}`}
              onClick={() => setActiveTab('bronze')}
              style={activeTab === 'bronze' ? { borderColor: '#b87333', color: '#b87333' } : {}}
            >
              Bronze (0-5k)
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'silver' ? styles.active : ''}`}
              onClick={() => setActiveTab('silver')}
              style={activeTab === 'silver' ? { borderColor: '#9ca3af', color: '#9ca3af' } : {}}
            >
              Silver (5k-25k)
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'gold' ? styles.active : ''}`}
              onClick={() => setActiveTab('gold')}
              style={activeTab === 'gold' ? { borderColor: '#fbbf24', color: '#fbbf24' } : {}}
            >
              Gold (25k-100k)
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'platinum' ? styles.active : ''}`}
              onClick={() => setActiveTab('platinum')}
              style={activeTab === 'platinum' ? { borderColor: '#3b82f6', color: '#3b82f6', textShadow: '0 0 10px rgba(59,130,246,0.5)' } : {}}
            >
              Platinum (100k+)
            </button>
          </div>

          <div className={styles.boardCard}>
            <div className={styles.boardHeader}>
              <div>Rank</div>
              <div>Athlete</div>
              <div style={{ textAlign: 'right' }}>Total XP</div>
            </div>

            <div className={styles.boardList}>
              {leaderboard.map((entry, idx) => {
                const rank = idx + 1;
                let rankClass = '';
                if (rank === 1) rankClass = styles.rank1;
                if (rank === 2) rankClass = styles.rank2;
                if (rank === 3) rankClass = styles.rank3;

                return (
                  <div key={entry.id} className={`${styles.boardRow} ${entry.isMe ? styles.isMe : ''}`}>
                    <div className={`${styles.rank} ${rankClass}`}>
                      #{rank}
                    </div>
                    <Link href={`/u/${entry.name}`} style={{ display: 'flex', flex: 1, alignItems: 'center', textDecoration: 'none' }}>
                      <div className={styles.userCol}>
                        <div 
                          className={styles.avatar}
                          style={{ 
                            border: entry.activeBorder ? `3px solid ${entry.activeBorder === 'diamond' ? '#3b82f6' : entry.activeBorder === 'gold' ? '#fbbf24' : entry.activeBorder === 'fire' ? '#ef4444' : '#06b6d4'}` : 'none',
                            boxShadow: entry.activeBorder === 'diamond' ? '0 0 15px #3b82f6' : entry.activeBorder === 'fire' ? '0 0 10px #ef4444' : entry.activeBorder === 'lightning' ? '0 0 10px #06b6d4' : 'none'
                          }}
                        >
                          {entry.avatar}
                        </div>
                        <div className={styles.userName}>
                          <span style={{ color: entry.activeColor ? entry.activeColor : 'inherit' }}>
                            {entry.name}
                          </span>
                          {entry.isMe && <span className={styles.isMeBadge}>You</span>}
                        </div>
                      </div>
                    </Link>
                    <div className={styles.score} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span style={{ fontWeight: 800, color: '#fbbf24' }}>{entry.score.toLocaleString()} XP</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
