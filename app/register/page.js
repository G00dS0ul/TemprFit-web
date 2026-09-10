'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dumbbell, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import Logo3D from '@/components/Logo3D';
import AnimatedBackground from '@/components/AnimatedBackground';
import styles from './page.module.css';

export default function Register() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '', email: '', password: '',
    age: '', sex: '', heardAboutUs: '',
    goal: '', experience: '',
    weightUnit: 'lbs', startingWeight: '', heightUnit: 'cm', heightCm: '', heightFt: '', heightIn: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const goals = ['Lose Weight', 'Build Muscle', 'Increase Strength', 'Improve Endurance', 'General Fitness'];
  const experiences = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
  const sexOptions = [
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];
  const heardAboutOptions = [
    'Social Media', 'Friend / Family', 'Search Engine', 'App Store', 'Influencer / Creator', 'Other',
  ];
  const TOTAL_STEPS = 5;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleCompleteRegistration = async () => {
    setError('');
    setLoading(true);
    try {
      const heightCm = formData.heightUnit === 'cm'
        ? (parseFloat(formData.heightCm) || null)
        : (() => {
            const ft = parseFloat(formData.heightFt) || 0;
            const inch = parseFloat(formData.heightIn) || 0;
            const total = ft * 30.48 + inch * 2.54;
            return total > 0 ? Math.round(total * 10) / 10 : null;
          })();

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          age: formData.age ? parseInt(formData.age, 10) : null,
          sex: formData.sex,
          heardAboutUs: formData.heardAboutUs,
          goal: formData.goal,
          experience: formData.experience,
          weightUnit: formData.weightUnit,
          startingWeight: formData.startingWeight ? parseFloat(formData.startingWeight) : null,
          heightCm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }
      router.push('/dashboard');
    } catch (err) {
      setError('Could not reach the server. Is it running?');
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.bgWrapper}>
          <AnimatedBackground />
        </div>
        <div className={styles.leftContent}>
          <Logo3D size={120} />
          <h2>Join the Forge</h2>
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
          <div className={styles.progress}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(s => (
              <div key={s} className={`${styles.step} ${s <= step ? styles.activeStep : ''}`} />
            ))}
          </div>

          {step === 1 && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <h1>Create Account</h1>
              <p>Step 1 of {TOTAL_STEPS} - Basic Info</p>
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
              <button type="submit" className={styles.submitBtn}>Continue <ArrowRight size={16} /></button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <h1>About You</h1>
              <p>Step 2 of {TOTAL_STEPS} - Helps us personalize REPForge for you</p>
              <div className={styles.inputGroup}>
                <label>Age</label>
                <input type="number" placeholder="e.g. 27" required min={13} max={120}
                  value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
              </div>
              <div className={styles.inputGroup}>
                <label>Sex</label>
                <div className={styles.optionsGrid}>
                  {sexOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.optionBtn} ${formData.sex === opt.value ? styles.selected : ''}`}
                      onClick={() => setFormData({...formData, sex: opt.value})}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>How did you hear about us?</label>
                <div className={styles.optionsGrid}>
                  {heardAboutOptions.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      className={`${styles.optionBtn} ${formData.heardAboutUs === opt ? styles.selected : ''}`}
                      onClick={() => setFormData({...formData, heardAboutUs: opt})}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={!formData.age || !formData.sex || !formData.heardAboutUs}>
                Continue <ArrowRight size={16} />
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <h1>Your Goal</h1>
              <p>Step 3 of {TOTAL_STEPS} - Fitness Goals</p>
              <div className={styles.optionsGrid}>
                {goals.map(goal => (
                  <button
                    key={goal}
                    type="button"
                    className={`${styles.optionBtn} ${formData.goal === goal ? styles.selected : ''}`}
                    onClick={() => setFormData({...formData, goal})}
                  >
                    {goal}
                  </button>
                ))}
              </div>
              <button type="submit" className={styles.submitBtn} disabled={!formData.goal}>
                Continue <ArrowRight size={16} />
              </button>
            </form>
          )}

          {step === 4 && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <h1>Almost Done!</h1>
              <p>Step 4 of {TOTAL_STEPS} - Experience Level</p>
              <div className={styles.optionsGrid}>
                {experiences.map(exp => (
                  <button
                    key={exp}
                    type="button"
                    className={`${styles.optionBtn} ${formData.experience === exp ? styles.selected : ''}`}
                    onClick={() => setFormData({...formData, experience: exp})}
                  >
                    {exp}
                  </button>
                ))}
              </div>
              <button type="submit" className={styles.submitBtn} disabled={!formData.experience}>
                Continue <ArrowRight size={16} />
              </button>
            </form>
          )}

          {step === 5 && (
            <div className={styles.form}>
              <h1>Body Stats</h1>
              <p>Step 5 of {TOTAL_STEPS} - Optional, helps personalize your dashboard and progress charts. Skip if you&apos;d rather add this later in Settings.</p>

              <div className={styles.inputGroup}>
                <label>Starting Weight</label>
                <div className={styles.unitRow}>
                  <input
                    type="number"
                    placeholder="e.g. 165"
                    value={formData.startingWeight}
                    onChange={e => setFormData({...formData, startingWeight: e.target.value})}
                  />
                  <div className={styles.unitToggle}>
                    {['lbs', 'kg'].map(u => (
                      <button
                        key={u}
                        type="button"
                        className={formData.weightUnit === u ? styles.unitActive : ''}
                        onClick={() => setFormData({...formData, weightUnit: u})}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Height</label>
                <div className={styles.unitToggle} style={{ marginBottom: 8 }}>
                  {['cm', 'ft'].map(u => (
                    <button
                      key={u}
                      type="button"
                      className={formData.heightUnit === u ? styles.unitActive : ''}
                      onClick={() => setFormData({...formData, heightUnit: u})}
                    >
                      {u === 'cm' ? 'cm' : 'ft/in'}
                    </button>
                  ))}
                </div>
                {formData.heightUnit === 'cm' ? (
                  <input
                    type="number"
                    placeholder="e.g. 178"
                    value={formData.heightCm}
                    onChange={e => setFormData({...formData, heightCm: e.target.value})}
                  />
                ) : (
                  <div className={styles.unitRow}>
                    <input
                      type="number"
                      placeholder="ft"
                      value={formData.heightFt}
                      onChange={e => setFormData({...formData, heightFt: e.target.value})}
                    />
                    <input
                      type="number"
                      placeholder="in"
                      value={formData.heightIn}
                      onChange={e => setFormData({...formData, heightIn: e.target.value})}
                    />
                  </div>
                )}
              </div>

              {error && <p className={styles.errorText}>{error}</p>}
              <button
                type="button"
                className={styles.submitBtn}
                onClick={handleCompleteRegistration}
                disabled={loading}
              >
                {loading ? 'Creating account…' : 'Complete Registration'} <ArrowRight size={16} />
              </button>
            </div>
          )}

          <p className={styles.footerText}>
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
