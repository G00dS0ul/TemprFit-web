'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, Video, Loader2, AlertTriangle, CheckCircle2, Play } from 'lucide-react';
import { evaluateFrame, aggregateIssues, supportedExercises } from '@/lib/form-rules';
import styles from './FormCheckUpload.module.css';

// Sample roughly every 150ms rather than every animation frame — plenty
// for rule detection, much cheaper on CPU than 30-60fps landmark inference.
const SAMPLE_INTERVAL_MS = 150;

export default function FormCheckUpload({ onSaved }) {
  const [exerciseSlug, setExerciseSlug] = useState('squat');
  const [videoUrl, setVideoUrl] = useState(null);
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load MediaPipe's pose model once, lazily, only in the browser.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });
        if (!cancelled) {
          landmarkerRef.current = landmarker;
          setModelReady(true);
        }
      } catch (err) {
        console.error('[form-check] Failed to load pose model:', err);
        if (!cancelled) setModelError('Could not load the pose-detection model. Check your connection and reload.');
      }
    }
    load();
    return () => {
      cancelled = true;
      landmarkerRef.current?.close?.();
    };
  }, []);

  const handleFile = (file) => {
    if (!file) return;
    setResult(null);
    setError('');
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
  };

  const runAnalysis = async () => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    const canvas = canvasRef.current;
    if (!video || !landmarker) return;

    setAnalyzing(true);
    setResult(null);
    setError('');
    setProgress(0);

    const ctx = canvas.getContext('2d');
    const rawHits = [];
    let ruleState = {};

    await new Promise((resolve) => {
      video.currentTime = 0;
      video.onseeked = resolve;
    });

    const duration = video.duration || 0;
    let t = 0;

    // Step through the clip in fixed increments rather than playing it back
    // in real time — faster analysis and avoids relying on frame callbacks
    // that behave inconsistently across browsers.
    while (t < duration) {
      await new Promise((resolve) => {
        video.currentTime = t;
        video.onseeked = resolve;
      });

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const nowMs = performance.now();
      const detection = landmarker.detectForVideo(video, nowMs);
      const landmarks = detection?.landmarks?.[0];

      if (landmarks) {
        drawSkeleton(ctx, landmarks, canvas.width, canvas.height);
        const { issues, state } = evaluateFrame(exerciseSlug, landmarks, ruleState);
        ruleState = state;
        for (const issue of issues) {
          rawHits.push({ ...issue, timestampSeconds: t });
        }
      }

      setProgress(Math.min(100, Math.round((t / duration) * 100)));
      t += SAMPLE_INTERVAL_MS / 1000;
    }

    const aggregated = aggregateIssues(rawHits);
    setProgress(100);
    setAnalyzing(false);
    setResult({ issues: aggregated, videoDurationSeconds: duration });
  };

  const saveSession = async () => {
    if (!result) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/form-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseSlug,
          flaggedIssues: result.issues,
          videoDurationSeconds: result.videoDurationSeconds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not save this check.');
        return;
      }
      onSaved?.(data.session);
      setResult({ ...result, saved: true, session: data.session });
    } catch (err) {
      setError('Network error saving this check.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.controls}>
        <label className={styles.label}>Exercise</label>
        <select
          className={styles.select}
          value={exerciseSlug}
          onChange={(e) => {
            setExerciseSlug(e.target.value);
            setResult(null);
          }}
        >
          {supportedExercises().map((ex) => (
            <option key={ex.slug} value={ex.slug}>{ex.label}</option>
          ))}
        </select>
      </div>

      {!videoUrl && (
        <button
          type="button"
          className={styles.uploadZone}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={28} />
          <span>Upload a video of your {supportedExercises().find(e => e.slug === exerciseSlug)?.label.toLowerCase()}</span>
          <span className={styles.hint}>Analysis runs entirely in your browser — the video is never uploaded to a server.</span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className={styles.hiddenInput}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {videoUrl && (
        <div className={styles.videoWrap}>
          <video ref={videoRef} src={videoUrl} className={styles.video} controls playsInline muted />
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>
      )}

      {modelError && <div className={styles.error}><AlertTriangle size={16} />{modelError}</div>}

      {videoUrl && !result && (
        <button
          type="button"
          className={styles.analyzeBtn}
          onClick={runAnalysis}
          disabled={!modelReady || analyzing}
        >
          {!modelReady ? (
            <><Loader2 size={16} className={styles.spin} /> Loading pose model…</>
          ) : analyzing ? (
            <><Loader2 size={16} className={styles.spin} /> Analyzing… {progress}%</>
          ) : (
            <><Play size={16} /> Analyze form</>
          )}
        </button>
      )}

      {result && (
        <div className={styles.results}>
          {result.issues.length === 0 ? (
            <div className={styles.clean}>
              <CheckCircle2 size={18} />
              No repeated form issues flagged on this rep.
            </div>
          ) : (
            <ul className={styles.issueList}>
              {result.issues.map((issue) => (
                <li key={issue.issueType} className={`${styles.issue} ${styles[issue.severity]}`}>
                  <span>{issue.label}</span>
                  <span className={styles.issueMeta}>~{Math.round(issue.timestampSeconds)}s · flagged {issue.frameCount}x</span>
                </li>
              ))}
            </ul>
          )}

          {result.session?.aiSummary && (
            <div className={styles.summary}>{result.session.aiSummary}</div>
          )}

          {!result.saved && (
            <button type="button" className={styles.saveBtn} onClick={saveSession} disabled={saving}>
              {saving ? <><Loader2 size={16} className={styles.spin} /> Getting feedback…</> : 'Get AI feedback & save'}
            </button>
          )}

          <button
            type="button"
            className={styles.retryBtn}
            onClick={() => { setVideoUrl(null); setResult(null); }}
          >
            <Video size={16} /> Check another rep
          </button>
        </div>
      )}

      {error && <div className={styles.error}><AlertTriangle size={16} />{error}</div>}
    </div>
  );
}

const CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
];

function drawSkeleton(ctx, landmarks, width, height) {
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 3;
  ctx.fillStyle = '#16a34a';

  for (const [a, b] of CONNECTIONS) {
    const p1 = landmarks[a];
    const p2 = landmarks[b];
    if (!p1 || !p2) continue;
    ctx.beginPath();
    ctx.moveTo(p1.x * width, p1.y * height);
    ctx.lineTo(p2.x * width, p2.y * height);
    ctx.stroke();
  }
  for (const p of landmarks) {
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
