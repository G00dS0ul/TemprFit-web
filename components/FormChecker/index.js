'use client';

import { useState } from 'react';
import { Upload, Check, AlertTriangle, Camera, Video } from 'lucide-react';
import styles from './FormChecker.module.css';

export default function FormChecker() {
  const [uploaded, setUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const handleUpload = () => {
    setUploaded(true);
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setResults({
        score: 87,
        issues: [
          { part: 'Lower Back', status: 'good', tip: 'Maintain neutral spine' },
          { part: 'Knees', status: 'warning', tip: 'Keep knees tracking over toes' },
          { part: 'Shoulders', status: 'good', tip: 'Retract scapula' },
          { part: 'Hips', status: 'good', tip: 'Hinge at hips first' },
        ],
        aiFeedback: 'Great form overall! Focus on knee alignment during the eccentric phase.',
      });
    }, 2500);
  };

  return (
    <div className={styles.container}>
      <div className={styles.uploadArea}>
        {!uploaded ? (
          <div className={styles.dropzone} onClick={handleUpload}>
            <div className={styles.uploadIcon}>
              <Upload size={40} />
            </div>
            <h3>Upload Your Workout Video</h3>
            <p>Drag & drop or click to upload. AI will analyze your form in real-time.</p>
            <div className={styles.formatTags}>
              <span><Video size={14} /> MP4, MOV</span>
              <span><Camera size={14} /> Up to 50MB</span>
            </div>
          </div>
        ) : analyzing ? (
          <div className={styles.analyzing}>
            <div className={styles.spinner} />
            <h3>AI Analyzing Your Form...</h3>
            <p>Detecting joint angles, posture, and movement patterns</p>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} />
            </div>
          </div>
        ) : results ? (
          <div className={styles.results}>
            <div className={styles.scoreCircle}>
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#22c55e" strokeWidth="8"
                  strokeDasharray={`${results.score * 2.83} 283`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className={styles.scoreValue}>{results.score}</div>
            </div>

            <div className={styles.issues}>
              {results.issues.map((issue, i) => (
                <div key={i} className={`${styles.issue} ${styles[issue.status]}`}>
                  {issue.status === 'good' ? <Check size={16} /> : <AlertTriangle size={16} />}
                  <div>
                    <span className={styles.issuePart}>{issue.part}</span>
                    <span className={styles.issueTip}>{issue.tip}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.aiFeedback}>
              <span className={styles.aiLabel}>🤖 AI Feedback</span>
              <p>{results.aiFeedback}</p>
            </div>

            <button className={styles.retryBtn} onClick={() => { setUploaded(false); setResults(null); }}>
              Check Another Video
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
