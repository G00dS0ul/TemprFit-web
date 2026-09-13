'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Activity, Globe, DollarSign, Calendar, Zap, Check, Star } from 'lucide-react';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

export default function ProgramDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/programs/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.program) {
          setProgram(d.program);
        } else {
          router.push('/trainers');
        }
      })
      .catch(() => router.push('/trainers'))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading || !program) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div style={{ padding: '120px 20px', textAlign: 'center' }}>Loading program...</div>
      </div>
    );
  }

  const trainer = program.trainer;

  return (
    <div className={styles.page}>
      <Navbar />
      <div className="container" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
        <Link href="/trainers" className={styles.backBtn}>
          <ArrowLeft size={16} /> Back to Marketplace
        </Link>
        
        <div className={styles.grid}>
          <div className={styles.mainCol}>
            <div className={styles.header}>
              <span className={styles.category}>{program.category}</span>
              <h1 className={styles.title}>{program.title}</h1>
              <div className={styles.meta}>
                <span className={styles.metaItem}><Clock size={16} /> {program.sessionsPerWeek}x / week</span>
                <span className={styles.metaItem}><Activity size={16} /> {program.totalSessions} sessions</span>
                <span className={styles.metaItem}><Globe size={16} style={{ textTransform: 'capitalize' }} /> {program.trainingMode}</span>
              </div>
            </div>

            <div className={styles.section}>
              <h2>About this Program</h2>
              <div className={styles.description}>
                {program.description.split('\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h2>What's Included</h2>
              <ul className={styles.featuresList}>
                <li><Check size={16} className={styles.checkIcon} /> Custom workout programming for {program.totalSessions} sessions</li>
                <li><Check size={16} className={styles.checkIcon} /> Direct messaging and check-ins with {trainer.username}</li>
                <li><Check size={16} className={styles.checkIcon} /> Full form reviews via the TemprFit App</li>
                <li><Check size={16} className={styles.checkIcon} /> Secure Escrow payments with milestone releases</li>
              </ul>
            </div>
          </div>

          <div className={styles.sideCol}>
            <div className={styles.bookingCard}>
              <div className={styles.priceRow}>
                <span className={styles.price}>${program.price}</span>
                <span className={styles.per}>total</span>
              </div>
              
              <button 
                className={styles.bookBtn}
                onClick={() => alert('Escrow payment flow will be integrated here.')}
              >
                <DollarSign size={18} /> Book via Secure Escrow
              </button>
              <p className={styles.guarantee}>
                <Zap size={14} /> 100% Secure. Funds are held in escrow and released progressively as sessions are completed.
              </p>

              <hr className={styles.divider} />

              <div className={styles.trainerInfo}>
                <img src={trainer.avatarUrl || `https://ui-avatars.com/api/?name=${trainer.username}`} alt={trainer.username} className={styles.avatar} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <strong>{trainer.username}</strong>
                    {trainer.trainerInfo?.isVerified && <Zap size={12} color="#22c55e" />}
                  </div>
                  <div className={styles.trainerRating}>
                    <Star size={12} /> {trainer.trainerInfo?.rating ? trainer.trainerInfo.rating.toFixed(1) : 'New Trainer'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
