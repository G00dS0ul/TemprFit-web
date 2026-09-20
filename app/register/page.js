'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dumbbell, Eye, EyeOff, ArrowRight, Check, User, ShieldAlert } from 'lucide-react';
import Logo3D from '@/components/Logo3D';
import AuthBackground from '@/components/AuthBackground';
import AuthBackButton from '@/components/AuthBackButton';
import styles from './page.module.css';

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export default function Register() {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '461953379526-e5ped6rrio6gn48jqufa1sa3g20792t4.apps.googleusercontent.com'}>
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </GoogleOAuthProvider>
  );
}

function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '', email: '', password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  // Countdown effect
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Google login failed.');
        setLoading(false);
        return;
      }
      router.push(data.user?.hasCompletedOnboarding ? '/dashboard' : '/onboarding');
    } catch (err) {
      setError('Could not reach the server.');
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (res.status === 201 && data.requiresVerification) {
        setNeedsVerification(true);
        setResendTimer(30); // Start 30s cooldown
        setLoading(false);
        return;
      }
      
      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }
      router.push('/onboarding');
    } catch (err) {
      setError('Could not reach the server. Is it running?');
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed.');
        setLoading(false);
        return;
      }
      router.push('/onboarding');
    } catch (err) {
      setError('Could not reach the server.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setResendLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to resend code.');
      } else {
        setResendTimer(30);
      }
    } catch (err) {
      setError('Could not reach the server.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <AuthBackButton />
      <div className={styles.bgWrapperFull}>
        <AuthBackground />
      </div>
      <div className={styles.left}>
        <div className={styles.leftContent}>
          <div style={{ marginBottom: '20px' }}>
            <Logo3D size={60} />
          </div>
          <h2>Join the Evolution of Fitness</h2>
          <p>Create your account and unlock personalized training, diet plans, and your own AI coach.</p>
          <div className={styles.benefits}>
            <div className={styles.benefit}><Check size={16} /> Free AI form checking</div>
            <div className={styles.benefit}><Check size={16} /> Personalized diet plans</div>
            <div className={styles.benefit}><Check size={16} /> 3D progress tracking</div>
            <div className={styles.benefit}><Check size={16} /> Trainer marketplace</div>
          </div>
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.formCard}>
          <form onSubmit={handleCompleteRegistration} className={styles.form}>
            <h1>Create Account</h1>
            <p>Enter your details to get started</p>
            <div className={styles.inputGroup}>
              <label>Username</label>
              <input type="text" placeholder="e.g. john_doe" required minLength={3} maxLength={24}
                pattern="[a-zA-Z0-9_.]+" title="Letters, numbers, underscores, and periods only"
                value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
            </div>
            <div className={styles.inputGroup}>
              <label>Email</label>
              <input type="email" placeholder="you@example.com" required
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className={styles.inputGroup}>
              <label>Password</label>
              <div className={styles.passwordWrapper}>
                <input type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters" required
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            {error && <p className={styles.errorText}>{error}</p>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Creating...' : 'Continue'} <ArrowRight size={16} />
              </button>
            </div>

            <div className={styles.divider}>
              <span>or continue with</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google login failed.')}
                theme="filled_black"
                shape="rectangular"
                size="large"
                text="signup_with"
              />
            </div>
          </form>

          <p className={styles.footerText}>
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
