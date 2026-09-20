'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import styles from './GuidedTour.module.css';

/**
 * GuidedTour Component
 * @param {string} tourKey - Unique identifier for this tour (e.g. 'dashboard_intro')
 * @param {Array} steps - Array of { target: 'data-tour-id', title: '...', content: '...' }
 */
export default function GuidedTour({ tourKey, steps = [] }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    // Check if user has already seen this tour
    const hasSeen = localStorage.getItem(`tour_${tourKey}`);
    if (!hasSeen && steps.length > 0) {
      // Delay slightly to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tourKey, steps]);

  const updateTargetRect = useCallback(() => {
    if (!isActive || !steps[currentStep]) return;
    const element = document.querySelector(`[data-tour="${steps[currentStep].target}"]`);
    if (element) {
      const rect = element.getBoundingClientRect();
      // Only attach to the element if it is actually visible on the screen
      if (rect.width > 0 || rect.height > 0) {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight
        });
        
        // Smooth scroll if element is not in view
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        // Element exists but is hidden (e.g. mobile CSS display: none)
        setTargetRect(null);
      }
    } else {
      // If target not found, just center the popover
      setTargetRect(null);
    }
  }, [isActive, currentStep, steps]);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect);
    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect);
    };
  }, [updateTargetRect]);

  const dismissTour = async () => {
    setIsActive(false);
    localStorage.setItem(`tour_${tourKey}`, 'true');
    
    // Attempt to sync with server
    try {
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onboardingTourSeen: { [tourKey]: true }
        })
      });
    } catch (e) {
      console.warn('Failed to sync tour state to server', e);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      dismissTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  // Expose restart function globally (optional, for a "Help" button)
  useEffect(() => {
    window[`restartTour_${tourKey}`] = () => {
      setCurrentStep(0);
      setIsActive(true);
    };
    return () => {
      delete window[`restartTour_${tourKey}`];
    };
  }, [tourKey]);

  useEffect(() => {
    setCurrentStep(0);
  }, [tourKey]);

  if (!isActive || steps.length === 0) return null;

  const stepData = steps[currentStep];
  if (!stepData) return null;

  let popoverStyle = {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    '--arrow-top': '-30px',
    '--arrow-left': '50px'
  };
  
  if (targetRect) {
    const spaceBelow = targetRect.windowHeight - targetRect.top - targetRect.height;
    const spaceAbove = targetRect.top;
    
    if (spaceBelow > 250) {
      // Place below
      popoverStyle = {
        top: targetRect.top + targetRect.height + 20,
        left: Math.max(20, Math.min(targetRect.left + (targetRect.width / 2) - 160, targetRect.windowWidth - 340)),
        '--arrow-top': '-30px',
        '--arrow-left': '50px'
      };
    } else if (spaceAbove > 250) {
      // Place above
      popoverStyle = {
        top: targetRect.top - 200,
        left: Math.max(20, Math.min(targetRect.left + (targetRect.width / 2) - 160, targetRect.windowWidth - 340)),
        '--arrow-top': 'auto',
        '--arrow-bottom': '-30px',
        '--arrow-left': '50px'
      };
    }
  }

  return (
    <div className={styles.tourOverlay}>
      <div className={styles.backdrop} onClick={dismissTour} />
      
      {targetRect && (
        <div 
          className={styles.highlightHole}
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16
          }}
        />
      )}
      
      <div className={styles.popover} style={popoverStyle}>
        <div className={styles.arrow} />
        <div className={styles.header}>
          <h3>{stepData.title}</h3>
          <button className={styles.closeBtn} onClick={dismissTour}><X size={16} /></button>
        </div>
        
        <div className={styles.content}>
          {stepData.content}
        </div>
        
        <div className={styles.footer}>
          <div className={styles.stepCounter}>
            Step {currentStep + 1} of {steps.length}
          </div>
          <div className={styles.navControls}>
            <button 
              className={styles.navBtn} 
              onClick={prevStep} 
              disabled={currentStep === 0}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              className={`${styles.navBtn} ${styles.primary}`} 
              onClick={nextStep}
            >
              {currentStep === steps.length - 1 ? 'Finish' : <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
