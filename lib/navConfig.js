import {
  LayoutDashboard, BarChart3, LineChart, Users, MessageSquare,
  Apple, Dumbbell, BookOpen, Sparkles, DollarSign, Settings, LogOut,
  Salad, ScanFace, Heart, CalendarDays, Star, TrendingUp, Megaphone, Wallet, Shield, Trophy, Store, History, MapPin
} from 'lucide-react';

export const traineeCategories = [
  {
    title: 'Core',
    links: [
      { href: '/dashboard', label: 'Home (Dashboard)', icon: LayoutDashboard },
      { href: '/settings', label: 'Settings', icon: Settings },
    ]
  },
  {
    title: 'Training & AI',
    links: [
      { href: '/explore', label: 'Exercise Library', icon: Dumbbell },
      { href: '/workouts', label: 'Workouts & Tracker', icon: Dumbbell },
      { href: '/form-check', label: 'Form Check AI', icon: ScanFace },
      { href: '/coach', label: 'AI Coach', icon: Sparkles },
    ]
  },
  {
    title: 'Nutrition & Body',
    links: [
      { href: '/nutrition', label: 'Nutrition & Meals', icon: Salad },
      { href: '/progress', label: 'Progress & PRs', icon: LineChart },
      { href: '/history', label: 'Session History', icon: History },
    ]
  },
  {
    title: 'Community & Chat',
    links: [
      { href: '/rooms', label: 'Chat & Community Rooms', icon: MessageSquare },
      { href: '/messages', label: 'Direct Messages', icon: MessageSquare },
      { href: '/gyms', label: 'Local Gyms & Hubs', icon: MapPin },
      { href: '/pods', label: 'Accountability Pods', icon: Users },
      { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
      { href: '/moments', label: 'Moments Feed', icon: Sparkles },
    ]
  }
];

export const trainerCategories = [
  {
    title: 'Workspace',
    links: [
      { href: '/trainer-dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/trainer-dashboard/schedule', label: 'Schedule', icon: CalendarDays },
      { href: '/messages', label: 'Messages', icon: MessageSquare },
    ]
  },
  {
    title: 'Clients & Programs',
    links: [
      { href: '/trainer-dashboard/clients', label: 'My Clients', icon: Users },
      { href: '/trainer-dashboard/programs', label: 'My Programs', icon: Dumbbell },
    ]
  },
  {
    title: 'Business & Analytics',
    links: [
      { href: '/trainer-dashboard/earnings', label: 'Escrow & Earnings', icon: Wallet },
      { href: '/trainer-dashboard/analytics', label: 'Analytics', icon: TrendingUp },
      { href: '/trainer-dashboard/reviews', label: 'Reviews', icon: Star },
    ]
  },
  {
    title: 'Growth',
    links: [
      { href: '/upgrade', label: 'Boost Profile', icon: Megaphone },
    ]
  }
];
