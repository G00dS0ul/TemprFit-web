'use client';

import ComingSoonFeature from '@/components/ComingSoonFeature';
import { Users, ShieldCheck, Dumbbell, Award, Sparkles, CalendarDays } from 'lucide-react';

export default function TrainersPage() {
  return (
    <ComingSoonFeature
      badge="Coming Soon • Phase 2"
      title="Certified Trainer Marketplace"
      tagline="We're putting 100% of our focus into perfecting the Trainee experience first!"
      description="To make TemprFit extraordinary, we are dedicating all current resources to smart workout logging, AI form checks, nutrition plans, and local gym hubs. 1-on-1 certified trainer matchmaking, custom client programs, and verified trainer coaching will launch once our trainee community reaches peak scale."
      featureKey="trainers_marketplace"
      highlights={[
        {
          icon: Dumbbell,
          title: 'Trainee Focus First',
          desc: 'Enjoy free access to smart workout planners, rep counters, AI coaching, and global gym finders.'
        },
        {
          icon: ShieldCheck,
          title: 'Strict Trainer Certification',
          desc: 'When trainers launch, every coach will be manually vetted for accredited fitness credentials and verified experience.'
        },
        {
          icon: CalendarDays,
          title: 'Direct Client Booking & Escrow',
          desc: 'Schedule private sessions, receive custom tailored nutrition plans, and release payments upon milestone completion.'
        }
      ]}
    />
  );
}
