'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Dumbbell, BrainCircuit, LineChart } from 'lucide-react';
import styles from './MobileBottomNav.module.css';

const TABS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/coach', label: 'Coach', icon: BrainCircuit },
  { href: '/progress', label: 'Progress', icon: LineChart },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.bottomNav}>
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`${styles.tab} ${active ? styles.active : ''}`}>
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
