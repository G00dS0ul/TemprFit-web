'use client';

import ComingSoonFeature from '@/components/ComingSoonFeature';
import { Briefcase, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

export default function EscrowPage() {
  return (
    <ComingSoonFeature
      badge="Coming Soon • Phase 2"
      title="Client Bookings & Escrow Protection"
      tagline="Escrow milestone management will activate alongside the Trainer Marketplace!"
      description="Because 1-on-1 trainer bookings are opening in Phase 2, the escrow payment system is temporarily on hold. You don't have to worry about any charges, contracts, or holds while you train with our free workouts and AI coach."
      featureKey="escrow_bookings"
      highlights={[
        {
          icon: Lock,
          title: 'Safe Milestone Escrow',
          desc: 'When active, funds are safely held by TemprFit and only disbursed once your trainer delivers your agreed training milestones.'
        },
        {
          icon: ShieldCheck,
          title: 'Fair Dispute Resolution',
          desc: 'Built-in arbitration and refund safeguards protect both trainees and coaches on every booking.'
        },
        {
          icon: Briefcase,
          title: 'Unified Contract Dashboard',
          desc: 'Easily track sessions completed, pending milestones, workout logs, and receipts in one place.'
        }
      ]}
    />
  );
}
