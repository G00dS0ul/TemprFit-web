import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from './AuthBackButton.module.css';

export default function AuthBackButton() {
  return (
    <Link href="/" className={styles.backBtn}>
      <ArrowLeft size={16} />
      <span>Back to Home</span>
    </Link>
  );
}
