'use client';

import { useState } from 'react';
import { 
  DollarSign, TrendingUp, Users, ShoppingBag, Crown, 
  Percent, Megaphone, ArrowRight, Check, Copy
} from 'lucide-react';
import styles from './page.module.css';

export default function Monetization() {
  const [copied, setCopied] = useState(false);
  const affiliateCode = 'FORGE-AFF-2024-X7K9M2';

  const revenueStreams = [
    { icon: Crown, title: 'Premium Subscriptions', revenue: '$85,000/mo', growth: '+15%', desc: 'Monthly recurring revenue from Pro & Elite plans' },
    { icon: Percent, title: 'Trainer Commissions', revenue: '$28,000/mo', growth: '+22%', desc: '5% fee on every trainer session booked' },
    { icon: Megaphone, title: 'Sponsored Content', revenue: '$12,000/mo', growth: '+8%', desc: 'Brand partnerships and featured placements' },
    { icon: ShoppingBag, title: 'Affiliate Sales', revenue: '$8,000/mo', growth: '+30%', desc: 'Supplement and equipment referral commissions' },
  ];

  const copyCode = () => {
    navigator.clipboard.writeText(affiliateCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1>Monetize with <span className={styles.gradient}>RepForge</span></h1>
          <p>Multiple revenue streams for developers, trainers, and content creators.</p>
        </div>

        <div className={styles.revenueGrid}>
          {revenueStreams.map((stream, i) => (
            <div key={i} className={styles.revenueCard}>
              <div className={styles.revenueHeader}>
                <div className={styles.revenueIcon}>
                  <stream.icon size={22} />
                </div>
                <span className={`${styles.growth} ${stream.growth.startsWith('+') ? styles.positive : styles.negative}`}>
                  <TrendingUp size={12} /> {stream.growth}
                </span>
              </div>
              <h3>{stream.title}</h3>
              <span className={styles.revenueAmount}>{stream.revenue}</span>
              <p>{stream.desc}</p>
            </div>
          ))}
        </div>

        <div className={styles.affiliateSection}>
          <div className={styles.affiliateLeft}>
            <h2>Affiliate Program</h2>
            <p>Earn 30% recurring commission for every user you refer. Get paid monthly via PayPal or crypto.</p>
            <ul className={styles.benefitsList}>
              <li><Check size={14} /> 30% lifetime recurring commission</li>
              <li><Check size={14} /> Real-time tracking dashboard</li>
              <li><Check size={14} /> Marketing assets provided</li>
              <li><Check size={14} /> Minimum payout: $50</li>
            </ul>
          </div>
          <div className={styles.affiliateRight}>
            <div className={styles.codeCard}>
              <h3>Your Referral Code</h3>
              <div className={styles.codeBox}>
                <code>{affiliateCode}</code>
                <button onClick={copyCode}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <div className={styles.affiliateStats}>
                <div>
                  <span className={styles.statValue}>234</span>
                  <span className={styles.statLabel}>Referrals</span>
                </div>
                <div>
                  <span className={styles.statValue}>$4,200</span>
                  <span className={styles.statLabel}>Earned</span>
                </div>
                <div>
                  <span className={styles.statValue}>$1,800</span>
                  <span className={styles.statLabel}>Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.trainerMonetization}>
          <h2>For Trainers</h2>
          <p>Set your own rates and keep 95% of earnings. We only take 5% to cover payment processing and escrow.</p>
          <div className={styles.trainerTiers}>
            <div className={styles.tier}>
              <h3>Starter</h3>
              <span className={styles.tierPrice}>Free</span>
              <ul>
                <li><Check size={14} /> Up to 5 clients</li>
                <li><Check size={14} /> Basic profile</li>
                <li><Check size={14} /> Standard escrow</li>
              </ul>
            </div>
            <div className={`${styles.tier} ${styles.tierPopular}`}>
              <span className={styles.tierBadge}>Popular</span>
              <h3>Pro Trainer</h3>
              <span className={styles.tierPrice}>$29/mo</span>
              <ul>
                <li><Check size={14} /> Unlimited clients</li>
                <li><Check size={14} /> Verified badge</li>
                <li><Check size={14} /> Priority listing</li>
                <li><Check size={14} /> Advanced analytics</li>
              </ul>
            </div>
            <div className={styles.tier}>
              <h3>Elite Trainer</h3>
              <span className={styles.tierPrice}>$79/mo</span>
              <ul>
                <li><Check size={14} /> Everything in Pro</li>
                <li><Check size={14} /> Featured on homepage</li>
                <li><Check size={14} /> API access</li>
                <li><Check size={14} /> Dedicated support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
