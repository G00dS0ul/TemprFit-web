'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Briefcase, ArrowRight, Clock, AlertTriangle } from 'lucide-react';

export default function MyBookings() {
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/escrow')
      .then(res => res.json())
      .then(data => {
        if (data.transactions) setEscrows(data.transactions);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: '100px', paddingBottom: '60px' }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
        <h1 style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '2.5rem', marginBottom: '8px' }}>My Bookings</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>Manage your active programs and escrow payments.</p>

        {loading ? (
          <p>Loading bookings...</p>
        ) : escrows.length === 0 ? (
          <div style={{ background: 'var(--surface)', padding: '40px', borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '1px solid var(--border)' }}>
            <Briefcase size={48} color="var(--color-text-muted)" style={{ marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '8px' }}>No Active Bookings</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>You haven't booked any trainers yet.</p>
            <Link href="/trainers" style={{ background: 'var(--color-primary)', color: '#000', padding: '10px 20px', borderRadius: '100px', fontWeight: '600', textDecoration: 'none' }}>
              Explore Marketplace
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {escrows.map(escrow => (
              <Link key={escrow._id} href={`/escrow/${escrow._id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s, borderColor 0.2s' }} 
                     onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                     onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  
                  <div>
                    <h3 style={{ color: 'var(--color-text)', marginBottom: '4px' }}>{escrow.description}</h3>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {new Date(escrow.createdAt).toLocaleDateString()}</span>
                      <span style={{ textTransform: 'uppercase', color: escrow.status === 'released' ? '#22c55e' : escrow.status === 'disputed' ? '#ef4444' : '#f59e0b', fontWeight: '700' }}>{escrow.status}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text)' }}>${escrow.amount.toFixed(2)}</div>
                    </div>
                    <ArrowRight color="var(--color-text-muted)" />
                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
