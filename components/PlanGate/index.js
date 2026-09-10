'use client';

import Link from 'next/link';
import { Lock, ArrowRight, Crown, Zap } from 'lucide-react';
import styles from './PlanGate.module.css';

/**
 * PlanGate — wraps content that requires a specific plan.
 * If the user doesn't have the required plan, shows a lock overlay with an upgrade CTA.
 * 
 * Usage:
 *   <PlanGate userPlan="free" requiredPlan="pro" featureName="AI Workout Generation">
 *     <WorkoutGenerator />
 *   </PlanGate>
 */
export default function PlanGate({ userPlan = 'free', requiredPlan = 'pro', featureName = 'This feature', children }) {
  const PLAN_LEVELS = { free: 0, pro: 1, max: 2 };
  const hasAccess = (PLAN_LEVELS[userPlan] ?? 0) >= (PLAN_LEVELS[requiredPlan] ?? 0);

  if (hasAccess) return children;

  const PlanIcon = requiredPlan === 'max' ? Crown : Zap;
  const planColor = requiredPlan === 'max' ? 'gold' : '#22c55e';

  return (
    <div className={styles.gate}>
      <div className={styles.overlay}>
        <div className={styles.lockCard}>
          <div className={styles.lockIcon}>
            <Lock size={28} />
          </div>
          <h3>{featureName}</h3>
          <p>
            This feature requires the <strong style={{ color: planColor }}><PlanIcon size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> {requiredPlan.toUpperCase()}</strong> plan.
          </p>
          <Link href="/upgrade" className={styles.upgradeBtn}>
            Upgrade Now <ArrowRight size={16} />
          </Link>
        </div>
      </div>
      <div className={styles.blurred}>
        {children}
      </div>
    </div>
  );
}
