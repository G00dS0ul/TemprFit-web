'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dumbbell, Eye, EyeOff, ArrowRight, Check, User, ShieldAlert } from 'lucide-react';
import Logo3D from '@/components/Logo3D';
import AnimatedBackground from '@/components/AnimatedBackground';
import styles from './page.module.css';

export default function Register() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    role: '', 
    username: '', email: '', password: '',
    age: '', sex: '', heardAboutUs: '',
    goal: '', experience: '',
    weightUnit: 'lbs', startingWeight: '', heightUnit: 'cm', heightCm: '', heightFt: '', heightIn: '',
    bio: '', specialties: '', price: '50', location: 'Remote', trainingMode: 'remote'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isTrainer = formData.role === 'trainer';
  const TOTAL_STEPS = isTrainer ? 3 : 6;

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

      let payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role || 'user',
      };

      if (isTrainer) {
        payload.trainerInfo = {
          bio: formData.bio,
          specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean),
          price: parseInt(formData.price, 10) || 50,
          location: formData.location || 'Remote',
          trainingMode: formData.trainingMode || 'remote',
          isApproved: false,
        };
      } else {
        payload = {
          ...payload,
          age: formData.age ? parseInt(formData.age, 10) : null,
          sex: formData.sex,
          heardAboutUs: formData.heardAboutUs,
          goal: formData.goal,
          experience: formData.experience,
          weightUnit: formData.weightUnit,
          startingWeight: formData.startingWeight ? parseFloat(formData.startingWeight) : null,
          heightCm,
        };
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }
      
      router.push(isTrainer ? '/trainer-dashboard' : '/dashboard');
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
              <h1>Choose your path</h1>
              <p>Step 1 of {TOTAL_STEPS} - Are you here to train, or to coach others?</p>
              <div className={styles.optionsGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
                <button
                  type="button"
                  className={`${styles.optionBtn} ${formData.role === 'user' ? styles.selected : ''}`}
                  onClick={() => setFormData({...formData, role: 'user'})}
                  style={{ height: '120px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  <User size={24} />
                  <span><strong>Trainee</strong><br/><small style={{opacity:0.7}}>Personal development</small></span>
                </button>
                <button
                  type="button"
                  className={`${styles.optionBtn} ${formData.role === 'trainer' ? styles.selected : ''}`}
                  onClick={() => setFormData({...formData, role: 'trainer'})}
                  style={{ height: '120px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  <Dumbbell size={24} />
                  <span><strong>Trainer</strong><br/><small style={{opacity:0.7}}>Coach clients & earn</small></span>
                </button>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={!formData.role}>
                Continue <ArrowRight size={16} />
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <h1>Create Account</h1>
              <p>Step 2 of {TOTAL_STEPS} - Basic Info</p>
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
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className={styles.backBtn} onClick={() => setStep(step - 1)}>Back</button>
                <button type="submit" className={styles.submitBtn}>Continue <ArrowRight size={16} /></button>
              </div>
            </form>
          )}

          {step === 3 && isTrainer && (
            <div className={styles.form}>
              <h1>Trainer Profile</h1>
              <p>Step 3 of {TOTAL_STEPS} - Set up your coaching profile</p>
              
              <div className={styles.inputGroup}>
                <label>Specialties (comma separated)</label>
                <input type="text" placeholder="e.g. Hypertrophy, Powerlifting, Yoga" required
                  value={formData.specialties} onChange={e => setFormData({...formData, specialties: e.target.value})} />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Short Bio</label>
                <textarea 
                  placeholder="Tell clients about your experience..." 
                  required
                  rows={3}
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', resize: 'none' }}
                  value={formData.bio} 
                  onChange={e => setFormData({...formData, bio: e.target.value})} 
                />
              </div>

              <div className={styles.optionsGrid} style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '16px' }}>
                <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                  <label>Session Price ($)</label>
                  <input type="number" placeholder="50" required min={5}
                    value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                  <label>Location</label>
                  <input type="text" placeholder="e.g. Remote, NYC, London" required
                    value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Training Mode</label>
                <div className={styles.optionsGrid} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  {['remote', 'physical', 'hybrid'].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      style={{ textTransform: 'capitalize', padding: '8px' }}
                      className={`${styles.optionBtn} ${formData.trainingMode === mode ? styles.selected : ''}`}
                      onClick={() => setFormData({...formData, trainingMode: mode})}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                <ShieldAlert size={16} style={{ display: 'inline', verticalAlign: '-3px', marginRight: '6px', color: '#3b82f6' }} />
                <strong>Note on Payments:</strong> All sessions are booked securely via Escrow. A 15% platform fee will be deducted from your payout. Your profile will be manually reviewed by an Admin before it goes live.
              </div>

              {error && <p className={styles.errorText}>{error}</p>}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className={styles.backBtn} onClick={() => setStep(step - 1)} disabled={loading}>Back</button>
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={handleCompleteRegistration}
                  disabled={loading || !formData.specialties || !formData.bio}
                >
                  {loading ? 'Creating account…' : 'Complete'} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && !isTrainer && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <h1>About You</h1>
              <p>Step 3 of {TOTAL_STEPS} - Helps us personalize TemprFit for you</p>
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
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className={styles.backBtn} onClick={() => setStep(step - 1)}>Back</button>
                <button type="submit" className={styles.submitBtn} disabled={!formData.age || !formData.sex || !formData.heardAboutUs}>
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {step === 4 && !isTrainer && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <h1>Your Goal</h1>
              <p>Step 4 of {TOTAL_STEPS} - Fitness Goals</p>
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
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className={styles.backBtn} onClick={() => setStep(step - 1)}>Back</button>
                <button type="submit" className={styles.submitBtn} disabled={!formData.goal}>
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {step === 5 && !isTrainer && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <h1>Almost Done!</h1>
              <p>Step 5 of {TOTAL_STEPS} - Experience Level</p>
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
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className={styles.backBtn} onClick={() => setStep(step - 1)}>Back</button>
                <button type="submit" className={styles.submitBtn} disabled={!formData.experience}>
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {step === 6 && !isTrainer && (
            <div className={styles.form}>
              <h1>Body Stats</h1>
              <p>Step 6 of {TOTAL_STEPS} - Optional, helps personalize your dashboard and progress charts. Skip if you&apos;d rather add this later in Settings.</p>

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
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className={styles.backBtn} onClick={() => setStep(step - 1)} disabled={loading}>Back</button>
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={handleCompleteRegistration}
                  disabled={loading}
                >
                  {loading ? 'Creating account…' : 'Complete'} <ArrowRight size={16} />
                </button>
              </div>
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
