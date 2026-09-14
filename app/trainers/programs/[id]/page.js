'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Activity, Globe, DollarSign, Calendar, Zap, Check, Star, Heart, Video, X, Target, ClipboardList, HelpCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

export default function ProgramDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    startDate: '',
    time: '',
    location: '',
  });

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
                {program.description}
              </div>
            </div>

            {program.targetAudience && (
              <div className={styles.section}>
                <h2><Target size={20} style={{ marginRight: '8px', verticalAlign: 'text-bottom', color: 'var(--color-primary)' }} /> Target Audience</h2>
                <div className={styles.targetAudienceBox}>
                  {program.targetAudience}
                </div>
              </div>
            )}

            {program.requirements && program.requirements.length > 0 && (
              <div className={styles.section}>
                <h2><ClipboardList size={20} style={{ marginRight: '8px', verticalAlign: 'text-bottom', color: 'var(--color-primary)' }} /> Requirements</h2>
                <ul className={styles.featuresList}>
                  {program.requirements.map((req, i) => (
                    <li key={i}><Check size={16} className={styles.checkIcon} /> {req}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.section}>
              <h2>What's Included</h2>
              <ul className={styles.featuresList}>
                <li><Check size={16} className={styles.checkIcon} /> Custom workout programming for {program.totalSessions} sessions</li>
                <li><Check size={16} className={styles.checkIcon} /> Direct messaging and check-ins with {trainer.username}</li>
                <li><Check size={16} className={styles.checkIcon} /> Full form reviews via the TemprFit App</li>
                <li><Check size={16} className={styles.checkIcon} /> Secure Escrow payments with milestone releases</li>
              </ul>
            </div>

            {program.faq && program.faq.length > 0 && (
              <div className={styles.section}>
                <h2><HelpCircle size={20} style={{ marginRight: '8px', verticalAlign: 'text-bottom', color: 'var(--color-primary)' }} /> Frequently Asked Questions</h2>
                <div className={styles.faqContainer}>
                  {program.faq.map((f, i) => (
                    <div key={i} className={styles.faqItem}>
                      <div className={styles.faqQuestion}>
                        {f.question}
                      </div>
                      <div className={styles.faqAnswer}>
                        {f.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {program.mediaGallery && program.mediaGallery.length > 0 && (
              <div className={styles.mediaGallery}>
                {program.mediaGallery.map((url, index) => {
                  const isVideo = !!url.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i);
                  return (
                    <div key={index} className={styles.mediaItem}>
                      {isVideo ? (
                        <video src={url} controls className={styles.mediaObj} />
                      ) : (
                        <img src={url} alt={`Media ${index}`} className={styles.mediaObj} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.sideCol}>
            <div className={styles.bookingCard}>
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
                <div className={styles.priceRow} style={{ marginBottom: '16px' }}>
                  <span className={styles.price}>${program.price}</span>
                  <span className={styles.per}>total</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <img src={program.programProfilePicture || trainer.avatarUrl || `https://ui-avatars.com/api/?name=${trainer.username}`} alt={trainer.username} className={styles.avatar} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '1.1rem', fontWeight: 800 }}>{trainer.username}</strong>
                      {trainer.trainerInfo?.isVerified && (
                        <div className={styles.verifiedBadge} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                          <Zap size={10} color="#000" />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
                      <span className={styles.trainerRating}>
                        <Star size={14} fill="gold" color="gold" /> {trainer.trainerInfo?.rating ? trainer.trainerInfo.rating.toFixed(1) : '5.0'}
                      </span>
                      <span className={styles.trainerLikes}>
                        <Heart size={14} fill="#ec4899" color="#ec4899" /> {trainer.trainerInfo?.likes?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                className={styles.bookBtn}
                onClick={() => setShowBookingModal(true)}
              >
                <DollarSign size={18} /> Book via Secure Escrow
              </button>
              <p className={styles.guarantee}>
                <Zap size={14} /> 100% Secure. Funds are held in escrow and released progressively as sessions are completed.
              </p>

              <hr className={styles.divider} />

              <div className={styles.trainerInfo} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                {trainer.trainerInfo?.availability && (
                  <div className={styles.availabilityBox} style={{ margin: 0 }}>
                    <Clock size={16} color="var(--color-text-muted)" />
                    <span>{trainer.trainerInfo.availability}</span>
                  </div>
                )}
                
                {trainer.trainerInfo?.bio && (
                  <div className={styles.trainerBio} style={{ textAlign: 'left', marginTop: 0 }}>
                    <strong style={{ display: 'block', color: 'var(--color-text)', marginBottom: '8px', fontSize: '1rem' }}>About {trainer.username}</strong>
                    <p style={{ margin: 0 }}>{trainer.trainerInfo.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBookingModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.closeBtn} onClick={() => setShowBookingModal(false)}><X size={20} /></button>
            <h2 style={{ marginBottom: '8px' }}>Book Program</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>Fill in your preferred schedule and location to proceed to Secure Escrow.</p>
            
            <form onSubmit={(e) => { e.preventDefault(); alert('Redirecting to Escrow Checkout...'); setShowBookingModal(false); }}>
              <div className={styles.inputGroup}>
                <label>Preferred Start Date</label>
                <input type="date" required value={bookingForm.startDate} onChange={e => setBookingForm({...bookingForm, startDate: e.target.value})} />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Preferred Time</label>
                <input type="time" required value={bookingForm.time} onChange={e => setBookingForm({...bookingForm, time: e.target.value})} />
              </div>

              <div className={styles.inputGroup}>
                <label>Location / Setup Details</label>
                <textarea 
                  placeholder={program.trainingMode === 'remote' ? "e.g. My timezone is EST, I have dumbells at home." : "e.g. Meet at local gym downtown."} 
                  required 
                  value={bookingForm.location}
                  onChange={e => setBookingForm({...bookingForm, location: e.target.value})}
                  rows={3}
                />
              </div>

              <button type="submit" className={styles.submitBookBtn}>
                Proceed to Escrow Checkout (${program.price})
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
