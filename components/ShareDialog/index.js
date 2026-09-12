'use client';

import { useState } from 'react';
import { X, Sparkles, Send } from 'lucide-react';
import { useToast } from '../ToastProvider';
import styles from './ShareDialog.module.css';

export default function ShareDialog({ item, type = 'workout', onClose }) {
  const [caption, setCaption] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { showToast } = useToast();

  const generateAI = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, type })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCaption(data.caption);
      showToast('Caption generated!', 'success');
    } catch (err) {
      showToast('Failed to generate caption', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      let preview = [];
      if (type === 'workout' && Array.isArray(item.exercises)) {
        preview = item.exercises.slice(0, 4).map(ex => {
          const name = ex.exercise?.name || 'Exercise';
          const sets = ex.sets?.length || 0;
          return `${name} (${sets} sets)`;
        });
        if (item.exercises.length > 4) preview.push(`...and ${item.exercises.length - 4} more`);
      }

      const res = await fetch('/api/moments/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item._id, type, caption, title: item.name, preview })
      });
      if (!res.ok) throw new Error('Failed to share');
      showToast('Shared to Moments successfully!', 'success');
      onClose();
    } catch (err) {
      showToast('Failed to share', 'error');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Share to Moments</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20}/></button>
        </div>
        
        <button className={styles.aiBtn} onClick={generateAI} disabled={generating}>
          <Sparkles size={16} />
          {generating ? 'Generating Magic...' : 'Auto-Generate AI Caption'}
        </button>

        <textarea 
          className={styles.textarea}
          placeholder="Write your own caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        <button className={styles.shareBtn} onClick={handleShare} disabled={sharing || !caption}>
          <Send size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }}/>
          {sharing ? 'Sharing...' : 'Post to Moments'}
        </button>
      </div>
    </div>
  );
}
