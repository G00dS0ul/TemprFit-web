'use client';

import ComingSoonFeature from '@/components/ComingSoonFeature';
import { DollarSign, Globe, Shield, Award, Users, Sparkles } from 'lucide-react';

export default function BecomeTrainerPage() {
  return (
    <ComingSoonFeature
      badge="Early Access • Phase 2"
      title="Become a Certified TemprFit Coach"
      tagline="Trainer applications & onboarding will launch in Phase 2!"
      description="We're currently scaling our global trainee base so when our trainer marketplace goes live, you will have an active, eager audience of clients looking for 1-on-1 coaching. Sign up below to be the first coach invited to our priority onboarding cohort!"
      featureKey="become_trainer"
      highlights={[
        {
          icon: Users,
          title: 'Built-in Trainee Audience',
          desc: 'By building out the trainee experience first, we guarantee instant client demand the moment you publish your coaching profile.'
        },
        {
          icon: Shield,
          title: 'Guaranteed Escrow Payouts',
          desc: 'Never chase an invoice again. Client funds are locked in escrow upfront and released to your account upon milestone completion.'
        },
        {
          icon: Award,
          title: 'Zero Platform Fees on First $1,000',
          desc: 'Early cohort coaches who sign up on our waitlist will receive 0% platform commissions on their first $1,000 earned.'
        }
      ]}
    />
  );
}
