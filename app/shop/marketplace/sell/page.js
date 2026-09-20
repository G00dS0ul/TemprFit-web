'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight, Upload, X } from 'lucide-react';
import styles from './page.module.css';

export default function SellEquipmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: 'Used',
    category: 'Weights & Dumbbells',
  });
  
  // For simplicity, just use a basic string input for image URLs or Cloudinary widget
  const [images, setImages] = useState([]);
  const [imageUrl, setImageUrl] = useState('');

  const addImage = () => {
    if (imageUrl && !images.includes(imageUrl)) {
      setImages([...images, imageUrl]);
      setImageUrl('');
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        images
      };

      const res = await fetch('/api/marketplace/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to list item');
        setLoading(false);
        return;
      }

      router.push('/shop/marketplace');
    } catch (err) {
      setError('Something went wrong.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1><ShoppingBag size={28} className={styles.icon} /> Sell Equipment</h1>
          <p>Turn your old gear into cash on The Forge.</p>
        </div>
      </div>

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          
          <div className={styles.inputGroup}>
            <label>Title</label>
            <input 
              type="text" 
              placeholder="e.g. Bowflex SelectTech 552 Dumbbells" 
              required 
              maxLength={100}
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Price ($)</label>
              <input 
                type="number" 
                placeholder="150" 
                required 
                min="0"
                step="0.01"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Condition</label>
              <select 
                value={formData.condition}
                onChange={e => setFormData({...formData, condition: e.target.value})}
              >
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Used">Used</option>
              </select>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Category</label>
            <select 
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              <option value="Weights & Dumbbells">Weights & Dumbbells</option>
              <option value="Cardio">Cardio</option>
              <option value="Machines">Machines</option>
              <option value="Accessories">Accessories</option>
              <option value="Apparel">Apparel</option>
              <option value="Supplements">Supplements</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>Description</label>
            <textarea 
              placeholder="Describe the item, any flaws, reasons for selling..." 
              required 
              rows={4}
              maxLength={2000}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>

          <div className={styles.inputGroup}>
            <label>Images</label>
            <div className={styles.imageInputRow}>
              <input 
                type="url" 
                placeholder="Paste an image URL here (Cloudinary/Imgur)" 
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
              />
              <button type="button" onClick={addImage} className={styles.addBtn}>Add</button>
            </div>
            
            {images.length > 0 && (
              <div className={styles.imagePreviewGrid}>
                {images.map((img, i) => (
                  <div key={i} className={styles.imagePreview}>
                    <img src={img} alt="Preview" />
                    <button type="button" onClick={() => removeImage(i)} className={styles.removeBtn}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.infoBox}>
            <strong>Platform Fee:</strong> The Forge takes a 10% commission on all sales to cover payment processing and escrow security.
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading || images.length === 0}>
            {loading ? 'Listing Item...' : 'List Item on Marketplace'} <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
