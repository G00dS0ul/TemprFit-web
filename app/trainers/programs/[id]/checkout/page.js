'use client';

import ComingSoonFeature from '@/components/ComingSoonFeature';
import { ShieldCheck, Lock, CreditCard } from 'lucide-react';

export default function CheckoutPage() {
  return (
    <ComingSoonFeature
      badge="Coming Soon • Phase 2"
      title="Secure Trainer Checkout & Escrow"
      tagline="Paid trainer checkout and escrow protection will open in Phase 2!"
      description="Trainer booking checkout is currently closed while we optimize all trainee tools. No charges can be made at this time."
      featureKey="trainer_checkout"
      highlights={[
        {
          icon: Lock,
          title: 'Escrow Vault Security',
          desc: 'Your payment will be securely safeguarded until training milestones are verified and completed.'
        },
        {
          icon: CreditCard,
          title: 'Flexible Payment Methods',
          desc: 'Support for credit cards, debit cards, and local payment methods will launch smoothly in Phase 2.'
        },
        {
          icon: ShieldCheck,
          title: '100% Satisfaction Guarantee',
          desc: 'Dispute protection and full milestone accountability on every transaction.'
        }
      ]}
    />
  );
}
