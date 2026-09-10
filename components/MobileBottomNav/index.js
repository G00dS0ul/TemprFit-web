'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setHidden(true); // scrolling down
      } else {
        setHidden(false); // scrolling up
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`${styles.bottomNav} ${hidden ? styles.hidden : ''}`}>
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
