'use client';

import { useEffect, useState } from 'react';
import { Loader2, Star, StarHalf } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trainer/reviews')
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setReviews(data.reviews || []);
          setAvgRating(Number(data.avgRating) || 0);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
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

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<Star key={i} size={18} fill="#f59e0b" color="#f59e0b" />);
      } else if (i - 0.5 <= rating) {
        stars.push(<StarHalf key={i} size={18} fill="#f59e0b" color="#f59e0b" />);
      } else {
        stars.push(<Star key={i} size={18} color="#4b5563" />);
      }
    }
    return stars;
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <Sidebar />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Client Reviews</h1>
          <p>See what your trainees are saying about your programs.</p>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryScore}>{avgRating.toFixed(1)}</div>
          <div className={styles.summaryInfo}>
            <div className={styles.summaryStars}>
              {renderStars(avgRating)}
            </div>
            <p>Based on {reviews.length} reviews</p>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'var(--surface)', borderRadius: '12px' }}>
            <Star size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{ color: 'var(--color-text-muted)' }}>You don't have any reviews yet.</p>
          </div>
        ) : (
          <div className={styles.reviewsGrid}>
            {reviews.map(review => (
              <div key={review._id} className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <img 
                    src={review.trainee?.avatarUrl || `https://ui-avatars.com/api/?name=${review.trainee?.username}&background=22c55e&color=fff`} 
                    alt={review.trainee?.username} 
                    className={styles.avatar} 
                  />
                  <div className={styles.reviewMeta}>
                    <h3>{review.trainee?.username}</h3>
                    <p>{new Date(review.createdAt).toLocaleDateString()} • {review.program?.title || 'General Training'}</p>
                  </div>
                </div>
                <div className={styles.stars}>
                  {renderStars(review.rating)}
                </div>
                <p className={styles.comment}>"{review.comment}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
