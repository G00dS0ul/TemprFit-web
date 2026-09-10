'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Flame, ImageOff, Plus } from 'lucide-react';
import styles from './FoodCard.module.css';

export default function FoodCard({ food, onLog, logging }) {
  const [servings, setServings] = useState(1);
  const [mealType, setMealType] = useState('snack');

  const scaled = {
    calories: Math.round((food.calories || 0) * servings),
    protein: Math.round((food.protein || 0) * servings * 10) / 10,
    carbs: Math.round((food.carbs || 0) * servings * 10) / 10,
    fat: Math.round((food.fat || 0) * servings * 10) / 10,
  };

  return (
    <div className={styles.card}>
      <div className={styles.imageWrap}>
        {food.imageUrl ? (
          <Image src={food.imageUrl} alt={food.name} fill sizes="120px" className={styles.image} />
        ) : (
          <div className={styles.imageFallback}>
            <ImageOff size={22} />
          </div>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.nameRow}>
          <h4 className={styles.name}>{food.name}</h4>
          <span className={styles.source}>{food.source}</span>
        </div>

        <div className={styles.macros}>
          <span className={styles.calories}><Flame size={13} /> {scaled.calories} kcal</span>
          <span>{scaled.protein}g P</span>
          <span>{scaled.carbs}g C</span>
          <span>{scaled.fat}g F</span>
        </div>

        {food.imageSource === 'unsplash' && food.imageAttribution?.photographerName && (
          <a
            href={food.imageAttribution.photographerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.attribution}
          >
            Photo: {food.imageAttribution.photographerName} / Unsplash
          </a>
        )}

        <div className={styles.controls}>
          <input
            type="number"
            min="0.25"
            step="0.25"
            value={servings}
            onChange={(e) => setServings(parseFloat(e.target.value) || 1)}
            className={styles.servingsInput}
            aria-label="Servings"
          />
          <select value={mealType} onChange={(e) => setMealType(e.target.value)} className={styles.mealSelect}>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
          <button
            className={styles.logBtn}
            onClick={() => onLog(food, servings, mealType)}
            disabled={logging}
          >
            <Plus size={15} /> {logging ? 'Adding…' : 'Log'}
          </button>
        </div>
      </div>
    </div>
  );
}
