'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Save, BookOpen, Trash2, CheckCircle2 } from 'lucide-react';
import MealPlanView from '@/components/MealPlanView';
import AuthGateModal from '@/components/AuthGateModal';
import styles from './diet.module.css'; // Creating new css file

export default function DietPage() {
  const [tab, setTab] = useState('saved');
  const [savedPlans, setSavedPlans] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);

  useEffect(() => {
    if (tab === 'saved') {
      loadSavedPlans();
    }
  }, [tab]);

  const loadSavedPlans = async () => {
    setLoadingSaved(true);
    try {
      const res = await fetch('/api/diet');
      if (res.status === 401) {
        setAuthGateOpen(true);
        return;
      }
      const data = await res.json();
      if (data.plans) setSavedPlans(data.plans);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSaved(false);
    }
  };

  const generate = async () => {
    setGenerating(true);
    setError('');
    setGeneratedPlan(null);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/diet/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (res.status === 401) {
        setAuthGateOpen(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not generate diet plan.');
      setGeneratedPlan(data.plan);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const savePlan = async () => {
    if (!generatedPlan) return;
    setSaving(true);
    try {
      const res = await fetch('/api/diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: JSON.stringify(generatedPlan) }),
      });
      if (res.status === 401) {
        setAuthGateOpen(true);
        return;
      }
      if (!res.ok) throw new Error('Failed to save plan.');
      setSaveSuccess(true);
      setTimeout(() => setTab('saved'), 1500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1>AI <span className={styles.gradient}>Diet Plans</span></h1>
          <p>Generate and manage your personalized nutrition plans in one place.</p>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'saved' ? styles.tabActive : ''}`}
            onClick={() => setTab('saved')}
          >
            <BookOpen size={16} /> Saved Plans
          </button>
          <button
            className={`${styles.tab} ${tab === 'generate' ? styles.tabActive : ''}`}
            onClick={() => setTab('generate')}
          >
            <Sparkles size={16} /> Generate New
          </button>
        </div>

        {tab === 'saved' && (
          <div className={styles.savedSection}>
            {loadingSaved ? (
              <p className={styles.muted}>Loading your plans...</p>
            ) : savedPlans.length === 0 ? (
              <div className={styles.empty}>
                <p>No saved plans yet. Generate one to get started!</p>
                <button className={styles.generateBtn} onClick={() => setTab('generate')}>
                  <Sparkles size={16} /> Generate Plan
                </button>
              </div>
            ) : (
              <div className={styles.plansList}>
                {savedPlans.map(plan => (
                  <div key={plan._id} className={styles.planCard}>
                    <h3>{plan.title}</h3>
                    <p className={styles.date}>{new Date(plan.createdAt).toLocaleDateString()}</p>
                    <div className={styles.planContent}>
                      <MealPlanView plan={(() => {
                        try { return JSON.parse(plan.content) }
                        catch(e) { return null }
                      })()} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'generate' && (
          <div className={styles.generateSection}>
            <div className={styles.card}>
              <h3>Let the AI design your diet</h3>
              <p>We'll use your saved preferences from the Nutrition page. You can add extra instructions below.</p>
              <textarea
                className={styles.textarea}
                placeholder="E.g., I want to focus on high protein and avoid dairy this week..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
              <button className={styles.generateBtn} onClick={generate} disabled={generating}>
                <Sparkles size={16} /> {generating ? 'Generating...' : 'Generate Plan'}
              </button>
              {error && <p className={styles.error}>{error}</p>}
            </div>

            {generatedPlan && (
              <div className={styles.resultCard}>
                <div className={styles.resultHeader}>
                  <h3>Your AI Diet Plan</h3>
                  <button className={styles.saveBtn} onClick={savePlan} disabled={saving || saveSuccess}>
                    {saveSuccess ? (
                      <><CheckCircle2 size={16} /> Saved!</>
                    ) : (
                      <><Save size={16} /> {saving ? 'Saving...' : 'Save Plan'}</>
                    )}
                  </button>
                </div>
                <div className={styles.planContent}>
                  <MealPlanView plan={generatedPlan} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <AuthGateModal
        open={authGateOpen}
        onClose={() => setAuthGateOpen(false)}
        message="Sign in to generate and save your diet plans."
      />
    </div>
  );
}
