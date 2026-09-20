import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Health Disclaimer | TemprFit',
  description: 'Health and medical disclaimer for the TemprFit fitness platform.'
};

export default function HealthDisclaimerPage() {
  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', minHeight: '80vh' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Health Disclaimer</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '40px' }}>Last Updated: October 2026</p>
        
        <div style={{ padding: '20px', borderLeft: '4px solid var(--color-primary)', background: 'var(--color-background-soft)', marginBottom: '30px' }}>
          <strong>WARNING:</strong> Always consult with a qualified healthcare professional before starting any new diet or fitness program.
        </div>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Not Medical Advice</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-text)' }}>
            The content, AI-generated meal plans, automated workout routines, and advice provided by independent trainers on TemprFit are for informational and educational purposes only. They do not constitute medical advice, diagnosis, or treatment.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Assumption of Risk</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--color-text)' }}>
            You acknowledge that fitness activities, particularly those involving heavy weights or high-intensity intervals, carry an inherent risk of physical injury. By utilizing our AI generation tools or purchasing programs from trainers on our marketplace, you assume full responsibility for your actions and any resulting injuries.
          </p>
        </section>

      </main>
      <Footer />
    </>
  );
}
