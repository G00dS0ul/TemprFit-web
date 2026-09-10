'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, Bell, Sun, Moon, ChevronDown, Menu, X, User,
  Settings, LogOut, Compass, BrainCircuit, LineChart, Users,
  Dumbbell, History, Activity, Sparkles, LayoutDashboard,
  Apple, Salad, BookOpen, Loader2
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { displayName } from '@/lib/utils';
import styles from './Navbar.module.css';

const navLinks = [
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/coach', label: 'Coach', icon: BrainCircuit },
  { href: '/progress', label: 'Progress', icon: LineChart },
  { href: '/community', label: 'Community', icon: Users },
];

const APP_PAGES = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Workouts', url: '/workouts', icon: Dumbbell },
  { title: 'Generate Workout', url: '/workouts/generate', icon: Sparkles },
  { title: 'Progress Tracker', url: '/progress', icon: LineChart },
  { title: 'Bodyweight & Diet Tracker', url: '/tracker', icon: Activity },
  { title: 'Nutrition & Diet Plans', url: '/nutrition', icon: Apple },
  { title: 'AI Coach', url: '/coach', icon: BrainCircuit },
  { title: 'Form Check', url: '/form-check', icon: Activity },
  { title: 'Transformation Journey', url: '/transformation', icon: Sparkles },
  { title: 'Trainers', url: '/trainers', icon: Users },
  { title: 'Forum', url: '/forum', icon: Users },
  { title: 'Notes', url: '/notes', icon: BookOpen },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState({ pages: [], exercises: [] });
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  };

  const loadSession = () => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        if (data.user) fetchNotifications();
      })
      .catch(() => setUser(null))
      .finally(() => setCheckedAuth(true));
  };

  useEffect(loadSession, [pathname]);

  const markNotificationsRead = async () => {
    if (unreadCount === 0) return;
    setUnreadCount(0);
    await fetch('/api/notifications', { method: 'PUT' });
  };

  const toggleNotif = () => {
    const newState = !notifOpen;
    setNotifOpen(newState);
    setUserMenuOpen(false);
    setSearchOpen(false);
    if (newState) markNotificationsRead();
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (!query.trim()) {
      setSearchResults({ pages: [], exercises: [] });
      setIsSearching(false);
      return;
    }

    // Filter pages instantly
    const matchedPages = APP_PAGES.filter(p => p.title.toLowerCase().includes(query.toLowerCase())).slice(0, 4);
    setSearchResults(prev => ({ ...prev, pages: matchedPages }));
    
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/exercises?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSearchResults(prev => ({ ...prev, exercises: (data.items || []).slice(0, 4) }));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className="container">
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo}>
            <Image src="/images/brand/logo-mark.png" alt="REPForge" width={32} height={32} className={styles.logoMark} priority />
            <span className={styles.logoText}>REPForge</span>
          </Link>

          <div className={styles.desktopNav}>
            <Link href="/" className={`${styles.navLink} ${pathname === '/' ? styles.active : ''}`}>Home</Link>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={`${styles.navLink} ${pathname.startsWith(link.href) ? styles.active : ''}`}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className={styles.desktopActions}>
            <div className={styles.searchWrapper}>
              <button 
                className={styles.searchBarBtn} 
                onClick={() => {
                  setSearchOpen(!searchOpen);
                  setUserMenuOpen(false);
                  setNotifOpen(false);
                }}
              >
                <Search size={16} className={styles.searchBarIcon} />
                <span className={styles.searchBarText}>Search...</span>
                <span className={styles.searchBarKbd}>⌘K</span>
              </button>
              
              {searchOpen && (
                <div className={styles.omniDropdown}>
                  <div className={styles.omniInputWrap}>
                    <Search size={18} className={styles.omniIcon} />
                    <input 
                      type="text"
                      autoFocus
                      placeholder="Search pages, exercises..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className={styles.omniInput}
                    />
                    {isSearching && <Loader2 size={16} className={styles.spin} />}
                  </div>
                  
                  {(searchQuery.trim() !== '') && (
                    <div className={styles.omniResults}>
                      {searchResults.pages.length > 0 && (
                        <div className={styles.omniSection}>
                          <span className={styles.omniSectionTitle}>Pages & Features</span>
                          {searchResults.pages.map(p => (
                            <Link key={p.url} href={p.url} className={styles.omniResultItem} onClick={() => setSearchOpen(false)}>
                              <p.icon size={16} /> {p.title}
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchResults.exercises.length > 0 && (
                        <div className={styles.omniSection}>
                          <span className={styles.omniSectionTitle}>Exercises</span>
                          {searchResults.exercises.map(ex => (
                            <Link key={ex.slug} href={`/explore/${ex.slug}`} className={styles.omniResultItem} onClick={() => setSearchOpen(false)}>
                              <Dumbbell size={16} /> {ex.name}
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchResults.pages.length === 0 && searchResults.exercises.length === 0 && !isSearching && (
                        <div className={styles.omniEmpty}>No results found.</div>
                      )}
                      <Link href={`/explore?q=${encodeURIComponent(searchQuery)}`} className={styles.omniSeeAll} onClick={() => setSearchOpen(false)}>
                        See all results for "{searchQuery}" <Compass size={14} />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme" data-theme-state={theme}>
              <Sun size={14} className={styles.themeIconSun} />
              <Moon size={14} className={styles.themeIconMoon} />
              <span className={styles.themeKnob} />
            </button>

            <div className={styles.notifWrapper}>
              <button className={styles.iconBtn} aria-label="Notifications" onClick={toggleNotif}>
                <Bell size={18} />
                {unreadCount > 0 && <span className={styles.notifDot} />}
              </button>
              {notifOpen && (
                <div className={styles.premiumNotifDropdown}>
                  <div className={styles.notifHeader}>
                    <h4>Notifications</h4>
                    {unreadCount > 0 && <span className={styles.notifBadge}>{unreadCount} New</span>}
                  </div>
                  <div className={styles.notifBody}>
                    {notifications.length === 0 ? (
                      <div className={styles.emptyNotifs}>
                        <Bell size={32} className={styles.emptyBell} />
                        <p>You're all caught up!</p>
                      </div>
                    ) : (
                      <div className={styles.notifList}>
                        {notifications.map(n => (
                          <div key={n._id} className={`${styles.notifItem} ${n.read ? styles.read : ''}`}>
                            <div className={styles.notifIconWrap}>
                              <Sparkles size={16} />
                            </div>
                            <div className={styles.notifContent}>
                              <strong>{n.title}</strong>
                              <p>{n.message}</p>
                              <span className={styles.notifTime}>
                                {new Date(n.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.userMenu}>
              {!checkedAuth ? (
                <span className={styles.authSkeleton} />
              ) : user ? (
                <>
                  <button className={styles.userBtn} onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); setSearchOpen(false); }}>
                    <span className={styles.avatar}>
                      {user.avatarUrl ? <img src={user.avatarUrl} alt={displayName(user)} className={styles.avatarImg} /> : <User size={16} />}
                    </span>
                    <span className={styles.userName}>{displayName(user).split(' ')[0] || 'Account'}</span>
                    <ChevronDown size={14} />
                  </button>
                  {userMenuOpen && (
                    <div className={styles.dropdown}>
                      <Link href="/dashboard" onClick={() => setUserMenuOpen(false)}><User size={14} /> Dashboard</Link>
                      <Link href="/workouts" onClick={() => setUserMenuOpen(false)}><Dumbbell size={14} /> My Workouts</Link>
                      <Link href="/history" onClick={() => setUserMenuOpen(false)}><History size={14} /> History</Link>
                      <Link href="/progress" onClick={() => setUserMenuOpen(false)}><LineChart size={14} /> Progress</Link>
                      <Link href="/settings" onClick={() => setUserMenuOpen(false)}><Settings size={14} /> Settings</Link>
                      <hr />
                      <button className={styles.logoutBtn} onClick={handleLogout}><LogOut size={14} /> Sign Out</button>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.authButtons}>
                  <Link href="/login" className={styles.signInBtn}>Sign In</Link>
                  <Link href="/register" className={styles.signUpBtn}>Get Started</Link>
                </div>
              )}
            </div>
          </div>

          <button className={styles.mobileToggle} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileSectionTitle}>Navigation</div>
          <Link href="/" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Home</Link>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={`${styles.mobileLink} ${pathname.startsWith(link.href) ? styles.activeMobileLink : ''}`} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          <hr className={styles.mobileDivider} />
          {user ? (
            <button className={styles.mobileAuth} onClick={handleLogout}>Sign Out ({displayName(user).split(' ')[0]})</button>
          ) : (
            <>
              <Link href="/register" className={styles.mobileDashboard} onClick={() => setMenuOpen(false)}>Get Started</Link>
              <Link href="/login" className={styles.mobileAuth} onClick={() => setMenuOpen(false)}>Sign In</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
