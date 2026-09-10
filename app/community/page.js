import { Construction } from 'lucide-react';
import styles from './community.module.css';

export default function CommunityPage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.card}>
          <Construction size={28} />
          <h1>Community</h1>
          <p>This part of TemprFit is coming in a later build phase — the route exists so the nav doesn't dead-end, but there's nothing behind it yet.</p>
        </div>
      </div>
    </div>
  );
}
