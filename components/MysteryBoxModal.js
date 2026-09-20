'use client';

import { useState } from 'react';
import { Package, Sparkles, X, Gift } from 'lucide-react';
import styles from './MysteryBoxModal.module.css';

export default function MysteryBoxModal({ isOpen, onClose, onOpenBox }) {
  const [opening, setOpening] = useState(false);
  const [reward, setReward] = useState(null);

  if (!isOpen) return null;

  const handleOpen = async () => {
    setOpening(true);
    
    // Simulate API call to roll for reward
    try {
      const res = await fetch('/api/user/mysterybox', { method: 'POST' });
      const data = await res.json();
      
      // Artificial delay for suspense
      setTimeout(() => {
        if (data.success) {
          setReward(data.reward);
        } else {
          setReward({ type: 'xp', value: 100, name: '100 XP' }); // Fallback
        }
        setOpening(false);
      }, 2000);
    } catch (e) {
      setTimeout(() => {
        setReward({ type: 'xp', value: 100, name: '100 XP' });
        setOpening(false);
      }, 2000);
    }
  };

  const handleClose = () => {
    if (reward && onOpenBox) {
      onOpenBox(reward);
    }
    setReward(null);
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {reward && (
          <button className={styles.closeBtn} onClick={handleClose}>
            <X size={20} />
          </button>
        )}
        
        {!reward ? (
          <>
            <div className={`${styles.boxWrap} ${opening ? styles.shaking : ''}`}>
              <Package size={80} className={styles.boxIcon} />
            </div>
            <h2 className={styles.title}>Mystery Box Earned!</h2>
            <p className={styles.desc}>
              You hit a major milestone! Open your Mystery Box to reveal your variable reward.
            </p>
            <button 
              className={styles.openBtn} 
              onClick={handleOpen}
              disabled={opening}
            >
              {opening ? 'Unlocking...' : 'Open Box'}
            </button>
          </>
        ) : (
          <div className={styles.rewardWrap}>
            <div className={styles.rewardIconWrap}>
              <Gift size={60} className={styles.rewardIcon} />
              <Sparkles size={24} className={styles.sparkle1} />
              <Sparkles size={24} className={styles.sparkle2} />
            </div>
            <h2 className={styles.title}>Reward Unlocked!</h2>
            <div className={styles.rewardValue}>
              {reward.name}
            </div>
            <p className={styles.desc}>
              This has been added to your account! Keep up the great work.
            </p>
            <button className={styles.openBtn} onClick={handleClose}>
              Claim & Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
