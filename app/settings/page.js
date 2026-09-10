'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Camera, Check, Loader2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { PRESET_AVATAR_URLS } from '@/lib/avatars';
import styles from './settings.module.css';

const GOALS = ['Lose Weight', 'Build Muscle', 'Increase Strength', 'Improve Endurance', 'General Fitness'];
const EXPERIENCES = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
const MAX_AVATAR_BYTES = 1.5 * 1024 * 1024;

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [signedIn, setSignedIn] = useState(true);
  const [form, setForm] = useState(null);
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [exerciseResults, setExerciseResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => {
        if (r.status === 401) throw new Error('signin');
        return r.json();
      })
      .then((data) => {
        setUser(data.user);
        setForm({
          username: data.user.username || '',
          goal: data.user.goal || '',
          experience: data.user.experience || '',
          weightUnit: data.user.weightUnit || 'lbs',
          avatarUrl: data.user.avatarUrl || '',
          weeklySessions: data.user.goals?.weeklySessions || 4,
          targetExerciseSlug: data.user.goals?.targetExerciseSlug || '',
          targetExerciseName: '',
          targetWeight: data.user.goals?.targetWeight ?? '',
        });
        // Resolve the saved target exercise's display name for the search box.
        if (data.user.goals?.targetExerciseSlug) {
          fetch(`/api/exercises/${data.user.goals.targetExerciseSlug}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((ex) => {
              if (ex?.exercise) {
                setExerciseQuery(ex.exercise.name);
                setForm((f) => ({ ...f, targetExerciseName: ex.exercise.name }));
              }
            })
            .catch(() => {});
        }
      })
      .catch((e) => {
        if (e.message === 'signin') setSignedIn(false);
      });
  }, []);

  useEffect(() => {
    if (!exerciseQuery || exerciseQuery === form?.targetExerciseName) {
      setExerciseResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/exercises?q=${encodeURIComponent(exerciseQuery)}`)
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((d) => setExerciseResults((d.items || []).slice(0, 6)))
        .catch(() => setExerciseResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [exerciseQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      setError('Please choose an image under 1.5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, avatarUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          goal: form.goal,
          experience: form.experience,
          weightUnit: form.weightUnit,
          avatarUrl: form.avatarUrl,
          goals: {
            weeklySessions: Number(form.weeklySessions) || 4,
            targetExerciseSlug: form.targetExerciseSlug || undefined,
            targetWeight: form.targetWeight === '' ? null : Number(form.targetWeight),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not save changes.');
        return;
      }
      setUser(data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordMessage('New passwords do not match.');
      return;
    }
    setPasswordMessage('');
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.new }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password.');
      setPasswordMessage('Password changed successfully!');
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (e) {
      setPasswordMessage(e.message);
    }
  };

  const handleVerifyEmail = async () => {
    setVerifyingEmail(true);
    try {
      const res = await fetch('/api/user/verify-email', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      }
    } finally {
      setVerifyingEmail(false);
    }
  };

  if (!signedIn) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <div className={styles.content}>
          <div className="container">
            <p className={styles.signinMsg}>
              Sign in to edit your profile. <Link href="/login" style={{ color: '#22c55e' }}>Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <div className={styles.content} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Sidebar />
      <div className={styles.content}>
        <div className="container">
          <div className={styles.header}>
            <h1>Settings</h1>
            <p>Manage your profile, photo, and goals. Everything here is saved to your account.</p>
          </div>

          <div className={styles.card}>
            <h3>Profile Photo</h3>
            <div className={styles.avatarRow}>
              <div className={styles.avatarPreview}>
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="Your avatar" />
                ) : (
                  <span>{form.username?.[0]?.toUpperCase() || '?'}</span>
                )}
              </div>
              <div>
                <button type="button" className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                  <Camera size={16} /> Upload Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarPick}
                />
                {form.avatarUrl && (
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => setForm((f) => ({ ...f, avatarUrl: '' }))}
                  >
                    Remove
                  </button>
                )}
                <p className={styles.hint}>JPG or PNG, under 1.5MB — or pick a preset avatar below.</p>
              </div>
            </div>

            <p className={styles.cardHint} style={{ marginTop: 16 }}>Or choose a preset avatar</p>
            <div className={styles.avatarGrid}>
              {PRESET_AVATAR_URLS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`${styles.avatarOption} ${form.avatarUrl === preset.url ? styles.avatarOptionSelected : ''}`}
                  onClick={() => setForm((f) => ({ ...f, avatarUrl: preset.url }))}
                  aria-label={`Use the ${preset.id} avatar`}
                >
                  <img src={preset.url} alt="" />
                </button>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <h3>Profile</h3>

            <div className={styles.field}>
              <label>Email Address</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input value={user?.email || ''} disabled style={{ flex: 1, opacity: 0.7 }} />
                {user?.emailVerified ? (
                  <span className={styles.clean} style={{ flexShrink: 0 }}><Check size={16} /> Verified</span>
                ) : (
                  <button 
                    className={styles.saveBtn} 
                    style={{ flexShrink: 0, padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)' }}
                    onClick={handleVerifyEmail}
                    disabled={verifyingEmail}
                  >
                    {verifyingEmail ? 'Sending...' : 'Verify Email'}
                  </button>
                )}
              </div>
            </div>

            <div className={styles.field}>
              <label>Username</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>

            <div className={styles.field}>
              <label>Fitness Goal</label>
              <div className={styles.optionRow}>
                {GOALS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`${styles.optionBtn} ${form.goal === g ? styles.selected : ''}`}
                    onClick={() => setForm({ ...form, goal: g })}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label>Experience Level</label>
              <div className={styles.optionRow}>
                {EXPERIENCES.map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    className={`${styles.optionBtn} ${form.experience === exp ? styles.selected : ''}`}
                    onClick={() => setForm({ ...form, experience: exp })}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label>Weight Unit</label>
              <div className={styles.optionRow}>
                {['lbs', 'kg'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    className={`${styles.optionBtn} ${form.weightUnit === u ? styles.selected : ''}`}
                    onClick={() => setForm({ ...form, weightUnit: u })}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Goals</h3>
            <p className={styles.cardHint}>These drive the progress bars on your Dashboard.</p>

            <div className={styles.field}>
              <label>Weekly Session Target</label>
              <input
                type="number"
                min="1"
                max="14"
                value={form.weeklySessions}
                onChange={(e) => setForm({ ...form, weeklySessions: e.target.value })}
              />
            </div>

            <div className={styles.field} style={{ position: 'relative' }}>
              <label>Target Lift</label>
              <input
                placeholder="Search exercises… e.g. Barbell Bench Press"
                value={exerciseQuery}
                onChange={(e) => {
                  setExerciseQuery(e.target.value);
                  setForm((f) => ({ ...f, targetExerciseSlug: '', targetExerciseName: '' }));
                }}
              />
              {exerciseResults.length > 0 && (
                <div className={styles.dropdown}>
                  {exerciseResults.map((ex) => (
                    <button
                      key={ex.slug}
                      type="button"
                      className={styles.dropdownItem}
                      onClick={() => {
                        setForm((f) => ({ ...f, targetExerciseSlug: ex.slug, targetExerciseName: ex.name }));
                        setExerciseQuery(ex.name);
                        setExerciseResults([]);
                      }}
                    >
                      {ex.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label>Target Weight ({form.weightUnit}, estimated 1RM)</label>
              <input
                type="number"
                placeholder="e.g. 225"
                value={form.targetWeight}
                onChange={(e) => setForm({ ...form, targetWeight: e.target.value })}
              />
            </div>
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={16} className={styles.spin} /> : saved ? <Check size={16} /> : null}
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save Changes'}
          </button>

          <div className={styles.card} style={{ marginTop: '40px' }}>
            <h3>Security</h3>
            <p className={styles.cardHint}>Change your account password.</p>
            
            <div className={styles.field}>
              <label>Current Password</label>
              <input
                type="password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>New Password</label>
              <input
                type="password"
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              />
            </div>

            {passwordMessage && <p className={passwordMessage.includes('successfully') ? styles.clean : styles.errorText} style={{ marginBottom: 15 }}>{passwordMessage}</p>}
            
            <button 
              className={styles.saveBtn} 
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)' }} 
              onClick={handleChangePassword}
              disabled={!passwordForm.current || !passwordForm.new || !passwordForm.confirm}
            >
              Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
