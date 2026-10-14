'use client';

import ComingSoonFeature from '@/components/ComingSoonFeature';
import { Lock, ShieldCheck, Briefcase } from 'lucide-react';

export default function EscrowDetailPage() {
  return (
    <ComingSoonFeature
      badge="Coming Soon • Phase 2"
      title="Escrow Booking Management"
      tagline="Booking contracts and escrow releases are currently paused for Phase 2."
      description="Active escrow contracts will open once the certified trainer marketplace officially launches. All trainee tools remain 100% active."
      featureKey="escrow_detail"
      highlights={[
        {
          icon: Lock,
          title: 'Protected Payments',
          desc: 'Escrow milestones will secure client funds until sessions are fulfilled.'
        },
        {
          icon: ShieldCheck,
          title: 'Dispute Arbitration',
          desc: 'Automated milestone proofs and dispute mechanisms.'
        },
        {
          icon: Briefcase,
          title: 'Direct Status Tracking',
          desc: 'Live tracking of funds deposited, milestones reached, and releases processed.'
        }
      ]}
    />
  );
}
