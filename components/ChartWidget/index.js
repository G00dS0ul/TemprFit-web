
'use client';

import { useEffect, useRef } from 'react';
import styles from './ChartWidget.module.css';

export default function ChartWidget({ data, type = 'line', title, color = '#22c55e' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = 40;
    const chartW = w - padding * 2;
    const chartH = h - padding * 2;

    const values = data.map(d => d.value || d.weight || d);
    const maxVal = Math.max(...values) * 1.1;
    let minVal = Math.min(...values) * 0.9;
    if (type === 'bar') minVal = 0;

    ctx.clearRect(0, 0, w, h);

    const computedStyle = getComputedStyle(document.body);

    if (type === 'pie') {
      let total = values.reduce((a, b) => a + b, 0);
      if (total === 0) total = 1;
      let startAngle = -Math.PI / 2;
      const cx = w / 2;
      const cy = h / 2 + 10;
      const radius = Math.min(chartW, chartH) / 2;
      
      values.forEach((val, i) => {
        const sliceAngle = (val / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        
        ctx.fillStyle = i === values.length - 1 ? color : `hsl(${(200 + i * 45) % 360}, 70%, 50%)`;
        ctx.fill();
        
        startAngle += sliceAngle;
      });
    } else {
      const gridColor = computedStyle.getPropertyValue('--color-border').trim() || 'rgba(255,255,255,0.05)';
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(w - padding, y);
        ctx.stroke();
      }

      if (type === 'line') {
        const stepX = chartW / (values.length > 1 ? values.length - 1 : 1);
        
        ctx.beginPath();
        ctx.moveTo(padding, padding + chartH);
        values.forEach((val, i) => {
          const x = padding + stepX * i;
          const y = padding + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;
          ctx.lineTo(x, y);
        });
        ctx.lineTo(padding + stepX * (values.length - 1), padding + chartH);
        ctx.closePath();
        ctx.fillStyle = `${color}15`;
        ctx.fill();

        ctx.beginPath();
        values.forEach((val, i) => {
          const x = padding + stepX * i;
          const y = padding + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        values.forEach((val, i) => {
          const x = padding + stepX * i;
          const y = padding + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fillStyle = computedStyle.getPropertyValue('--color-surface').trim() || '#0f0f11';
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      } else if (type === 'bar') {
        const barW = chartW / values.length * 0.6;
        const gap = chartW / values.length * 0.4;

        values.forEach((val, i) => {
          const x = padding + (chartW / values.length) * i + gap / 2;
          const barH = ((val - minVal) / (maxVal - minVal || 1)) * chartH;
          const y = padding + chartH - barH;

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
          ctx.fill();
        });
      }
    }
  }, [data, type, color]);

  return (
    <div className={styles.widget}>
      {title && <h4 className={styles.title}>{title}</h4>}
      <canvas ref={canvasRef} className={styles.canvas} />
      {type === 'pie' && (
        <div style={{display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center', marginTop:'12px', fontSize:'0.8rem'}}>
           {data.map((d, i) => (
             <div key={i} style={{display:'flex', alignItems:'center', gap:'4px'}}>
               <div style={{width:'10px', height:'10px', borderRadius:'50%', background: i === data.length - 1 ? color : `hsl(${(200 + i * 45) % 360}, 70%, 50%)`}}></div>
               <span>{d.label}</span>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}
