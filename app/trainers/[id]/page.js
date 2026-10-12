'use client';

import ComingSoonFeature from '@/components/ComingSoonFeature';
import { Users, ShieldCheck, Dumbbell, Award, Sparkles, CalendarDays } from 'lucide-react';

export default function TrainerProfilePage() {
  return (
    <ComingSoonFeature
      badge="Coming Soon • Phase 2"
      title="Trainer Profiles & Direct Booking"
      tagline="Individual trainer booking and 1-on-1 coaching will launch in Phase 2!"
      description="We are currently prioritizing the Trainee experience (AI coaching, workout generator, and gym locators) to build a thriving fitness community before opening up individual trainer bookings."
      featureKey="trainer_profiles"
      highlights={[
        {
          icon: Dumbbell,
          title: 'Train on Your Own First',
          desc: 'Access complete exercise libraries, custom workout tracking, and AI-powered form checks today.'
        },
        {
          icon: ShieldCheck,
          title: 'Direct Coach Messaging',
          desc: 'When launched, chat directly with certified fitness coaches and receive personalized regimen reviews.'
        },
        {
          icon: CalendarDays,
          title: 'Integrated Scheduling',
          desc: 'Easily book 1-on-1 physical or video workout sessions with automatic calendar sync.'
        }
      ]}
    />
  );
}
