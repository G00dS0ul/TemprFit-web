'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, MapPin, Zap, Award, Star, Loader2, PlayCircle, Image as ImageIcon, BadgeCheck, Users, Eye, Heart, UserPlus, UserCheck } from 'lucide-react';
import Link from 'next/link';
import EscrowWidget from '@/components/EscrowWidget';
import styles from './page.module.css';

export default function TrainerProfile({ params }) {
  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEscrow, setShowEscrow] = useState(false);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/trainers/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setTrainer(data.trainer);
          setIsFollowing(data.isFollowing || false);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Network error loading profile.');
        setLoading(false);
      });
  }, [params.id]);

  const toggleFollow = async () => {
    if (!trainer) return;
    setFollowLoading(true);
    try {
      const res = await fetch(`/api/trainers/${params.id}/follow`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsFollowing(data.isFollowing);
        setTrainer(prev => ({
          ...prev,
          followers: data.isFollowing 
            ? [...(prev.followers || []), 'temp'] 
            : (prev.followers || []).slice(0, -1)
        }));
      } else {
        alert(data.error || 'Failed to follow');
      }
    } catch (err) {
      console.error(err);
    }
    setFollowLoading(false);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <Loader2 size={40} className="spin" style={{ color: '#22c55e' }} />
        </div>
      </div>
    );
  }

  if (error || !trainer) {
    return (
      <div className={styles.page}>
        <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
          <h2>{error || 'Trainer not found'}</h2>
          <Link href="/trainers" className={styles.backBtn} style={{ marginTop: '20px', display: 'inline-flex' }}>
            <ChevronLeft size={16} /> Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  const { trainerInfo, username, avatarUrl } = trainer;
  const isFeatured = trainerInfo.isFeatured;
  const price = trainerInfo.price || 50;
  const location = trainerInfo.location || 'Remote';
  const mode = trainerInfo.trainingMode || 'remote';
  const specialties = trainerInfo.specialties || [];
  const bio = trainerInfo.bio || 'This trainer hasn\'t written a bio yet.';
  const mediaGallery = trainerInfo.mediaGallery || [];
  const isVerified = trainerInfo.isVerified || false;
  const followersCount = trainer?.followers?.length || 0;
  const viewsCount = trainerInfo.views || 0;
  const likesCount = trainerInfo.likes?.length || 0;

  return (
    <div className={styles.page}>
      {/* Cover Banner */}
      <div className={styles.coverPhoto}></div>

      <div className="container">
        <Link href="/trainers" className={styles.backBtn}>
          <ChevronLeft size={18} /> Back to Directory
        </Link>

        <div className={styles.profileHeader}>
          <div className={styles.avatarContainer}>
            <img src={avatarUrl || `https://ui-avatars.com/api/?name=${username}&background=22c55e&color=fff&size=200`} alt={username} className={styles.avatar} />
            {isFeatured && <div className={styles.featuredBadge}><Zap size={14} /> Featured Pro</div>}
          </div>

          <div className={styles.headerInfo}>
            <div className={styles.titleRow}>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {username} 
                {isVerified && <BadgeCheck size={24} color="#3b82f6" fill="#fff" style={{ marginTop: '4px' }} />}
              </h1>
              <div className={styles.rating}><Star size={18} fill="currentColor" /> 4.9 (12 reviews)</div>
            </div>
            
            <div className={styles.metaRow}>
              <span className={styles.metaItem}><MapPin size={16} /> {location}</span>
              <span className={styles.metaItem} style={{ textTransform: 'capitalize' }}><Award size={16} /> {mode} Training</span>
              <span className={styles.metaItem}><Users size={16} /> {followersCount} Followers</span>
              <span className={styles.metaItem}><Eye size={16} /> {viewsCount} Views</span>
              <span className={styles.metaItem}><Heart size={16} /> {likesCount} Likes</span>
            </div>

            <div className={styles.specialties}>
              {specialties.map(spec => (
                <span key={spec} className={styles.tag}>{spec}</span>
              ))}
            </div>
          </div>

          <div className={styles.bookingCard}>
            <div className={styles.priceRow}>
              <span className={styles.price}>${price}</span>
              <span className={styles.perSession}>/ session</span>
            </div>
            <p className={styles.bookingText}>Book a 1-on-1 session. Funds are held securely in escrow until completion.</p>
            <button className={styles.bookBtn} onClick={() => setShowEscrow(true)}>
              Book Session
            </button>
            <button 
              className={styles.followBtn} 
              onClick={toggleFollow} 
              disabled={followLoading}
              style={{
                marginTop: '10px', width: '100%', padding: '12px', borderRadius: '12px',
                background: isFollowing ? 'transparent' : 'rgba(255,255,255,0.05)',
                border: isFollowing ? '1px solid var(--color-border)' : '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {isFollowing ? <><UserCheck size={18} /> Following</> : <><UserPlus size={18} /> Follow</>}
            </button>
            <button 
              onClick={async () => {
                try {
                  const res = await fetch('/api/messages/init', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ targetUserId: trainer._id })
                  });
                  const data = await res.json();
                  if (data.success) {
                    router.push('/messages');
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
              style={{
                marginTop: '10px', width: '100%', padding: '12px', borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#3b82f6', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              Message Trainer
            </button>
          </div>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.mainCol}>
            <section className={styles.section}>
              <h2>About Me</h2>
              <p className={styles.bio}>{bio}</p>
            </section>

            {mediaGallery.length > 0 && (
              <section className={styles.section}>
                <h2>Gallery & Transformations</h2>
                <div className={styles.gallery}>
                  {mediaGallery.map((url, i) => (
                    <div key={i} className={styles.galleryItem}>
                      <img src={url} alt={`Gallery ${i}`} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {showEscrow && (
          <div className={styles.escrowOverlay} onClick={() => setShowEscrow(false)}>
            <div className={styles.escrowModal} onClick={e => e.stopPropagation()}>
              <EscrowWidget trainer={trainer} price={price} onClose={() => setShowEscrow(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
