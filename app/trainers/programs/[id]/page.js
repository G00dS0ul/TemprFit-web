'use client';

import ComingSoonFeature from '@/components/ComingSoonFeature';
import { Dumbbell, ShieldCheck, ShoppingBag } from 'lucide-react';

export default function ProgramDetailPage() {
  return (
    <ComingSoonFeature
      badge="Coming Soon • Phase 2"
      title="Trainer Programs & Paid Routines"
      tagline="Paid trainer programs and custom regimens will launch in Phase 2!"
      description="We are focusing on bringing you completely free community workouts and AI-generated workout routines right now. Paid programs from verified trainers will open in Phase 2."
      featureKey="trainer_programs"
      highlights={[
        {
          icon: Dumbbell,
          title: 'Free Workout Plans Available',
          desc: 'Create, log, and generate customized workout routines for free in the Workouts tab right now.'
        },
        {
          icon: ShieldCheck,
          title: 'Vetted Fitness Routines',
          desc: 'Future trainer programs will include structured week-by-week progressions, nutrition guides, and direct coach feedback.'
        },
        {
          icon: ShoppingBag,
          title: 'Protected Purchases',
          desc: 'All program purchases will be backed by our platform guarantee and milestone escrow protection.'
        }
      ]}
    />
  );
}
