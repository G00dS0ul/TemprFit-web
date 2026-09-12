'use client';

import { useState } from 'react';
import { Check, Upload, Award, Globe, DollarSign, Shield } from 'lucide-react';
import styles from './page.module.css';

export default function BecomeTrainer() {
  const [step, setStep] = useState(1);
  const benefits = [
    { icon: DollarSign, title: 'Set Your Own Rates', desc: 'Charge what you are worth. No platform fees on your first $1,000.' },
    { icon: Globe, title: 'Global Reach', desc: 'Train clients from anywhere in the world via video calls.' },
    { icon: Shield, title: 'Secure Payments', desc: 'All payments protected by our escrow system.' },
    { icon: Award, title: 'Verified Badge', desc: 'Get verified to attract more clients and charge premium rates.' },
  ];

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.hero}>
          <h1>Become a <span className={styles.gradient}>TemprFit Trainer</span></h1>
          <p>Turn your passion for fitness into a thriving career. Join our global trainer network.</p>
        </div>

        <div className={styles.benefits}>
          {benefits.map((b, i) => (
            <div key={i} className={styles.benefitCard}>
              <div className={styles.benefitIcon}>
                <b.icon size={24} />
              </div>
              <h3>{b.title}</h3>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>

        <div className={styles.formSection}>
          <h2>Trainer Application</h2>
          <div className={styles.steps}>
            <div className={`${styles.stepIndicator} ${step >= 1 ? styles.activeStep : ''}`}>1</div>
            <div className={styles.stepLine} />
            <div className={`${styles.stepIndicator} ${step >= 2 ? styles.activeStep : ''}`}>2</div>
            <div className={styles.stepLine} />
            <div className={`${styles.stepIndicator} ${step >= 3 ? styles.activeStep : ''}`}>3</div>
          </div>

          {step === 1 && (
            <div className={styles.formStep}>
              <h3>Personal Information</h3>
              <div className={styles.formGrid}>
                <input type="text" placeholder="Full Name" />
                <input type="email" placeholder="Email" />
                <input type="text" placeholder="Location" />
                <input type="text" placeholder="Years of Experience" />
              </div>
              <button className={styles.nextBtn} onClick={() => setStep(2)}>Continue</button>
            </div>
          )}

          {step === 2 && (
            <div className={styles.formStep}>
              <h3>Certifications</h3>
              <div className={styles.uploadArea}>
                <Upload size={32} />
                <p>Upload your certification documents (NASM, ACE, NSCA, etc.)</p>
                <span>PDF, JPG, PNG up to 10MB</span>
              </div>
              <div className={styles.formGrid}>
                <input type="text" placeholder="Primary Specialty" />
                <input type="text" placeholder="Secondary Specialty (optional)" />
              </div>
              <div className={styles.formActions}>
                <button className={styles.backBtn} onClick={() => setStep(1)}>Back</button>
                <button className={styles.nextBtn} onClick={() => setStep(3)}>Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={styles.formStep}>
              <h3>Pricing & Availability</h3>
              <div className={styles.formGrid}>
                <input type="number" placeholder="Session Price ($)" id="trainer-price" defaultValue={50} />
                <input type="number" placeholder="Sessions per Week" id="trainer-sessions" defaultValue={10} />
              </div>
              <div className={styles.terms}>
                <label><input type="checkbox" id="trainer-terms" /> I agree to the Trainer Terms & Escrow Policy</label>
              </div>
              <button className={styles.submitBtn} onClick={async () => {
                const terms = document.getElementById('trainer-terms').checked;
                if (!terms) {
                  alert('Please agree to the terms.');
                  return;
                }
                const price = Number(document.getElementById('trainer-price').value);
                const sessions = Number(document.getElementById('trainer-sessions').value);
                
                try {
                  const res = await fetch('/api/user/become-trainer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pricePerSession: price, sessionsPerWeek: sessions, specialties: ['General Fitness'] })
                  });
                  if (res.ok) {
                    setStep(4);
                  } else {
                    alert('Failed to submit application. Please try again.');
                  }
                } catch (e) {
                  alert('Error submitting application.');
                }
              }}>Submit Application</button>
            </div>
          )}

          {step === 4 && (
            <div className={styles.success}>
              <div className={styles.successIcon}><Check size={32} /></div>
              <h3>Application Submitted!</h3>
              <p>Welcome to the team. You are now officially a Trainer!</p>
              <button className={styles.nextBtn} onClick={() => window.location.href = '/trainer-dashboard'} style={{ marginTop: '24px' }}>
                Go to Trainer Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
