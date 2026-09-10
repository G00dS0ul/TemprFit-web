'use client';

import Link from 'next/link';
import { ArrowRight, Zap, ChevronRight } from 'lucide-react';
import FeatureCard from '@/components/FeatureCard';
import StatsCard from '@/components/StatsCard';
import TrainerCard from '@/components/TrainerCard';
import ForumPost from '@/components/ForumPost';
import PricingCard from '@/components/PricingCard';
import MonetizationBanner from '@/components/MonetizationBanner';
import { features, stats, trainers, forumPosts, pricingPlans } from '@/lib/data';
import styles from './about.module.css';

// The marketing sections that used to live on the homepage. The homepage is
// now a single-viewport Hero (see spec: no infinite scroll on '/') — these
// moved here rather than getting deleted, since the content and components
// are still real and useful, just not on the landing route anymore.
export default function AboutPage() {
  return (
    <div className={styles.home} style={{ paddingTop: '120px' }}>
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Features</span>
            <h2 className={styles.sectionTitle}>Everything You Need to <span className={styles.gradient}>Forge Results</span></h2>
            <p className={styles.sectionDesc}>Powerful tools designed by fitness experts and AI engineers to maximize every workout.</p>
          </div>
          <div className={styles.featuresGrid}>
            {features.map((feature, i) => (
              <FeatureCard key={feature.id} {...feature} delay={i * 100} />
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.statsSection}`}>
        <div className="container">
          <div className={styles.statsGrid}>
            {stats.map((stat, i) => (
              <StatsCard key={stat.label} {...stat} delay={i * 100} />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Trainers</span>
            <h2 className={styles.sectionTitle}>Top <span className={styles.gradient}>Certified Trainers</span></h2>
            <p className={styles.sectionDesc}>Connect with world-class trainers through our secure escrow system.</p>
          </div>
          <div className={styles.trainersGrid}>
            {trainers.map(trainer => (
              <TrainerCard key={trainer.id} trainer={trainer} />
            ))}
          </div>
          <div className={styles.sectionCta}>
            <Link href="/trainers" className={styles.linkBtn}>
              View All Trainers <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Community</span>
            <h2 className={styles.sectionTitle}>Latest from the <span className={styles.gradient}>Forum</span></h2>
            <p className={styles.sectionDesc}>Join the conversation with thousands of fitness enthusiasts.</p>
          </div>
          <div className={styles.forumGrid}>
            {forumPosts.map(post => (
              <ForumPost key={post.id} post={post} />
            ))}
          </div>
          <div className={styles.sectionCta}>
            <Link href="/forum" className={styles.linkBtn}>
              Join the Forum <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Pricing</span>
            <h2 className={styles.sectionTitle}>Choose Your <span className={styles.gradient}>Forge Plan</span></h2>
            <p className={styles.sectionDesc}>Start free and upgrade as you grow. No hidden fees.</p>
          </div>
          <div className={styles.pricingGrid}>
            {pricingPlans.map(plan => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <MonetizationBanner />
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaBox}>
            <h2>Ready to Start Your Transformation?</h2>
            <p>Join 50,000+ athletes who have already forged their path with REPForge.</p>
            <div className={styles.ctaButtons}>
              <Link href="/register" className={styles.ctaPrimary}>
                <Zap size={18} /> Get Started Free
              </Link>
              <Link href="/become-trainer" className={styles.ctaSecondary}>
                Become a Trainer <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
