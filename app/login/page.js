'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dumbbell, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Logo3D from '@/components/Logo3D';
import AuthBackground from '@/components/AuthBackground';
import AuthBackButton from '@/components/AuthBackButton';
import styles from './page.module.css';

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.');
        setLoading(false);
        return;
      }
      const next = searchParams.get('next');
      let defaultRoute = '/dashboard';
      if (data.user?.role === 'trainer') {
        defaultRoute = '/trainer-dashboard';
      } else if (data.user?.role === 'admin') {
        defaultRoute = '/admin';
      }
      router.push(next && next.startsWith('/') ? next : defaultRoute);
    } catch (err) {
      setError('Could not reach the server. Is it running?');
      setLoading(false);
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
          <h2>Welcome Back to TemprFit</h2>
          <p>Sign in to continue your fitness journey with AI-powered coaching.</p>
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <div className={styles.logoSmall}>
              <Dumbbell size={24} />
            </div>
            <h1>Sign In</h1>
            <p>Enter your credentials to access your account</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Password</label>
              <div className={styles.passwordWrapper}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className={styles.options}>
              <label className={styles.remember}>
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link href="#">Forgot password?</Link>
            </div>

            {error && <p className={styles.errorText}>{error}</p>}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'} <ArrowRight size={16} />
            </button>
          </form>

          <div className={styles.divider}>
            <span>or continue with</span>
          </div>

          <div className={styles.socialButtons}>
            <button className={styles.socialBtn}>Google</button>
            <button className={styles.socialBtn}>Apple</button>
          </div>

          <p className={styles.footerText}>
            Don't have an account? <Link href="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
