'use client';
import React, { useMemo, useState } from 'react';
import styles from './ActivityHeatmap.module.css';

export default function ActivityHeatmap({ data = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [waterLogs, setWaterLogs] = useState({});
  const [sleepLogs, setSleepLogs] = useState({});

  React.useEffect(() => {
    try {
      const savedWater = JSON.parse(localStorage.getItem('temprfit_water_logs') || '[]');
      const wMap = {};
      savedWater.forEach(l => wMap[l.date] = l.amountMl);
      setWaterLogs(wMap);

      const savedSleep = JSON.parse(localStorage.getItem('temprfit_sleep_logs') || '[]');
      const sMap = {};
      savedSleep.forEach(l => sMap[l.date] = { hours: l.hours, quality: l.quality });
      setSleepLogs(sMap);
    } catch(e) {}
  }, []);

  const calendar = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday
    
    const dataMap = {};
    data.forEach(item => {
      dataMap[item.date] = { count: item.count, exercises: item.exercises || [] };
    });

    const weeks = [];
    let currentWeek = [];
    
    // Pad start of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const count = dataMap[dateStr] ? dataMap[dateStr].count : 0;
      const meals = dataMap[dateStr] ? dataMap[dateStr].meals : 0;
      const exercises = dataMap[dateStr] ? dataMap[dateStr].exercises : [];
      
      currentWeek.push({ day, dateStr, count, exercises, meals });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  }, [currentDate, data]);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4>Workout Consistency</h4>
        <div className={styles.controls}>
          <button onClick={prevMonth}>&lt;</button>
          <span>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
          <button onClick={nextMonth}>&gt;</button>
        </div>
      </div>
      <div className={styles.calendar}>
        <div className={styles.weekdays}>
          <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
        </div>
        {calendar.map((week, wIdx) => (
          <div key={wIdx} className={styles.week}>
            {week.map((dayObj, dIdx) => {
              if (!dayObj) return <div key={dIdx} className={styles.emptyDay} />;
              const isWorkout = dayObj.count > 0;
              const isOther = !isWorkout && (dayObj.meals > 0 || waterLogs[dayObj.dateStr] || sleepLogs[dayObj.dateStr]);
              return (
                <div 
                  key={dIdx} 
                  className={`${styles.day} ${isWorkout ? styles.activeDay : isOther ? styles.otherDay : ''}`}
                  onClick={() => { if (isWorkout || isOther) setSelectedDay(dayObj) }}
                  style={{ cursor: (isWorkout || isOther) ? 'pointer' : 'default' }}
                  title={`${dayObj.dateStr}: ${dayObj.count} session(s)`}
                >
                  {dayObj.day}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {selectedDay && (
        <div className={styles.modalOverlay} onClick={() => setSelectedDay(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--color-text)' }}>
              {new Date(selectedDay.dateStr + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h4>
            <p style={{ margin: '0 0 16px 0', color: 'var(--color-primary)', fontWeight: 'bold' }}>
              {selectedDay.count} Session(s) Completed
            </p>
            {selectedDay.meals > 0 && <p style={{ color: 'var(--color-primary)', fontWeight: 'bold', margin: '0 0 16px 0' }}>{selectedDay.meals} Meal(s) Logged</p>}
            {waterLogs[selectedDay.dateStr] && <p style={{ color: '#3b82f6', fontWeight: 'bold', margin: '0 0 16px 0' }}>Water Logged: {waterLogs[selectedDay.dateStr]} ml</p>}
            {sleepLogs[selectedDay.dateStr] && <p style={{ color: '#8b5cf6', fontWeight: 'bold', margin: '0 0 16px 0' }}>Sleep Logged: {sleepLogs[selectedDay.dateStr].hours}h ({sleepLogs[selectedDay.dateStr].quality})</p>}
            {selectedDay.exercises && selectedDay.exercises.length > 0 ? (
              <ul style={{ paddingLeft: '20px', margin: '0 0 24px 0', color: 'var(--color-text-muted)' }}>
                {selectedDay.exercises.map((ex, i) => (
                  <li key={i} style={{ marginBottom: '8px' }}>{ex}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>No specific exercises recorded.</p>
            )}
            <button onClick={() => setSelectedDay(null)} style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
