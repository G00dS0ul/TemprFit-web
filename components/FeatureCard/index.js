'use client';

import { Shield, Apple, Box, Users, MessageCircle, BookOpen } from 'lucide-react';
import styles from './FeatureCard.module.css';

const iconMap = {
  shield: Shield,
  apple: Apple,
  box: Box,
  users: Users,
  'message-circle': MessageCircle,
  'book-open': BookOpen,
};

export default function FeatureCard({ title, description, icon, color, delay = 0 }) {
  const IconComponent = iconMap[icon] || Shield;

  return (
    <div 
      className={styles.card}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={styles.iconWrapper} style={{ background: `${color}15`, borderColor: `${color}30` }}>
        <IconComponent size={28} style={{ color }} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      <div className={styles.glow} style={{ background: `radial-gradient(circle, ${color}10, transparent)` }} />
    </div>
  );
}
