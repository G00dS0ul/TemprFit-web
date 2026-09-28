'use client';

import { useState, useEffect } from 'react';
import { Flame, ChevronDown, ShoppingCart, Loader2 } from 'lucide-react';
import styles from './MealPlanView.module.css';

const MEAL_ORDER = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };

export default function MealPlanView({ plan }) {
  const logWholeDay = async (day) => {
    setLoggingDay(true);
    try {
      for (const meal of day.meals) {
        await fetch('/api/nutrition/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mealType: meal.mealType.toLowerCase(),
            servings: 1,
            date: new Date().toISOString().split('T')[0],
            rawFood: {
              name: meal.name,
              calories: meal.calories,
              protein: meal.protein,
              carbs: meal.carbs,
              fat: meal.fat
            }
          })
        });
      }
      window.appAlert(`Successfully logged all meals for Day ${day.dayNumber}!`);
      if (day.dayNumber < 7) setOpenDay(day.dayNumber + 1);
    } catch (e) {
      window.appAlert('Failed to log day.');
    }
    setLoggingDay(false);
  };

  const logMeal = async (meal, mealId) => {
    setLoggingMeal(mealId);
    setLoggingMeal(index);
    const res = await fetch('/api/nutrition/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealType: meal.mealType.toLowerCase(),
        servings: 1,
        date: new Date().toISOString().split('T')[0],
        rawFood: {
          name: meal.name,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat
        }
      })
    });
    if (res.ok) {
      window.appAlert('Successfully logged to today\'s tracker!');
    } else {
      window.appAlert('Failed to log meal.');
    }
    setLoggingMeal(null);
  };
  const [openDay, setOpenDay] = useState(1);
  const [loggingDay, setLoggingDay] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('temprfit_ai_plan_day');
    if (saved) setOpenDay(parseInt(saved) || 1);
  }, []);

  useEffect(() => {
    localStorage.setItem('temprfit_ai_plan_day', openDay);
  }, [openDay]);
  const [loggingMeal, setLoggingMeal] = useState(null);

  if (!plan) return null;

  return (
    <div className={styles.wrap}>
      {plan.days.map((day) => {
        const meals = [...day.meals].sort((a, b) => (MEAL_ORDER[a.mealType] ?? 9) - (MEAL_ORDER[b.mealType] ?? 9));
        const dayCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
        const isOpen = openDay === day.dayNumber;

        return (
          <div key={day.dayNumber} className={styles.day}>
            <button className={styles.dayHeader} onClick={() => setOpenDay(isOpen ? null : day.dayNumber)}>
              <span>Day {day.dayNumber}</span>
              <span className={styles.dayCalories}><Flame size={13} /> {dayCalories} kcal</span>
              <ChevronDown size={16} className={isOpen ? styles.chevronOpen : ''} />
            </button>

            {isOpen && (
              <div className={styles.meals}>
                {meals.map((meal, i) => (
                  <div key={i} className={styles.meal}>
                    <div className={styles.mealTop}>
                      <span className={styles.mealType}>{meal.mealType}</span>
                      <span className={styles.mealCalories}>{meal.calories} kcal</span>
                    </div>
                    <h4 className={styles.mealName}>{meal.name}</h4>
                    {meal.description && <p className={styles.mealDesc}>{meal.description}</p>}
                    <div className={styles.mealMacros}>
                      <span>{meal.protein}g P</span>
                      <span>{meal.carbs}g C</span>
                      <span>{meal.fat}g F</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {plan.shoppingList?.length > 0 && (
        <div className={styles.shoppingList}>
          <h3 className={styles.shoppingTitle}><ShoppingCart size={16} /> Shopping list</h3>
          <ul>
            {plan.shoppingList.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <button className={styles.saveToNotesBtn} onClick={async () => {
        const text = `AI Generated Diet Plan\n\n` + plan.days.map(d => `Day ${d.dayNumber}:\n` + d.meals.map(m => `- ${m.mealType}: ${m.name} (${m.calories} kcal)`).join('\n')).join('\n\n') + `\n\nShopping List:\n${plan.shoppingList?.join(', ')}`;
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: `Meal Plan ${new Date().toISOString().slice(0, 10)}`, content: text })
        });
        if (res.ok) window.appAlert('Awesome! Saved directly to your Notes.');
      }}>
        Save Plan to Notes
      </button>
    </div>
  );
}
