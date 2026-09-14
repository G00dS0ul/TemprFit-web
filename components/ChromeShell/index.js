'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';
import styles from './ChromeShell.module.css';

export default function ChromeShell({ children }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname.startsWith('/admin');

  useEffect(() => {
    document.body.style.overflow = isHome ? 'hidden' : '';
    document.body.style.height = isHome ? '100vh' : '';
    
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.style.paddingTop = (isHome || isAuthPage) ? '0' : '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      if (mainEl) mainEl.style.paddingTop = '';
    };
  }, [isHome]);

  return (
    <>
      <div className={isHome || isAuthPage ? '' : styles.withBottomNavPadding}>
        {children}
      </div>
      {!isHome && !isAuthPage && <Footer />}
    </>
  );
}
