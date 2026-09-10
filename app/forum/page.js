'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { MessageSquare, Video, Apple, Dumbbell, Bell } from 'lucide-react';
import styles from './page.module.css';

const ICON_MAP = {
  MessageSquare: <MessageSquare size={24} />,
  Video: <Video size={24} />,
  Apple: <Apple size={24} />,
  Dumbbell: <Dumbbell size={24} />,
  Bell: <Bell size={24} />
};

export default function ForumRooms() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/forum/categories')
      .then(res => res.json())
      .then(data => setCategories(data.categories || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <Navbar />
      <Sidebar />
      <div className="container" style={{ marginLeft: '250px', width: 'calc(100% - 250px)' }}>
        
        <div className={styles.header}>
          <h1>Community <span className={styles.gradient}>Forums</span></h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Join the discussion, ask for form checks, and connect with trainers.</p>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center' }}>Loading rooms...</p>
        ) : (
          <div className={styles.roomGrid}>
            {categories.map(cat => (
              <Link href={`/forum/category/${cat._id}`} key={cat._id} className={styles.roomCard}>
                <div className={styles.roomHeader}>
                  <div className={styles.iconWrapper}>
                    {ICON_MAP[cat.icon] || <MessageSquare size={24} />}
                  </div>
                  <h2>{cat.name}</h2>
                </div>
                <p>{cat.description}</p>
                <div className={styles.stats}>
                  <MessageSquare size={16} /> {cat.threadCount} active {cat.threadCount === 1 ? 'discussion' : 'discussions'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
