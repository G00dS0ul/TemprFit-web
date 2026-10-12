'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  Sparkles, 
  Dumbbell, 
  ShieldCheck, 
  Users, 
  Briefcase, 
  ArrowRight, 
  CheckCircle2, 
  Bell, 
  Compass, 
  Flame,
  Bot
} from 'lucide-react';
import styles from './ComingSoonFeature.module.css';

export default function ComingSoonFeature({
  badge = 'Coming Soon • Phase 2',
  title = 'Trainer Marketplace & Escrow',
  tagline = 'We are currently focused 100% on perfecting the Trainee experience first!',
  description = 'To ensure TemprFit provides unmatched value, we are pouring all our efforts into world-class AI form analysis, workout tracking, local gym discovery, and training routines. The 1-on-1 certified trainer marketplace, direct bookings, and escrow contracts are in active development and will launch as soon as our trainee community is fully thriving.',
  featureKey = 'trainers',
  highlights = [
    {
      icon: Dumbbell,
      title: 'Trainee First Experience',
      desc: 'All our current focus is dedicated to empowering you with smart trackers, AI coaches, and gym locators.'
    },
    {
      icon: ShieldCheck,
      title: 'Verified Elite Trainers',
      desc: 'When launched, every coach will be identity-verified with proven credentials, background checks, and certifications.'
    },
    {
      icon: Briefcase,
      title: 'Protected Milestone Escrow',
      desc: 'Guaranteed security: your payments will remain locked in escrow until your training milestones are fully satisfied.'
    }
  ]
}) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNotifyMe = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    
    // Save to local storage waitlist
    try {
      const existing = JSON.parse(localStorage.getItem('temprfit_waitlist') || '[]');
      if (!existing.includes(email)) {
        existing.push({ email, feature: featureKey, date: new Date().toISOString() });
        localStorage.setItem('temprfit_waitlist', JSON.stringify(existing));
      }
    } catch (err) {
      // Ignore
    }

    setSubscribed(true);
  };

  return (
    <div className={styles.pageWrapper}>
      <Navbar />

      <main className={styles.container}>
        <div className={styles.heroSection}>
          <div className={styles.badgePill}>
            <span className={styles.pulseDot} />
            <Sparkles size={14} className={styles.badgeIcon} />
            <span>{badge}</span>
          </div>

          <h1 className={styles.title}>
            {title}
          </h1>

          <p className={styles.tagline}>{tagline}</p>
          <p className={styles.description}>{description}</p>

          {/* Waitlist Subscription Box */}
          <div className={styles.waitlistBox}>
            {subscribed ? (
              <div className={styles.successState}>
                <CheckCircle2 size={24} className={styles.successIcon} />
                <div>
                  <h4>You are on the priority waitlist!</h4>
                  <p>We'll notify <strong>{email}</strong> the exact moment this feature goes live.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleNotifyMe} className={styles.notifyForm}>
                <div className={styles.inputWrapper}>
                  <Bell size={18} className={styles.inputIcon} />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email for early access notification..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.emailInput}
                  />
                </div>
                <button type="submit" className={styles.notifyBtn}>
                  Notify Me First
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>

          {/* Call to Action Navigation */}
          <div className={styles.actionButtons}>
            <Link href="/dashboard" className={styles.primaryCta}>
              <Flame size={18} />
              <span>Back to Trainee Home</span>
            </Link>
            <Link href="/workouts" className={styles.secondaryCta}>
              <Dumbbell size={18} />
              <span>Start a Workout</span>
            </Link>
            <Link href="/coach" className={styles.ghostCta}>
              <Bot size={18} />
              <span>Talk to AI Coach</span>
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <section className={styles.highlightsSection}>
          <div className={styles.sectionHeader}>
            <h2>Why We Are Rolling This Out in Phases</h2>
            <p>A message from the TemprFit Team</p>
          </div>

          <div className={styles.cardGrid}>
            {highlights.map((item, index) => {
              const Icon = item.icon || Sparkles;
              return (
                <div key={index} className={styles.featureCard}>
                  <div className={styles.cardIconWrapper}>
                    <Icon size={24} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Live Features Teaser */}
        <div className={styles.liveBanner}>
          <div className={styles.liveBannerText}>
            <h3>Ready to crush your goals right now?</h3>
            <p>Explore all the live features built for trainees today — workout generation, form tracking, and local gym discovery.</p>
          </div>
          <div className={styles.liveBannerActions}>
            <Link href="/gyms" className={styles.exploreLink}>
              <Compass size={16} /> Explore Gyms & Map
            </Link>
            <Link href="/explore" className={styles.exploreLink}>
              <Dumbbell size={16} /> Exercise Library
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
