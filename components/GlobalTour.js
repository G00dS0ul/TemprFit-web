'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import GuidedTour from './GuidedTour';

const GLOBAL_TOUR_STEPS = {
  '/dashboard': [
    { target: 'tour-quickstats', title: 'Your Daily Overview', content: 'Here you can see your most important daily metrics. These adapt based on your specific goal.' },
    { target: 'tour-charts', title: 'Progress Tracking', content: 'Watch your performance trend upward over time.' },
    { target: 'tour-meals', title: 'Nutrition Engine', content: 'Our AI dynamically adjusts your macros based on your daily logs.' },
    { target: 'tour-ai', title: 'AI Coaching', content: 'Tap here anytime to talk to your AI coach or get real-time advice.' },
  ],
  '/workouts': [
    { target: 'tour-workout-list', title: 'Your Workouts', content: 'All your customized and AI generated workouts live here.' },
    { target: 'tour-ai-generate', title: 'Generate New', content: 'Tap this to instantly build a personalized workout based on your current goal and equipment.' },
  ],
  '/settings': [
    { target: 'tour-settings-profile', title: 'Your Profile', content: 'Update your metrics, goals, and experience here.' },
    { target: 'tour-settings-theme', title: 'Theme Settings', content: 'Switch between light and dark mode.' },
  ],
  '/trainer-dashboard': [
    { target: 'tour-trainer-overview', title: 'Trainer Hub', content: 'Welcome to your business dashboard. Manage clients and revenue from here.' },
    { target: 'tour-trainer-programs', title: 'Your Programs', content: 'Create and sell training programs easily.' },
  ],
  '/': [
    { target: 'tour-home-hero', title: 'Welcome to TemprFit', content: 'Your journey begins here. Discover the tools to transform your body.' },
    { target: 'tour-home-features', title: 'Explore Features', content: 'Learn about our AI coaching, diet plans, and marketplace.' }
  ],
  '/moments': [
    { target: 'tour-moments-feed', title: 'Social Moments', content: 'Share your progress, see what others are doing, and get inspired.' },
    { target: 'tour-moments-post', title: 'Create a Post', content: 'Share your latest workout or milestone here.' }
  ],
  '/health': [
    { target: 'tour-health-bmi', title: 'Health Metrics', content: 'Track your BMI and other critical health indicators over time.' },
    { target: 'tour-health-graphs', title: 'Visual Progress', content: 'Watch your body metrics improve visually.' }
  ],
  '/nutrition': [
    { target: 'tour-nutrition-macros', title: 'Macro Tracking', content: 'Log your meals and see how they fit your daily macro goals.' },
    { target: 'tour-nutrition-log', title: 'Add a Meal', content: 'Tap here to quickly log what you just ate.' }
  ],
  '/explore': [
    { target: 'tour-explore-exercises', title: 'Exercise Library', content: 'Discover new movements, watch form videos, and build your routine.' }
  ]
};

function GlobalTourInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const tourKey = `tour_${pathname.replace(/\//g, '_')}`;

  useEffect(() => {
    if (searchParams.get('tour') === 'restart') {
      localStorage.removeItem(`tour_${tourKey}`);
      const url = new URL(window.location.href);
      url.searchParams.delete('tour');
      window.history.replaceState({}, '', url);
      window.location.reload();
    }
  }, [searchParams, tourKey]);

  if (pathname === '/login' || pathname === '/register' || pathname === '/onboarding') {
    return null;
  }

  const currentSteps = GLOBAL_TOUR_STEPS[pathname] || [];

  if (currentSteps.length === 0) return null;

  return <GuidedTour tourKey={tourKey} steps={currentSteps} />;
}

export default function GlobalTour() {
  return (
    <Suspense fallback={null}>
      <GlobalTourInner />
    </Suspense>
  );
}
