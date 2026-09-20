'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowLeft, Tag, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

export default function ItemDetailPage({ params }) {
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchItem();
  }, [params.id]);

  const fetchItem = async () => {
    try {
      const res = await fetch(`/api/marketplace/items/${params.id}`);
      const data = await res.json();
      if (data.item) {
        setItem(data.item);
      } else {
        setError('Item not found');
      }
    } catch (e) {
      setError('Failed to load item');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/marketplace/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item._id })
      });
      
      const data = await res.json();
      
      if (data.link) {
        // Redirect to Flutterwave checkout page
        window.location.href = data.link;
      } else {
        setError(data.error || 'Checkout failed');
        setCheckoutLoading(false);
      }
    } catch (e) {
      setError('Something went wrong during checkout');
      setCheckoutLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading item...</div>;
  if (error || !item) return <div className={styles.error}>{error || 'Item not found'}</div>;

  return (
    <div className={styles.page}>
      <Link href="/shop/marketplace" className={styles.backBtn}>
        <ArrowLeft size={18} /> Back to Marketplace
      </Link>

      <div className={styles.content}>
        <div className={styles.imageGallery}>
          {item.images && item.images.length > 0 ? (
            <img src={item.images[0]} alt={item.title} className={styles.mainImage} />
          ) : (
            <div className={styles.noImage}>No Image Provided</div>
          )}
        </div>

        <div className={styles.details}>
          <div className={styles.badge}>{item.category}</div>
          <h1 className={styles.title}>{item.title}</h1>
          <div className={styles.price}>${item.price.toFixed(2)}</div>
          
          <div className={styles.metaBox}>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Condition:</span>
              <span className={styles.metaValue}>{item.condition}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Seller:</span>
              <span className={styles.metaValue}>@{item.seller?.username}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Status:</span>
              <span className={styles.metaValue} style={{ 
                color: item.status === 'Available' ? 'var(--color-primary)' : 'var(--color-warning)'
              }}>
                {item.status}
              </span>
            </div>
          </div>

          <div className={styles.descriptionBox}>
            <h3>Description</h3>
            <p>{item.description}</p>
          </div>

          <div className={styles.trustBox}>
            <div className={styles.trustItem}>
              <ShieldCheck size={20} className={styles.trustIcon} />
              <span>Secure Payment via Flutterwave Escrow</span>
            </div>
            <div className={styles.trustItem}>
              <CheckCircle2 size={20} className={styles.trustIcon} />
              <span>Verified Seller Account</span>
            </div>
          </div>

          {error && <div className={styles.checkoutError}>{error}</div>}

          <button 
            className={styles.checkoutBtn} 
            onClick={handleCheckout}
            disabled={checkoutLoading || item.status !== 'Available'}
          >
            {checkoutLoading ? 'Processing...' : item.status !== 'Available' ? 'Not Available' : 'Buy Now Securely'}
          </button>
        </div>
      </div>
    </div>
  );
}
