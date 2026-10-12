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
            We collect personal information necessary to operate the TemprFit platform, including your account credentials, profile information, training routines, logged weights and repetitions, and nutrition entries. We never sell your personal data to third-party data brokers or advertisers.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>2. Form Check & Computer Vision (Privacy by Design)</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-text)' }}>
            <strong>Your video is never uploaded to our servers.</strong> Video analysis for AI Form Check runs 100% on-device inside your web browser using WebAssembly and WebGL (Google MediaPipe). Your device extracts 33 biomechanical landmarks, runs geometric angle checks locally, and immediately discards video frames.
          </p>
          <p style={{ lineHeight: '1.6', color: 'var(--color-text)', marginTop: '10px' }}>
            Only anonymized numeric feedback (e.g., exercise slug, joint angle metrics, and flagged mechanical issues such as "knee valgus") is transmitted to our API to generate your coaching guidance and progress history.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>3. Data Retention, GDPR & NDPR Compliance</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-text)' }}>
            We comply with global data protection principles, including the European General Data Protection Regulation (GDPR) and the Nigeria Data Protection Act (NDPA / NDPR). You maintain the right to access, rectify, export, or permanently delete your account and all associated workout, biometric, and nutrition history at any time through Account Settings or by contacting support.
          </p>
          <p style={{ lineHeight: '1.6', color: 'var(--color-text)', marginTop: '10px' }}>
            Upon account deletion, all personal data is permanently wiped from our operational databases within 30 days.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>4. Offline Storage Policies</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-text)' }}>
            To ensure reliable performance in gym environments with low cellular reception, TemprFit caches active workout routines locally on your device via client-side storage (IndexedDB / localStorage). This data synchronizes to your account when connectivity resumes. You can clear local storage at any time via your browser settings.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
