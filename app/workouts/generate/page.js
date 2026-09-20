'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import AuthGateModal from '@/components/AuthGateModal';
import { useToast } from '@/components/ToastProvider';
import styles from './generate.module.css';

const MUSCLES = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'abdominals', 'calves'];
const EQUIPMENT = ['bodyweight', 'barbell', 'dumbbell', 'kettlebell', 'cable machine', 'machine', 'resistance band'];
const GOALS = ['strength', 'hypertrophy', 'endurance', 'fat-loss', 'power', 'flexibility', 'rehab', 'general-fitness'];

function toggle(arr, value) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export default function GenerateWorkoutPage() {
  const router = useRouter();
  const [timeMinutes, setTimeMinutes] = useState(45);
  const [goal, setGoal] = useState('hypertrophy');
  const [muscles, setMuscles] = useState([]);
  const [equipment, setEquipment] = useState(['bodyweight']);
  const [customEquipment, setCustomEquipment] = useState('');
  const [equipmentImages, setEquipmentImages] = useState([]);
  const [useAI, setUseAI] = useState(false);
  const [notes, setNotes] = useState('');
  const [injuries, setInjuries] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const { showToast } = useToast();

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const promises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve({ dataUrl: ev.target.result, type: file.type || 'image/jpeg' });
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(newImages => {
      setEquipmentImages(prev => [...prev, ...newImages]);
    });
    
    e.target.value = '';
  };

  const generate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/workouts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          timeMinutes, goal, muscles, equipment, useAI, 
          customEquipment, equipmentImages,
          notes: `Preferences: ${notes}\nInjuries/Medical: ${injuries}` 
        }),
      });
      if (res.status === 401) {
        setAuthGateOpen(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not generate a workout.');
      setResult(data);
      showToast('Workout successfully generated!', 'success');
    } catch (e) {
      setError(e.message);
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: result.name,
          goal: result.goal,
          exercises: result.exercises.map((e) => ({ exercise: e.exercise, sets: e.sets })),
        }),
      });
      if (res.status === 401) {
        setAuthGateOpen(true);
        setSaving(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save workout.');
      showToast('Workout saved!', 'success');
      router.push(`/workouts/${data.template._id}`);
    } catch (e) {
      setError(e.message);
      showToast(e.message, 'error');
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Generate a Workout</h1>
        <p className={styles.subtitle}>
          Every exercise it returns is real and already in your database. Use the rules-based generator (instant, deterministic), or let the AI Coach pick and order exercises from that same real catalogue based on your goals and recent training.
        </p>

        <div className={styles.form}>
          <label className={styles.label}>Time available: {timeMinutes} minutes</label>
          <input
            type="range"
            min="15"
            max="90"
            step="5"
            value={timeMinutes}
            onChange={(e) => setTimeMinutes(Number(e.target.value))}
            className={styles.slider}
          />

          <label className={styles.label}>Goal</label>
          <div className={styles.chipRow}>
            {GOALS.map((g) => (
              <button
                key={g}
                className={`${styles.chip} ${goal === g ? styles.chipActive : ''}`}
                onClick={() => setGoal(g)}
              >
                {g.replace('-', ' ')}
              </button>
            ))}
          </div>

          <label className={styles.label}>Target muscles (optional — leave blank for full body)</label>
          <div className={styles.chipRow}>
            {MUSCLES.map((m) => (
              <button
                key={m}
                className={`${styles.chip} ${muscles.includes(m) ? styles.chipActive : ''}`}
                onClick={() => setMuscles(toggle(muscles, m))}
              >
                {m}
              </button>
            ))}
          </div>

          <label className={styles.label}>Equipment available</label>
          <div className={styles.chipRow}>
            {EQUIPMENT.map((e) => (
              <button
                key={e}
                className={`${styles.chip} ${equipment.includes(e) ? styles.chipActive : ''}`}
                onClick={() => setEquipment(toggle(equipment, e))}
              >
                {e}
              </button>
            ))}
          </div>

          <label className={styles.label}>Other equipment or Snap a Photo (AI Mode Only)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <input 
              type="text" 
              className={styles.textarea} 
              style={{ padding: '12px' }}
              placeholder="e.g. A rusty tire, a sandbag, a pullup bar"
              value={customEquipment}
              onChange={(e) => setCustomEquipment(e.target.value)}
              disabled={!useAI}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <input 
                type="file" 
                accept="image/*" 
                multiple
                id="equipmentUpload"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
                disabled={!useAI}
              />
              <label 
                htmlFor="equipmentUpload" 
                className={`${styles.chip} ${!useAI ? styles.chipDisabled : ''}`}
                style={{ display: 'inline-flex', cursor: useAI ? 'pointer' : 'not-allowed', opacity: useAI ? 1 : 0.5 }}
              >
                📸 Snap / Upload Equipment
              </label>
              {equipmentImages.length > 0 && (
                <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                  {equipmentImages.length} Image{equipmentImages.length !== 1 ? 's' : ''} attached ✓
                  <button 
                    onClick={(e) => { e.preventDefault(); setEquipmentImages([]); }} 
                    style={{ marginLeft: '8px', color: 'var(--color-text-muted)', fontSize: '0.8rem', textDecoration: 'underline' }}
                  >
                    Clear
                  </button>
                </span>
              )}
            </div>
            {!useAI && <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>*Custom equipment requires AI-assisted mode.</span>}
          </div>

          <label className={styles.label}>Generation mode</label>
          <div className={styles.chipRow}>
            <button
              className={`${styles.chip} ${!useAI ? styles.chipActive : ''}`}
              onClick={() => setUseAI(false)}
            >
              Rules-based
            </button>
            <button
              className={`${styles.chip} ${useAI ? styles.chipActive : ''}`}
              onClick={() => setUseAI(true)}
            >
              <Sparkles size={13} style={{ marginRight: 4 }} /> AI-assisted
            </button>
          </div>
          
          <div className={styles.modeTipBox}>
            {useAI ? (
              <p><strong><Sparkles size={13} /> AI-assisted:</strong> A smart, personalized engine that analyzes your history, custom notes, and uploaded photos to intelligently build and sequence the perfect routine.</p>
            ) : (
              <p><strong>Rules-based:</strong> A fast, deterministic engine that strictly uses standard fitness algorithms to generate a balanced routine. Ignores custom text and images.</p>
            )}
          </div>

          <>
            <label className={styles.label}>Medical, Injuries, or Pain? (optional)</label>
            <textarea
              className={styles.textarea}
              placeholder="e.g. sore left shoulder, recovering from knee surgery, taking blood pressure medication"
              value={injuries}
              onChange={(e) => setInjuries(e.target.value)}
              rows={2}
            />

            <label className={styles.label}>Specific workout requests? (optional)</label>
            <textarea
              className={styles.textarea}
              placeholder="e.g. prioritize legs, short on time today, want to do supersets"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </>

          <button className={styles.generateBtn} onClick={generate} disabled={loading}>
            <Sparkles size={16} /> {loading ? 'Generating...' : 'Generate Workout'}
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {result && (
          <div className={styles.result}>
            <h2>{result.name}</h2>
            {result.generatedBy === 'ai' && result.aiReasoning && (
              <p className={styles.aiNote}><Sparkles size={13} /> {result.aiReasoning}</p>
            )}
            {result.aiFallbackReason && (
              <p className={styles.fallbackNote}>{result.aiFallbackReason}</p>
            )}
            <div className={styles.tableWrap}>
              <table className={styles.exerciseTable}>
                <thead>
                  <tr>
                    <th>Exercise</th>
                    <th>Target Volume / Sets</th>
                    <th>Targets & Alternatives</th>
                  </tr>
                </thead>
                <tbody>
                  {result.exercises.map((ex) => (
                    <tr key={ex.exercise}>
                      <td>
                        <Link href={`/explore/${ex.slug}`} className={styles.exerciseLink} target="_blank">
                          {ex.name}
                        </Link>
                      </td>
                      <td>
                        <span className={styles.setHighlight}>{ex.sets.length} sets</span> &times; {ex.sets[0]?.targetReps ? `${ex.sets[0].targetReps} reps` : `${ex.sets[0]?.targetWeight || 0}kg`}
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Rest: {ex.sets[0]?.restSeconds ? `${ex.sets[0].restSeconds}s` : '60s'}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>Targets:</span> {ex.targetMuscles?.primary}
                        </div>
                        {ex.alternatives && ex.alternatives.length > 0 && (
                          <div style={{ fontSize: '0.85rem', marginTop: '4px', color: 'var(--color-text-muted)' }}>
                            <span style={{ fontWeight: 500 }}>Alts:</span> {ex.alternatives.join(', ')}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.savePrompt}>
              <p>Do you want to save this to your workout plans?</p>
              <div className={styles.promptActions}>
                <button className={styles.saveBtn} onClick={save} disabled={saving}>
                  {saving ? 'Saving...' : 'Yes, save it'}
                </button>
                <button className={styles.discardBtn} onClick={() => setResult(null)} disabled={saving}>
                  No, discard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AuthGateModal
        open={authGateOpen}
        onClose={() => setAuthGateOpen(false)}
        message="Sign in to generate and save personalized workouts."
      />
    </div>
  );
}
