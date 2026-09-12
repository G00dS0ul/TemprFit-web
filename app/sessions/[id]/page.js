'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Check, SkipForward, Repeat2,
  Trophy, Flame, Clock, Search, X, Play
} from 'lucide-react';
import ExercisePreview from '@/components/ExercisePreview';
import VoiceCoach from '@/components/VoiceCoach';
import styles from './session.module.css';

export default function WorkoutSessionPage() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  
  // 'PRE_SET' (ask weight), 'ACTIVE' (timer or working), 'POST_SET' (ask reps)
  const [wizardStep, setWizardStep] = useState('PRE_SET');
  
  const [restSeconds, setRestSeconds] = useState(null);
  const [activeTimerSeconds, setActiveTimerSeconds] = useState(null);
  
  const [summary, setSummary] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [replaceQuery, setReplaceQuery] = useState('');
  const [replaceResults, setReplaceResults] = useState([]);
  const [autoSpeakPrompt, setAutoSpeakPrompt] = useState('');
  
  const [tempWeight, setTempWeight] = useState('');
  const [tempReps, setTempReps] = useState('');

  const saveTimer = useRef(null);

  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.session) {
          setSession(data.session);
          // Initialize indexes
          let exIdx = 0;
          let setIdx = 0;
          for (let i = 0; i < data.session.exercises.length; i++) {
            if (!data.session.exercises[i].skipped) {
              const sets = data.session.exercises[i].sets;
              const uncompleted = sets.findIndex(s => !s.completed);
              if (uncompleted !== -1) {
                exIdx = i;
                setIdx = uncompleted;
                break;
              }
            }
          }
          setCurrentIndex(exIdx);
          setCurrentSetIndex(setIdx);
          
          const curEx = data.session.exercises[exIdx];
          if (curEx) {
            setTempWeight(curEx.sets[setIdx]?.weight || '');
            setTempReps(curEx.sets[setIdx]?.targetReps || '');
          }
        } else {
          setError(data.error || 'Session not found.');
        }
      })
      .catch(() => setError('Something went wrong.'));
  }, [id]);

  // Handle Exercise change
  useEffect(() => {
    if (!session || !session.exercises[currentIndex]) return;
    const ex = session.exercises[currentIndex];
    
    // Find first uncompleted set for this new exercise
    const uncompleted = ex.sets.findIndex(s => !s.completed);
    const newSetIdx = Math.max(0, uncompleted);
    
    setCurrentSetIndex(newSetIdx);
    setWizardStep('PRE_SET');
    setTempWeight(ex.sets[newSetIdx]?.weight || '');
    setTempReps(ex.sets[newSetIdx]?.targetReps || '');
    
    if (ex.exercise) {
      setAutoSpeakPrompt(`Alright, moving on to ${ex.exercise.name}. Let's crush this!`);
    }
  }, [currentIndex, session?.exercises?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Rest Timer
  useEffect(() => {
    if (restSeconds === null) return;
    if (restSeconds <= 0) {
      setRestSeconds(null);
      setAutoSpeakPrompt("Rest is over! Get back to it!");
      return;
    }
    if (restSeconds === 10) {
      setAutoSpeakPrompt("10 seconds left! Get in position!");
    } else if (restSeconds === 5) {
      setAutoSpeakPrompt("I have exactly 5 seconds left on my rest timer.");
    }
    const t = setTimeout(() => setRestSeconds(s => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [restSeconds]);

  // Handle Active Timer
  useEffect(() => {
    if (activeTimerSeconds === null) return;
    if (activeTimerSeconds <= 0) {
      setActiveTimerSeconds(null);
      setWizardStep('POST_SET');
      setAutoSpeakPrompt("Time's up! Great job!");
      return;
    }
    if (activeTimerSeconds === 10) {
      setAutoSpeakPrompt("10 seconds left! Hold it!");
    } else if (activeTimerSeconds === 5) {
      setAutoSpeakPrompt("I have exactly 5 seconds left on my active timer.");
    }
    const t = setTimeout(() => setActiveTimerSeconds(s => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [activeTimerSeconds]);

  const autosave = (nextExercises) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercises: nextExercises }),
      }).catch(() => {});
    }, 500);
  };

  const updateSet = (exIdx, setIdx, updates) => {
    setSession((prev) => {
      const exercises = [...prev.exercises];
      const sets = [...exercises[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], ...updates };
      exercises[exIdx] = { ...exercises[exIdx], sets };
      autosave(exercises);
      return { ...prev, exercises };
    });
  };

  const skipExercise = () => {
    setSession((prev) => {
      const exercises = [...prev.exercises];
      exercises[currentIndex] = { ...exercises[currentIndex], skipped: true };
      autosave(exercises);
      return { ...prev, exercises };
    });
    goNext();
  };

  const goNext = () => {
    if (currentIndex < session.exercises.length - 1) {
      setCurrentIndex(i => i + 1);
    }
  };
  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  };

  // Replace
  useEffect(() => {
    if (!replaceQuery.trim()) { setReplaceResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/exercises?q=${encodeURIComponent(replaceQuery)}`)
        .then((r) => r.json())
        .then((d) => setReplaceResults(d.items || []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [replaceQuery]);

  const doReplace = (newExercise) => {
    setSession((prev) => {
      const exercises = [...prev.exercises];
      exercises[currentIndex] = { ...exercises[currentIndex], exercise: newExercise, replaced: true };
      autosave(exercises);
      return { ...prev, exercises };
    });
    setReplacing(false);
    setReplaceQuery('');
    setReplaceResults([]);
  };

  const finish = async () => {
    setFinishing(true);
    try {
      const res = await fetch(`/api/sessions/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercises: session.exercises }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSummary(data);
    } catch {
      setError('Could not finish the workout.');
      setFinishing(false);
    }
  };
  
  // WIZARD ACTIONS
  const startSet = () => {
    const w = Number(tempWeight);
    if (!isNaN(w)) updateSet(currentIndex, currentSetIndex, { weight: w });
    
    const cur = session.exercises[currentIndex];
    const set = cur.sets[currentSetIndex];
    
    setWizardStep('ACTIVE');
    
    // Check if timed
    const targetStr = String(set.targetReps || '');
    if (targetStr.endsWith('s')) {
      const secs = parseInt(targetStr) || 60;
      setActiveTimerSeconds(secs);
      setAutoSpeakPrompt(`Starting timer for ${secs} seconds. Go!`);
    } else {
      setAutoSpeakPrompt(`Starting set. Target is ${targetStr} reps. Go!`);
    }
  };
  
  const finishActiveSet = () => {
    setWizardStep('POST_SET');
    
    const targetStr = String(session.exercises[currentIndex].sets[currentSetIndex].targetReps || '');
    if (!targetStr.endsWith('s')) {
      setAutoSpeakPrompt("Great job. How many reps did you hit?");
    } else {
      setAutoSpeakPrompt("Great job! You crushed that time!");
    }
  };
  
  const saveCompletedSet = () => {
    const r = Number(tempReps);
    updateSet(currentIndex, currentSetIndex, { reps: isNaN(r) ? 0 : r, completed: true });
    
    const cur = session.exercises[currentIndex];
    const isLastSet = currentSetIndex >= cur.sets.length - 1;
    
    if (isLastSet) {
       goNext();
    } else {
       const rest = cur.sets[currentSetIndex].restSeconds || 60;
       setRestSeconds(rest > 0 ? rest : null);
       setCurrentSetIndex(i => i + 1);
       setWizardStep('PRE_SET');
       setTempWeight(cur.sets[currentSetIndex + 1]?.weight || tempWeight);
       setTempReps(cur.sets[currentSetIndex + 1]?.targetReps || '');
    }
  };

  if (error) return <div className={styles.page}><div className="container"><p className={styles.error}>{error}</p></div></div>;
  if (!session) return <div className={styles.page}><div className="container"><p className={styles.loading}>Loading...</p></div></div>;

  if (summary) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.summaryCard}>
            <Trophy size={40} className={styles.summaryIcon} />
            <h1>Workout Complete</h1>
            <div className={styles.summaryStats}>
              <div><Clock size={16} /> {Math.round(summary.session.durationSeconds / 60)} min</div>
              <div><Flame size={16} /> {summary.session.totalVolume} kg total volume</div>
              {summary.session.prCount > 0 && (
                <div className={styles.prStat}><Trophy size={16} /> {summary.session.prCount} new PR{summary.session.prCount > 1 ? 's' : ''}!</div>
              )}
            </div>
            <div className={styles.summaryActions}>
              <Link href="/history" className={styles.secondaryBtn}>View History</Link>
              <Link href="/workouts" className={styles.primaryBtn}>Back to Workouts</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const current = session.exercises[currentIndex];
  const activeSet = current?.sets[currentSetIndex];
  
  // Voice Context
  const voiceContext = {
    planName: session.name,
    currentExercise: current?.exercise?.name,
    currentIndex: currentIndex + 1,
    totalExercises: session.exercises.length,
    wizardStep,
    currentSet: currentSetIndex + 1,
    totalSets: current?.sets.length,
    activeTimerSeconds
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.progressBar}>
          Exercise {currentIndex + 1} of {session.exercises.length}
        </div>

        <div className={styles.exerciseCard}>
          <div className={styles.exerciseHeader}>
            <h2>{current?.exercise?.name || 'Exercise'}</h2>
            <div className={styles.headerActions}>
              <button onClick={() => setReplacing(!replacing)} title="Replace exercise"><Repeat2 size={16} /></button>
              <button onClick={skipExercise} title="Skip exercise"><SkipForward size={16} /></button>
            </div>
          </div>
          
          {current?.exercise && (
            <div className={styles.exerciseDetails}>
              {current.exercise.media && (
                <div className={styles.exerciseMediaWrap}>
                  <ExercisePreview media={current.exercise.media} />
                </div>
              )}
              {current.exercise.instructions && current.exercise.instructions.length > 0 && (
                <div className={styles.exerciseInstructions}>
                  <h4>Instructions</h4>
                  <ol>
                    {current.exercise.instructions.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          <div style={{ margin: '20px 0' }}>
            <VoiceCoach 
              autoSpeakPrompt={autoSpeakPrompt}
              context={voiceContext} 
            />
          </div>

          {replacing && (
            <div className={styles.replaceBox}>
              <div className={styles.replaceSearchRow}>
                <Search size={14} />
                <input
                  autoFocus
                  placeholder="Search a replacement..."
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                />
                <button onClick={() => setReplacing(false)}><X size={14} /></button>
              </div>
              {replaceResults.map((ex) => (
                <button key={ex.slug} className={styles.replaceResult} onClick={() => doReplace(ex)}>
                  {ex.name}
                </button>
              ))}
            </div>
          )}
          
          <div className={styles.setIndicator}>
            {current?.sets.map((s, i) => (
              <div key={i} className={`${styles.setDot} ${s.completed ? styles.completed : ''} ${i === currentSetIndex ? styles.active : ''}`} />
            ))}
          </div>

          {/* WIZARD UI */}
          {restSeconds !== null ? (
            <div className={styles.wizardCard}>
              <div className={styles.timerCircle}>{restSeconds}</div>
              <div className={styles.wizardTitle}>Resting</div>
              <button className={styles.wizardBtn} onClick={() => setRestSeconds(0)}>
                <SkipForward size={18} /> Skip Rest
              </button>
            </div>
          ) : activeSet && wizardStep === 'PRE_SET' ? (
            <div className={styles.wizardCard}>
              <div className={styles.wizardTitle}>Set {currentSetIndex + 1} of {current.sets.length}</div>
              <div className={styles.wizardSubtitle}>Target: {activeSet.targetReps || '-'}</div>
              
              {!(current?.exercise?.equipment === 'Bodyweight' || current?.exercise?.equipment === 'None' || String(activeSet.targetReps || '').endsWith('s')) && (
                <div className={styles.wizardInputRow}>
                  <input 
                    type="number"
                    className={styles.wizardInput}
                    value={tempWeight}
                    onChange={(e) => setTempWeight(e.target.value)}
                    placeholder="Weight"
                  />
                  <span className={styles.wizardUnit}>kg</span>
                </div>
              )}
              
              <button className={styles.wizardBtn} onClick={startSet}>
                <Play size={18} /> Start Set
              </button>
            </div>
          ) : activeSet && wizardStep === 'ACTIVE' ? (
             <div className={styles.wizardCard}>
                {activeTimerSeconds !== null ? (
                  <>
                    <div className={styles.wizardTitle}>Hold It!</div>
                    <div className={styles.timerCircle}>{activeTimerSeconds}</div>
                  </>
                ) : (
                  <>
                    <div className={styles.wizardTitle}>Go! Push hard!</div>
                    <div className={styles.wizardSubtitle}>Target: {activeSet.targetReps || '-'}</div>
                  </>
                )}
                <button className={styles.wizardBtn} onClick={finishActiveSet}>
                  <Check size={18} /> Finish Set
                </button>
             </div>
          ) : activeSet && wizardStep === 'POST_SET' ? (
             <div className={styles.wizardCard}>
              <div className={styles.wizardTitle}>Great job!</div>
              
              {String(activeSet.targetReps || '').endsWith('s') ? (
                <>
                  <div className={styles.wizardSubtitle}>You held it!</div>
                  <button className={styles.wizardBtn} onClick={() => {
                    setTempReps(parseInt(activeSet.targetReps) || 0);
                    saveCompletedSet();
                  }}>
                    <Check size={18} /> Continue
                  </button>
                </>
              ) : (
                <>
                  <div className={styles.wizardSubtitle}>How many reps did you complete?</div>
                  <div className={styles.wizardInputRow}>
                    <input 
                      type="number"
                      className={styles.wizardInput}
                      value={tempReps}
                      onChange={(e) => setTempReps(e.target.value)}
                      placeholder="Reps"
                      autoFocus
                    />
                    <span className={styles.wizardUnit}>reps</span>
                  </div>
                  <button className={styles.wizardBtn} onClick={saveCompletedSet}>
                    <Check size={18} /> Save & Continue
                  </button>
                </>
              )}
             </div>
          ) : (
            <div className={styles.wizardCard}>
              <div className={styles.wizardTitle}>All sets completed!</div>
            </div>
          )}

        </div>

        <div className={styles.navRow}>
          <button className={styles.navBtn} onClick={goPrev} disabled={currentIndex === 0}>
            <ChevronLeft size={16} /> Previous
          </button>
          {currentIndex < session.exercises.length - 1 ? (
            <button className={styles.navBtn} onClick={goNext}>
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button className={styles.finishBtn} onClick={finish} disabled={finishing}>
              {finishing ? 'Finishing...' : 'Finish Workout'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
