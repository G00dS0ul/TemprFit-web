import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { BrainCircuit, Activity, LineChart, Shield, Dumbbell, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'About TemprFit | The Evolution of Fitness',
  description: 'Learn about TemprFit\'s mission to combine AI intelligence with genuine human coaching.'
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingBottom: '80px' }}>
        {/* Mission Hero */}
        <section style={{ 
          background: 'linear-gradient(135deg, var(--color-background) 0%, var(--color-background-soft) 100%)',
          padding: '100px 20px',
          textAlign: 'center'
        }}>
          <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '24px', lineHeight: '1.1' }}>
              The Philosophy of <span style={{ color: 'var(--color-primary)' }}>TemprFit</span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)', marginBottom: '40px', lineHeight: '1.6' }}>
              We believe the ultimate fitness ecosystem pairs the relentless logic of automated AI intelligence with the genuine accountability of human coaching.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/onboarding" style={{ 
                background: 'var(--color-primary)', 
                color: '#fff', 
                padding: '14px 28px', 
                borderRadius: 'var(--radius-md)',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                Start Your Journey <ArrowRight size={18} />
              </Link>
              <Link href="/become-trainer" style={{ 
                background: 'transparent', 
                color: 'var(--color-primary)', 
                border: '2px solid var(--color-primary)',
                padding: '14px 28px', 
                borderRadius: 'var(--radius-md)',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                Become a Coach <Dumbbell size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="container" style={{ paddingTop: '80px', paddingBottom: '40px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '60px' }}>How It Works</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
            <div style={{ textAlign: 'center', padding: '30px', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Activity size={32} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>1. Intelligent Intake</h3>
              <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                We capture your biometrics, schedule, and goals through a deep persona-driven onboarding process to build a dashboard perfectly tailored to you.
              </p>
            </div>

            <div style={{ textAlign: 'center', padding: '30px', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <BrainCircuit size={32} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>2. Adaptive AI Guidance</h3>
              <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                Our proprietary AI analyzes your daily logs, auto-adjusts your macronutrients, and suggests progressive overload targets so you never hit a plateau.
              </p>
            </div>

            <div style={{ textAlign: 'center', padding: '30px', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Shield size={32} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>3. Human Accountability</h3>
              <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                Need an extra push? Hire vetted professional trainers from our marketplace to review your 3D form checks and provide deep 1-on-1 coaching.
              </p>
            </div>
          </div>
        </section>

        {/* Trainer First Ecosystem */}
        <section style={{ background: 'var(--color-background-soft)', padding: '80px 20px', marginTop: '40px' }}>
          <div className="container" style={{ display: 'flex', gap: '60px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 400px' }}>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '24px' }}>A Trainer-First Ecosystem</h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', marginBottom: '20px', lineHeight: '1.6' }}>
                We believe great coaches should keep the lion's share of their hard work. TemprFit provides a complete digital business suite—client management, contract signatures, payment escrow, and workout program builders.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <Shield size={20} color="var(--color-primary)" />
                  <strong>85% Net Payouts:</strong> Industry-leading revenue share.
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <LineChart size={20} color="var(--color-primary)" />
                  <strong>Automated Compliance:</strong> Built-in digital signature contracts.
                </li>
              </ul>
            </div>
            <div style={{ flex: '1 1 400px', background: 'var(--color-surface)', padding: '40px', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}>
              <h3 style={{ marginBottom: '16px' }}>Ready to monetize your fitness expertise?</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>Join the next generation of digital fitness coaching.</p>
              <Link href="/become-trainer" style={{ 
                display: 'block', 
                textAlign: 'center', 
                background: 'var(--color-text)', 
                color: 'var(--color-background)', 
                padding: '16px', 
                borderRadius: 'var(--radius-md)',
                fontWeight: '600'
              }}>
                Apply as a Trainer
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
