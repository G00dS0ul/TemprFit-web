'use client';

import ComingSoonFeature from '@/components/ComingSoonFeature';
import { Users, TrendingUp, Calendar, Wallet } from 'lucide-react';

export default function TrainerDashboardPage() {
  return (
    <ComingSoonFeature
      badge="Coming Soon • Phase 2"
      title="Trainer Workspace & Client Manager"
      tagline="The comprehensive trainer suite will launch once our trainee community reaches scale!"
      description="We are currently prioritizing the Trainee experience (workouts, AI form check, gym locator, nutrition). We want to make sure the app has thousands of active trainees first, so that when we open the Trainer Workspace, you will have plenty of real clients waiting to be coached!"
      featureKey="trainer_dashboard"
      highlights={[
        {
          icon: Users,
          title: 'Direct Client Roster',
          desc: 'Manage your trainee programs, workout compliance, and real-time messaging seamlessly.'
        },
        {
          icon: Calendar,
          title: 'Integrated Calendar & Sessions',
          desc: 'Automated 1-on-1 booking slots, video workout scheduling, and reminder alerts.'
        },
        {
          icon: Wallet,
          title: 'Instant Escrow Payouts',
          desc: 'Get paid automatically when training milestones and client check-ins are completed.'
        }
      ]}
    />
  );
}
