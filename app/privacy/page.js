import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy | TemprFit',
  description: 'Privacy Policy for TemprFit platform.'
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', minHeight: '80vh' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '40px' }}>Last Updated: October 2026</p>
        
        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>1. Data Collection</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-text)' }}>
            We collect personal data required to operate the TemprFit platform, including your profile information, workout logs, voice dictated notes, and biometric data provided during onboarding. We never sell this information to third-party advertisers.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>2. Data Retention & Biometrics</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-text)' }}>
            Your body metrics, weigh-ins, and physical transformation data are securely encrypted. We retain this data as long as your account is active. Upon account deletion, all personal biometric data is permanently wiped from our primary databases within 30 days.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>3. Offline Sync Policies</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-text)' }}>
            To provide a frictionless experience in low-connectivity gym environments, TemprFit caches your workout data locally on your device using IndexedDB. This data automatically syncs to our cloud servers when your connection is restored. You maintain control over clearing local browser caches.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
