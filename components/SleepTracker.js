'use client';

import { useEffect, useState } from 'react';
import { Moon, Plus, Calendar, Activity } from 'lucide-react';
import ChartWidget from '@/components/ChartWidget';

export default function SleepTracker() {
  const [logs, setLogs] = useState([]);
  const [hours, setHours] = useState(8);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [timeRange, setTimeRange] = useState('7days'); // '7days', '30days'

  useEffect(() => {
    const saved = localStorage.getItem('temprfit_sleep_logs');
    if (saved) setLogs(JSON.parse(saved));
  }, []);

  const saveLogs = (newLogs) => {
    setLogs(newLogs);
    localStorage.setItem('temprfit_sleep_logs', JSON.stringify(newLogs));
  };

  const addSleep = () => {
    const existingLogIndex = logs.findIndex(l => l.date === selectedDate);
    let newLogs = [...logs];
    
    if (existingLogIndex >= 0) {
      newLogs[existingLogIndex].hours = hours;
    } else {
      newLogs.push({ date: selectedDate, hours });
    }
    
    // Sort logs by date
    newLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
    saveLogs(newLogs);
  };

  const selectedLog = logs.find(l => l.date === selectedDate);
  const selectedHours = selectedLog ? selectedLog.hours : 0;

  const rangeLimit = timeRange === '7days' ? 7 : 30;
  const chartLogs = [...logs].slice(-rangeLimit);
  const chartData = chartLogs.map(l => ({ 
    label: new Date(l.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    value: l.hours
  }));

  return (
    <div style={{ background: 'var(--color-bg-elevated)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Moon size={24} color="#8b5cf6" />
          <h3 style={{ margin: 0 }}>Sleep Tracker</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="var(--color-text-muted)" />
          <input 
            type="date" 
            value={selectedDate} 
            onChange={e => setSelectedDate(e.target.value)}
            style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '6px 10px', fontSize: '0.9rem' }}
          />
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{selectedHours}</span>
          <span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>hours</span>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Logged for {selectedDate}</div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="number" 
            step="0.5"
            value={hours} 
            onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
            style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px', width: '80px' }}
          />
          <span style={{ color: 'var(--color-text-muted)' }}>hrs</span>
          <button onClick={addSleep} style={{ background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Plus size={18} /> Log
          </button>
        </div>
      </div>

      {logs.length > 0 && (
        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <select 
              value={timeRange} 
              onChange={e => setTimeRange(e.target.value)}
              style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '6px' }}
            >
              <option value="7days">Last 7 Logs</option>
              <option value="30days">Last 30 Logs</option>
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#8b5cf6', fontSize: '0.9rem', fontWeight: 'bold' }}>
              <Activity size={16} /> Line Graph
            </div>
          </div>
          <ChartWidget 
            data={chartData}
            type="line"
            title="Sleep History"
            color="#8b5cf6"
          />
        </div>
      )}
    </div>
  );
}
