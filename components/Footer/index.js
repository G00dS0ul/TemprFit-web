import Link from 'next/link';
import { Dumbbell, Github, Twitter, Instagram, Youtube, Mail } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerGrid}>
          <div className={styles.brand}>
            <div className={styles.brandLogo}>
              <Dumbbell size={24} />
              <span>Tempr<span className={styles.brandAccent}>Fit</span></span>
            </div>
            <p className={styles.brandDesc}>
              Forge your body, one rep at a time. The ultimate fitness platform with AI coaching,
              3D tracking, and a global trainer marketplace.
            </p>
            <div className={styles.socials}>
              <a href="#" aria-label="Twitter"><Twitter size={18} /></a>
              <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
              <a href="#" aria-label="Youtube"><Youtube size={18} /></a>
              <a href="#" aria-label="Github"><Github size={18} /></a>
            </div>
          </div>

          <div className={styles.linksCol}>
            <h4>Platform</h4>
            <Link href="/trainers">Find Trainers</Link>
            <Link href="/diet">Diet Plans</Link>
            <Link href="/tracker">Progress Tracker</Link>
            <Link href="/ai-coach">AI Coach</Link>
            <Link href="/moments">Moments</Link>
          </div>

          <div className={styles.linksCol}>
            <h4>Company</h4>
            <Link href="#">About Us</Link>
            <Link href="/become-trainer">Become a Trainer</Link>
            <Link href="/monetization">Monetization</Link>
            <Link href="#">Careers</Link>
            <Link href="#">Contact</Link>
          </div>

          <div className={styles.linksCol}>
            <h4>Legal</h4>
            <Link href="#">Privacy Policy</Link>
            <Link href="#">Terms of Service</Link>
            <Link href="#">Cookie Policy</Link>
            <Link href="#">Refund Policy</Link>
            <Link href="#">Escrow Terms</Link>
          </div>

          <div className={styles.newsletter}>
            <h4>Stay Forged</h4>
            <p>Get weekly tips, workouts, and exclusive offers.</p>
            <div className={styles.subscribe}>
              <input type="email" placeholder="your@email.com" />
              <button><Mail size={16} /></button>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© 2024 TemprFit. All rights reserved.</p>
          <p>Made with 💪 for fitness enthusiasts worldwide.</p>
        </div>
      </div>
    </footer>
  );
}
