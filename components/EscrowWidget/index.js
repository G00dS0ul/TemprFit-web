'use client';

import { useState } from 'react';
import { Shield, Lock, Unlock, Check, AlertCircle, Wallet } from 'lucide-react';
import styles from './EscrowWidget.module.css';

export default function EscrowWidget({ trainer }) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(trainer?.price || 75);
  const [sessions, setSessions] = useState(4);

  const total = amount * sessions;
  const fee = total * 0.05;
  const totalWithFee = total + fee;

  const milestones = [
    { id: 1, label: 'Initial Deposit', percent: 25, status: 'completed' },
    { id: 2, label: 'First Session', percent: 25, status: 'pending' },
    { id: 3, label: 'Halfway Point', percent: 25, status: 'locked' },
    { id: 4, label: 'Completion', percent: 25, status: 'locked' },
  ];

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <Shield size={24} className={styles.shield} />
        <div>
          <h3>Secure Escrow</h3>
          <p>Your payment is protected until sessions are completed</p>
        </div>
      </div>

      {step === 1 && (
        <div className={styles.step}>
          <div className={styles.inputGroup}>
            <label>Sessions</label>
            <div className={styles.stepper}>
              <button onClick={() => setSessions(Math.max(1, sessions - 1))}>-</button>
              <span>{sessions}</span>
              <button onClick={() => setSessions(sessions + 1)}>+</button>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Price per Session</label>
            <div className={styles.priceInput}>
              <span>$</span>
              <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} />
            </div>
          </div>

          <div className={styles.breakdown}>
            <div className={styles.breakdownRow}>
              <span>Subtotal</span>
              <span>${total}</span>
            </div>
            <div className={styles.breakdownRow}>
              <span>Platform Fee (5%)</span>
              <span>${fee.toFixed(2)}</span>
            </div>
            <div className={`${styles.breakdownRow} ${styles.total}`}>
              <span>Total</span>
              <span>${totalWithFee.toFixed(2)}</span>
            </div>
          </div>

          <button className={styles.proceedBtn} onClick={() => setStep(2)}>
            Proceed to Escrow <Lock size={16} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className={styles.step}>
          <div className={styles.milestones}>
            <h4>Payment Milestones</h4>
            {milestones.map((m) => (
              <div key={m.id} className={`${styles.milestone} ${styles[m.status]}`}>
                <div className={styles.milestoneIcon}>
                  {m.status === 'completed' ? <Check size={14} /> : 
                   m.status === 'pending' ? <Unlock size={14} /> : <Lock size={14} />}
                </div>
                <div className={styles.milestoneInfo}>
                  <span className={styles.milestoneLabel}>{m.label}</span>
                  <span className={styles.milestonePercent}>{m.percent}%</span>
                </div>
                <span className={styles.milestoneAmount}>${(totalWithFee * m.percent / 100).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className={styles.escrowInfo}>
            <AlertCircle size={16} />
            <p>Funds are held in escrow and released to the trainer as milestones are completed.</p>
          </div>

          <div className={styles.actions}>
            <button className={styles.backBtn} onClick={() => setStep(1)}>Back</button>
            <button className={styles.depositBtn} onClick={() => setStep(3)}>
              <Wallet size={16} /> Deposit ${totalWithFee.toFixed(2)}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className={styles.step}>
          <div className={styles.success}>
            <div className={styles.successIcon}>
              <Check size={32} />
            </div>
            <h4>Escrow Created!</h4>
            <p>${totalWithFee.toFixed(2)} has been securely deposited.</p>
            <div className={styles.escrowId}>
              <span>Escrow ID: ESC-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
            </div>
            <button className={styles.doneBtn} onClick={() => setStep(1)}>
              View Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
