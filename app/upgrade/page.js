'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Check, Zap, Crown, ArrowRight, Loader2 } from 'lucide-react';
import AnimatedBackground from '@/components/AnimatedBackground';
import styles from './page.module.css'; // We'll create this CSS next

export default function UpgradePage() {
  const router = useRouter();
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userPlan, setUserPlan] = useState('free');
  const [isTrainer, setIsTrainer] = useState(false);

  // Fetch the user's current plan on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data?.user) {
          setUserPlan(data.user.plan || 'free');
          if (data.user.role === 'trainer') setIsTrainer(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/coupon/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to apply coupon');
      } else {
        setSuccess(`Success! Your account has been upgraded to the ${data.plan.toUpperCase()} plan.`);
        setUserPlan(data.plan);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFlutterwaveCheckout = async (plan, price) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan, 
          amount: price, 
          type: plan === 'Boost' ? 'boost' : 'subscription' 
        }),
      });
      const data = await res.json();

      if (res.ok && data.link) {
        window.location.href = data.link; // Redirect to Flutterwave checkout
      } else {
        setError(data.error || 'Failed to initialize payment gateway.');
        setLoading(false);
      }
    } catch (err) {
      setError('Network error connecting to payment gateway.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgWrapper}>
        <AnimatedBackground />
      </div>
      
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className={styles.header}>
          <h1>Upgrade Your Experience</h1>
          <p>Choose the plan that fits your goals. Unlock AI coaching, advanced analytics, and priority booking.</p>
        </div>

        {error && <div className={styles.alertError}>{error}</div>}
        {success && <div className={styles.alertSuccess}>{success}</div>}

        {isTrainer && (
          <div className={styles.couponSection} style={{ marginBottom: '2rem', border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.05)' }}>
            <div className={styles.couponCard}>
              <h3><Zap size={20} style={{ color: '#f59e0b', verticalAlign: 'middle', marginRight: '8px' }}/>Boost Your Profile</h3>
              <p>Get featured at the top of the Trainers directory for 7 days to attract more clients.</p>
              <button 
                className={styles.actionBtnSolid}
                style={{ width: '100%', marginTop: '16px', background: '#f59e0b' }}
                onClick={() => handleFlutterwaveCheckout('Boost', 4.99)}
                disabled={loading}
              >
                {loading ? <Loader2 size={16} className={styles.spin} /> : 'Boost for $4.99'}
              </button>
            </div>
          </div>
        )}

        <div className={styles.couponSection}>
          <div className={styles.couponCard}>
            <h3>Have a coupon code?</h3>
            <p>Enter your code below to instantly unlock premium features.</p>
            <form onSubmit={handleApplyCoupon} className={styles.couponForm}>
              <input 
                type="text" 
                placeholder="Input your coupon codes" 
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                required
              />
              <button type="submit" disabled={loading || !couponCode}>
                {loading ? <Loader2 size={16} className={styles.spin} /> : 'Apply Code'}
              </button>
            </form>
          </div>
        </div>

        <div className={styles.pricingGrid}>
          {/* FREE TIER */}
          <div className={styles.pricingCard}>
            <div className={styles.tierIcon}><Shield size={24} /></div>
            <h3>Free</h3>
            <div className={styles.price}>$0<span>/mo</span></div>
            <p className={styles.tierDesc}>The essentials to start your fitness journey.</p>
            <ul className={styles.featureList}>
              <li><Check size={16} /> Access to Exercise Library</li>
              <li><Check size={16} /> Manual workout logging</li>
              <li><Check size={16} /> Basic progress tracking (30 days)</li>
              <li><Check size={16} /> 3 AI Form Checks per month</li>
            </ul>
            <button className={styles.actionBtnOutline} disabled>
              {userPlan === 'free' ? 'Current Plan' : 'Included'}
            </button>
          </div>

          {/* PRO TIER */}
          <div className={`${styles.pricingCard} ${styles.popular}`}>
            <div className={styles.popularBadge}>Most Popular</div>
            <div className={styles.tierIcon} style={{ color: 'var(--color-primary)' }}><Zap size={24} /></div>
            <h3>Pro</h3>
            <div className={styles.price}>$9.99<span>/mo</span></div>
            <p className={styles.tierDesc}>Supercharge your training with AI.</p>
            <ul className={styles.featureList}>
              <li><Check size={16} /> <strong>Unlimited</strong> AI Workout Generation</li>
              <li><Check size={16} /> AI Diet & Nutrition Meal Planning</li>
              <li><Check size={16} /> <strong>Unlimited</strong> AI Form Checks & Chat</li>
              <li><Check size={16} /> All-time progress history</li>
              <li><Check size={16} /> Community Forum Access</li>
            </ul>
            <button 
              className={userPlan === 'pro' ? styles.actionBtnOutline : styles.actionBtnSolid} 
              onClick={() => handleFlutterwaveCheckout('Pro', 9.99)}
              disabled={userPlan === 'pro' || userPlan === 'max'}
            >
              {userPlan === 'pro' ? 'Current Plan' : userPlan === 'max' ? 'Included in Max' : 'Upgrade to Pro'} <ArrowRight size={16} />
            </button>
          </div>

          {/* MAX TIER */}
          <div className={styles.pricingCard}>
            <div className={styles.tierIcon} style={{ color: 'gold' }}><Crown size={24} /></div>
            <h3>Max</h3>
            <div className={styles.price}>$19.99<span>/mo</span></div>
            <p className={styles.tierDesc}>The ultimate fitness experience and priority access.</p>
            <ul className={styles.featureList}>
              <li><Check size={16} /> <strong>Everything in Pro</strong></li>
              <li><Check size={16} /> Priority 1-on-1 Trainer Booking</li>
              <li><Check size={16} /> Weekly Personalized AI Check-ins</li>
              <li><Check size={16} /> Ad-free experience</li>
              <li><Check size={16} /> Early access to new features</li>
            </ul>
            <button 
              className={styles.actionBtnOutline} 
              onClick={() => handleFlutterwaveCheckout('Max', 19.99)}
              disabled={userPlan === 'max'}
            >
              {userPlan === 'max' ? 'Current Plan' : 'Upgrade to Max'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
