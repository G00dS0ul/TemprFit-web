'use client';

import { useEffect, useState } from 'react';
import { Apple, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import styles from './DashboardMeals.module.css';

export default function DashboardMeals() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/nutrition/plan')
      .then((r) => r.json())
      .then((d) => setPlan(d.plan || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null; // Or a spinner

  if (!plan) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h3><Apple size={20} /> Today's Meals</h3>
          <Link href="/nutrition" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Go to Nutrition</Link>
        </div>
        <p className={styles.emptyState}>You don't have an active meal plan. Generate one in the AI Nutrition section.</p>
      </div>
    );
  }

  // Find today's day from plan. Assuming day 1 is Monday, or we can just pick day 1 as "Today" for demo purposes, 
  // or use modulo based on createdAt. Let's do a simple modulo:
  const dayIndex = (Math.floor((new Date() - new Date(plan.createdAt)) / 86400000)) % 7;
  const todayDayNumber = (dayIndex || 0) + 1; // 1 to 7
  
  const todayMeals = plan.days.find(d => d.dayNumber === todayDayNumber)?.meals || [];
  const completedMeals = plan.completedMeals || [];

  const toggleMeal = async (mealName, isCompleted) => {
    // Optimistic update
    const newCompleted = isCompleted 
      ? completedMeals.filter(m => !(m.dayNumber === todayDayNumber && m.mealName === mealName))
      : [...completedMeals, { dayNumber: todayDayNumber, mealName }];
    
    setPlan(prev => ({ ...prev, completedMeals: newCompleted }));

    try {
      await fetch('/api/nutrition/plan/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayNumber: todayDayNumber, mealName, completed: !isCompleted })
      });
    } catch (e) {
      console.error(e);
      // Revert if failed
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3><Apple size={20} /> Today's Meals (Day {todayDayNumber})</h3>
        <Link href="/nutrition" style={{ color: 'var(--color-primary)', fontSize: '0.9rem' }}>Manage Plan</Link>
      </div>
      
      <div className={styles.mealList}>
        {todayMeals.map(meal => {
          const isCompleted = completedMeals.some(m => m.dayNumber === todayDayNumber && m.mealName === meal.name);
          return (
            <div 
              key={meal.name} 
              className={`${styles.mealItem} ${isCompleted ? styles.completed : ''}`}
              onClick={() => toggleMeal(meal.name, isCompleted)}
            >
              <div className={styles.checkbox}>
                <Check size={16} strokeWidth={3} />
              </div>
              <div className={styles.mealInfo}>
                <div className={styles.mealType}>{meal.mealType}</div>
                <h4 className={styles.mealName}>{meal.name}</h4>
                <div className={styles.mealMacros}>
                  <span>{meal.calories} kcal</span>
                  <span>{meal.protein}g P</span>
                  <span>{meal.carbs}g C</span>
                  <span>{meal.fat}g F</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
