'use client';

import { useEffect, useState } from 'react';
import { Droplet, Plus, Calendar, PieChart, BarChart2 } from 'lucide-react';
import ChartWidget from '@/components/ChartWidget';

export default function WaterTracker() {
  const [logs, setLogs] = useState([]);
  const [unit, setUnit] = useState('ml');
  const [amountToAdd, setAmountToAdd] = useState(250);
  
  // New states for extended requirements
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'pie'
  const [timeRange, setTimeRange] = useState('7days'); // '7days', '30days'

  useEffect(() => {
    const saved = localStorage.getItem('temprfit_water_logs');
    const savedUnit = localStorage.getItem('temprfit_water_unit');
    if (saved) setLogs(JSON.parse(saved));
    if (savedUnit) setUnit(savedUnit);
  }, []);

  const saveLogs = (newLogs) => {
    setLogs(newLogs);
    localStorage.setItem('temprfit_water_logs', JSON.stringify(newLogs));
  };

  const handleUnitChange = (e) => {
    setUnit(e.target.value);
    localStorage.setItem('temprfit_water_unit', e.target.value);
  };

  const addWater = () => {
    let amountMl = amountToAdd;
    if (unit === 'liters') amountMl = amountToAdd * 1000;
    if (unit === 'cl') amountMl = amountToAdd * 10;
    if (unit === 'oz') amountMl = amountToAdd * 29.5735;

    const existingLogIndex = logs.findIndex(l => l.date === selectedDate);
    let newLogs = [...logs];
    
    if (existingLogIndex >= 0) {
      newLogs[existingLogIndex].amountMl += amountMl;
    } else {
      newLogs.push({ date: selectedDate, amountMl });
    }
    
    // Sort logs by date to keep history ordered
    newLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
    saveLogs(newLogs);
  };

  const selectedLog = logs.find(l => l.date === selectedDate);
  const selectedMl = selectedLog ? selectedLog.amountMl : 0;
  
  let displayTotal = selectedMl;
  if (unit === 'liters') displayTotal = (selectedMl / 1000).toFixed(2);
  if (unit === 'cl') displayTotal = (selectedMl / 10).toFixed(1);
  if (unit === 'oz') displayTotal = (selectedMl / 29.5735).toFixed(1);

  // Filter for charts
  const rangeLimit = timeRange === '7days' ? 7 : 30;
  const chartLogs = [...logs].slice(-rangeLimit);

  const chartData = chartLogs.map(l => ({ 
    label: new Date(l.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    value: unit === 'liters' ? l.amountMl / 1000 : unit === 'cl' ? l.amountMl / 10 : unit === 'oz' ? l.amountMl / 29.5735 : l.amountMl
  }));

  return (
    <div style={{ background: 'var(--color-bg-elevated)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Droplet size={24} color="#3b82f6" />
          <h3 style={{ margin: 0 }}>Water Intake</h3>
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
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{displayTotal}</span>
          <span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>{unit}</span>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Logged for {selectedDate}</div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={unit} onChange={handleUnitChange} style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px' }}>
            <option value="ml">ml</option>
            <option value="liters">Liters</option>
            <option value="cl">cl</option>
            <option value="oz">oz</option>
          </select>
          <input 
            type="number" 
            value={amountToAdd} 
            onChange={(e) => setAmountToAdd(parseFloat(e.target.value) || 0)}
            style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px', width: '80px' }}
          />
          <button onClick={addWater} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Plus size={18} /> Add
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
            
            <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface)', borderRadius: '8px', padding: '4px' }}>
              <button 
                onClick={() => setChartType('bar')}
                style={{ background: chartType === 'bar' ? 'var(--color-bg-elevated)' : 'transparent', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', color: chartType === 'bar' ? '#3b82f6' : 'var(--color-text-muted)' }}
              >
                <BarChart2 size={18} />
              </button>
              <button 
                onClick={() => setChartType('pie')}
                style={{ background: chartType === 'pie' ? 'var(--color-bg-elevated)' : 'transparent', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', color: chartType === 'pie' ? '#3b82f6' : 'var(--color-text-muted)' }}
              >
                <PieChart size={18} />
              </button>
            </div>
          </div>
          <ChartWidget 
            data={chartData}
            type={chartType}
            title="Water Intake History"
            color="#3b82f6"
          />
        </div>
      )}
    </div>
  );
}
