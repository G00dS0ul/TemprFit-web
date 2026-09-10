import Hero from '@/components/Hero';
import FloatingUpdatesBanner from '@/components/FloatingUpdatesBanner';

// Per spec: the landing route is a single, no-scroll viewport — Navbar +
// Hero only. Everything that used to live here (features, stats, trainers,
// forum, pricing) moved to /about; nothing was deleted.
export default function Home() {
  return (
    <>
      <Hero />
      <FloatingUpdatesBanner />
    </>
  );
}
