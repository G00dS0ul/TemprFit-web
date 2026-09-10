'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Legend
} from 'recharts';
import { Activity } from 'lucide-react';
import styles from './HealthGraphs.module.css';

export default function HealthGraphs() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bmi')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data.length > 0) {
          const formatted = json.data.map(item => ({
            ...item,
            dateStr: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            height: item.height,
            weight: item.weight,
            bmi: item.bmi
          }));
          setData(formatted);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading health data...</div>;
  }

  if (data.length === 0) {
    return null; // Don't show anything if no BMI data logged
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Activity size={20} className={styles.icon} />
        <h3>Health Trends</h3>
      </div>
      
      <div className={styles.grid}>
        <div className={styles.chartCard}>
          <h4>BMI Progression</h4>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBmi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="dateStr" stroke="#a1a1a8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1a8" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#a855f7' }}
                />
                <Area type="monotone" dataKey="bmi" name="BMI" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorBmi)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h4>Weight vs Height (Scale Comparison)</h4>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="dateStr" stroke="#a1a1a8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#a1a1a8" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <YAxis yAxisId="right" orientation="right" stroke="#a1a1a8" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line yAxisId="left" type="monotone" dataKey="weight" name="Weight (kg)" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="height" name="Height (cm)" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
