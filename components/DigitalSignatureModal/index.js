'use client';

import { useState, useRef, useEffect } from 'react';
import { X, PenTool, CheckCircle, AlertTriangle } from 'lucide-react';
import styles from './DigitalSignatureModal.module.css';

export default function DigitalSignatureModal({ isOpen, onClose, onSign, type = 'trainer_revenue_share', trainerName = 'Trainer' }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [agreed, setAgreed] = useState(false);
  
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      // Set actual canvas resolution to match display size to avoid blurry lines
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // Automatically detect theme color for stroke
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      ctx.strokeStyle = isDark ? '#ffffff' : '#000000';
      ctx.lineWidth = 2.5;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Support both mouse and touch
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault(); // Prevent scrolling on touch devices
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    
    if (!hasSignature) setHasSignature(true);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.closePath();
      setIsDrawing(false);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = () => {
    if (!hasSignature || !agreed) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onSign({ signatureData: dataUrl, agreedToCommission: true, termsType: type });
  };

  const renderTerms = () => {
    if (type === 'trainer_revenue_share') {
      return (
        <>
          <div className={styles.commissionAlert}>
            <h4>15% Platform Commission</h4>
            <p>By publishing a paid program on TemprFit, you acknowledge that the platform retains a 15% service, hosting, and transaction fee on all gross sales.</p>
          </div>
          <div className={styles.termsBox}>
            <strong>TemprFit Marketplace Agreement</strong><br/><br/>
            1. You are operating as an independent contractor.<br/>
            2. You are responsible for ensuring your content does not violate any copyright laws.<br/>
            3. You grant TemprFit a non-exclusive license to host, display, and distribute this content to paying users.<br/>
            4. Net payouts (85%) are processed according to our standard payout schedule after the completion of the refund period.
          </div>
        </>
      );
    }
    
    if (type === 'trainer_trainee_service') {
      return (
        <div className={styles.termsBox}>
          <strong>Client Coaching Agreement</strong><br/><br/>
          This is a binding agreement between {trainerName} (Trainer) and You (Client).<br/><br/>
          1. The Trainer will provide fitness guidance, which is not medical advice.<br/>
          2. You agree to assume all risks associated with physical exercise.<br/>
          3. Communication cadence and specific deliverables are governed by the program description.<br/>
          4. Payments are held in escrow and released according to platform milestones.
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2><PenTool size={20} /> Digital Signature Required</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className={styles.body}>
          {renderTerms()}
          
          <div className={styles.signatureSection}>
            <h3>Sign below to accept</h3>
            <div className={styles.canvasContainer}>
              <canvas
                ref={canvasRef}
                className={styles.canvas}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <div className={styles.canvasControls}>
                <button className={styles.clearBtn} onClick={clearSignature}>Clear Signature</button>
              </div>
            </div>
          </div>
          
          <div className={styles.checkboxContainer}>
            <input 
              type="checkbox" 
              id="legal-agree" 
              checked={agreed} 
              onChange={(e) => setAgreed(e.target.checked)} 
            />
            <label htmlFor="legal-agree">
              I have read and agree to the terms above. I understand this constitutes a legally binding digital signature.
            </label>
          </div>
        </div>
        
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button 
            className={styles.signBtn} 
            onClick={handleSign}
            disabled={!hasSignature || !agreed}
          >
            <CheckCircle size={18} /> Sign Document
          </button>
        </div>
      </div>
    </div>
  );
}
