'use client';

import { useEffect, useState } from 'react';
import { Search, Sparkles, Settings2, Loader2, X, Trash2 } from 'lucide-react';
import FoodCard from '@/components/FoodCard';
import MacroSummary from '@/components/MacroSummary';
import MealPlanView from '@/components/MealPlanView';
import styles from './nutrition.module.css';

const TABS = [
  { id: 'log', label: 'Today' },
  { id: 'plan', label: 'AI Meal Plan' },
  { id: 'profile', label: 'Preferences' },
];

const DIETARY_PATTERNS = ['none', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'mediterranean', 'halal', 'kosher'];
const GOALS = ['lose_weight', 'maintain', 'gain_muscle', 'improve_health'];

export default function NutritionPage() {
  const [tab, setTab] = useState('log');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetch('/api/nutrition/profile')
      .then((r) => r.json())
      .then((d) => setProfile(d.profile))
      .catch(() => {});
  }, []);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1>AI <span className={styles.gradient}>Nutrition</span></h1>
          <p>Log real food with real macros, and let the AI plan your week.</p>
        </div>

        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'log' && <LogTab profile={profile} />}
        {tab === 'plan' && <PlanTab profile={profile} />}
        {tab === 'profile' && <ProfileTab profile={profile} setProfile={setProfile} />}
      </div>
    </div>
  );
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function LogTab({ profile }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [logs, setLogs] = useState([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [loggingId, setLoggingId] = useState(null);

  const loadToday = () => {
    fetch(`/api/nutrition/log?date=${todayKey()}`)
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs || []);
        setTotals(d.totals || totals);
      })
      .catch(() => {});
  };

  useEffect(() => { loadToday(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const search = async (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError('');
    try {
      const res = await fetch(`/api/nutrition/foods/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error || 'Search failed.');
        setResults([]);
      } else {
        setResults(data.foods || []);
      }
    } catch {
      setSearchError('Search failed. Check your connection and try again.');
    } finally {
      setSearching(false);
    }
  };

  const logFood = async (food, servings, mealType) => {
    setLoggingId(food._id);
    try {
      const res = await fetch('/api/nutrition/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodId: food._id, servings, mealType, date: todayKey() }),
      });
      if (res.ok) loadToday();
    } finally {
      setLoggingId(null);
    }
  };

  const deleteLog = async (id) => {
    await fetch(`/api/nutrition/log?id=${id}`, { method: 'DELETE' });
    loadToday();
  };

  return (
    <div className={styles.logGrid}>
      <div className={styles.logMain}>
        <form onSubmit={search} className={styles.searchBar}>
          <Search size={18} />
          <input
            placeholder="Search a food, e.g. 'grilled chicken' or 'oatmeal'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" disabled={searching}>
            {searching ? <Loader2 size={16} className={styles.spin} /> : 'Search'}
          </button>
        </form>

        {searchError && <p className={styles.error}>{searchError}</p>}

        {results && (
          <div className={styles.results}>
            {results.length === 0 && !searchError && <p className={styles.muted}>No matches — try a different term.</p>}
            {results.map((food) => (
              <FoodCard key={food._id || food.sourceId} food={food} onLog={logFood} logging={loggingId === food._id} />
            ))}
          </div>
        )}

        <h3 className={styles.sectionTitle}>Logged today</h3>
        {logs.length === 0 && <p className={styles.muted}>Nothing logged yet today.</p>}
        <div className={styles.loggedList}>
          {logs.map((log) => (
            <div key={log._id} className={styles.loggedItem}>
              <div>
                <span className={styles.loggedName}>{log.food?.name || 'Food'}</span>
                <span className={styles.loggedMeta}>{log.mealType} · x{log.servings} · {log.calories} kcal</span>
              </div>
              <button onClick={() => deleteLog(log._id)} className={styles.deleteBtn} aria-label="Remove entry">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.logSide}>
        <MacroSummary totals={totals} targets={profile} />
      </div>
    </div>
  );
}

function PlanTab({ profile }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [advisory, setAdvisory] = useState('');

  useEffect(() => {
    fetch('/api/nutrition/plan')
      .then((r) => r.json())
      .then((d) => setPlan(d.plan || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const generate = async () => {
    setGenerating(true);
    setError('');
    setAdvisory('');
    try {
      const res = await fetch('/api/nutrition/plan', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not generate a plan.');
      } else if (data.advisory) {
        setAdvisory(data.advisory);
      } else {
        setPlan(data.plan);
      }
    } catch {
      setError('Could not reach the AI planner. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={styles.planWrap}>
      <div className={styles.planHeader}>
        <p className={styles.muted}>
          {plan ? 'Your current 7-day plan, generated from your preferences and recent logs.' : 'No plan yet — generate one from your nutrition preferences.'}
        </p>
        <button className={styles.generateBtn} onClick={generate} disabled={generating}>
          <Sparkles size={16} /> {generating ? 'Generating…' : plan ? 'Regenerate plan' : 'Generate my plan'}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {advisory && <p className={styles.advisory}>{advisory}</p>}
      {loading && <p className={styles.muted}>Loading…</p>}
      {!loading && plan && <MealPlanView plan={plan} />}
    </div>
  );
}

function ProfileTab({ profile, setProfile }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [allergyInput, setAllergyInput] = useState('');
  const [exclusionInput, setExclusionInput] = useState('');
  const [pantryInput, setPantryInput] = useState('');

  useEffect(() => {
    setForm({
      dietaryPattern: profile?.dietaryPattern || 'none',
      goal: profile?.goal || 'maintain',
      allergies: profile?.allergies || [],
      exclusions: profile?.exclusions || [],
      pantry: profile?.pantry || [],
      calorieTarget: profile?.calorieTarget ?? '',
      proteinTarget: profile?.proteinTarget ?? '',
      carbsTarget: profile?.carbsTarget ?? '',
      fatTarget: profile?.fatTarget ?? '',
      mealsPerDay: profile?.mealsPerDay || 3,
    });
  }, [profile]);

  if (!form) return <p className={styles.muted}>Loading…</p>;

  const addTag = (field, input, setInput) => {
    const v = input.trim();
    if (!v) return;
    setForm({ ...form, [field]: [...form[field], v] });
    setInput('');
  };

  const removeTag = (field, index) => {
    setForm({ ...form, [field]: form[field].filter((_, i) => i !== index) });
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/nutrition/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
        setSaved(true);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.profileForm}>
      <div className={styles.formRow}>
        <label>Dietary pattern</label>
        <select value={form.dietaryPattern} onChange={(e) => setForm({ ...form, dietaryPattern: e.target.value })}>
          {DIETARY_PATTERNS.map((p) => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
        </select>
      </div>

      <div className={styles.formRow}>
        <label>Goal</label>
        <select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}>
          {GOALS.map((g) => <option key={g} value={g}>{g.replace('_', ' ')}</option>)}
        </select>
      </div>

      <div className={styles.formRow}>
        <label>Allergies</label>
        <div className={styles.tagInput}>
          <input
            value={allergyInput}
            onChange={(e) => setAllergyInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('allergies', allergyInput, setAllergyInput))}
            placeholder="e.g. peanuts, shellfish — press Enter"
          />
        </div>
        <div className={styles.tags}>
          {form.allergies.map((a, i) => (
            <span key={i} className={styles.tag}>{a} <button onClick={() => removeTag('allergies', i)}><X size={12} /></button></span>
          ))}
        </div>
      </div>

      <div className={styles.formRow}>
        <label>Exclusions / dislikes</label>
        <div className={styles.tagInput}>
          <input
            value={exclusionInput}
            onChange={(e) => setExclusionInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('exclusions', exclusionInput, setExclusionInput))}
            placeholder="e.g. mushrooms — press Enter"
          />
        </div>
        <div className={styles.tags}>
          {form.exclusions.map((a, i) => (
            <span key={i} className={styles.tag}>{a} <button onClick={() => removeTag('exclusions', i)}><X size={12} /></button></span>
          ))}
        </div>
      </div>

      <div className={styles.formRow}>
        <label>My Pantry / Available Ingredients</label>
        <div className={styles.tagInput}>
          <input
            value={pantryInput}
            onChange={(e) => setPantryInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('pantry', pantryInput, setPantryInput))}
            placeholder="e.g. eggs, chicken breast, rice — press Enter"
          />
        </div>
        <div className={styles.tags}>
          {form.pantry.map((a, i) => (
            <span key={i} className={styles.tag}>{a} <button onClick={() => removeTag('pantry', i)}><X size={12} /></button></span>
          ))}
        </div>
      </div>

      <div className={styles.targetsGrid}>
        <div className={styles.formRow}>
          <label>Calorie target</label>
          <input type="number" value={form.calorieTarget} onChange={(e) => setForm({ ...form, calorieTarget: e.target.value })} placeholder="e.g. 2200" />
        </div>
        <div className={styles.formRow}>
          <label>Protein target (g)</label>
          <input type="number" value={form.proteinTarget} onChange={(e) => setForm({ ...form, proteinTarget: e.target.value })} />
        </div>
        <div className={styles.formRow}>
          <label>Carbs target (g)</label>
          <input type="number" value={form.carbsTarget} onChange={(e) => setForm({ ...form, carbsTarget: e.target.value })} />
        </div>
        <div className={styles.formRow}>
          <label>Fat target (g)</label>
          <input type="number" value={form.fatTarget} onChange={(e) => setForm({ ...form, fatTarget: e.target.value })} />
        </div>
      </div>

      <div className={styles.formRow}>
        <label>Meals per day</label>
        <input type="number" min="1" max="8" value={form.mealsPerDay} onChange={(e) => setForm({ ...form, mealsPerDay: e.target.value })} />
      </div>

      <button className={styles.saveBtn} onClick={save} disabled={saving}>
        <Settings2 size={16} /> {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save preferences'}
      </button>
    </div>
  );
}
