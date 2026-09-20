'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, PlusCircle, Tag, Filter } from 'lucide-react';
import styles from './page.module.css';

export default function MarketplacePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  
  const categories = ['All', 'Weights & Dumbbells', 'Cardio', 'Machines', 'Accessories', 'Apparel', 'Supplements', 'Other'];

  useEffect(() => {
    fetchItems();
  }, [category]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/marketplace/items?category=${category}`);
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1><ShoppingBag size={28} className={styles.icon} /> The Forge Marketplace</h1>
          <p>Buy and sell new or used gym equipment with the community.</p>
        </div>
        <Link href="/shop/marketplace/sell" className={styles.sellBtn}>
          <PlusCircle size={18} /> Sell Equipment
        </Link>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input type="text" placeholder="Search equipment..." className={styles.searchInput} />
        </div>
        <div className={styles.categoryPills}>
          <Filter size={16} style={{ color: 'var(--color-text-muted)', marginRight: '8px' }} />
          {categories.map(c => (
            <button 
              key={c} 
              className={`${styles.pill} ${category === c ? styles.pillActive : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading marketplace...</div>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          <Tag size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
          <h3>No items found</h3>
          <p>Be the first to list something in this category!</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map(item => (
            <Link href={`/shop/marketplace/${item._id}`} key={item._id} className={styles.card}>
              <div className={styles.imageWrapper}>
                {item.images && item.images.length > 0 ? (
                  <img src={item.images[0]} alt={item.title} className={styles.image} />
                ) : (
                  <div className={styles.noImage}>No Image</div>
                )}
                <div className={styles.priceTag}>${item.price.toFixed(2)}</div>
              </div>
              <div className={styles.cardInfo}>
                <h3 className={styles.title}>{item.title}</h3>
                <div className={styles.meta}>
                  <span className={styles.condition}>{item.condition}</span>
                  <span className={styles.seller}>by @{item.seller?.username}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
