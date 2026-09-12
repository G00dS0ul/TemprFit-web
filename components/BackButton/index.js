'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import styles from './BackButton.module.css';

export default function BackButton({ className = '' }) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <button className={`${styles.backBtn} ${className}`} onClick={handleBack} aria-label="Go back">
      <ArrowLeft size={20} />
    </button>
  );
}
