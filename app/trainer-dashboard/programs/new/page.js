'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Image as ImageIcon, Video, X, Plus, Trash2, PenTool } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import DigitalSignatureModal from '@/components/DigitalSignatureModal';
import styles from './page.module.css';

export default function NewProgram() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'General Fitness',
    description: '',
    price: 100,
    sessionsPerWeek: 3,
    totalSessions: 12,
    freeSessions: 1,
    trainingMode: 'remote',
    language: 'English',
    country: 'Global',
    targetAudience: '',
  });

  const [requirements, setRequirements] = useState(['']);
  const [faqs, setFaqs] = useState([{ question: '', answer: '' }]);

  const CATEGORIES = [
    'General Fitness', 'Hypertrophy', 'Strength', 'Endurance', 
    'Flexibility', 'Weight Loss', 'Athletic Performance', 'Rehabilitation'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const imageCount = mediaFiles.filter(f => f.type.startsWith('image/')).length;
      const videoCount = mediaFiles.filter(f => f.type.startsWith('video/')).length;

      if (imageCount < 2 || videoCount < 1) {
        setError('You must upload at least 2 images and 1 video for the program media gallery.');
        setLoading(false);
        return;
      }
      
      // Open the signature modal before proceeding to upload
      setShowSignatureModal(true);
    } catch (err) {
      setError('Validation failed.');
      setLoading(false);
    }
  };

  const handleSignatureComplete = async (signaturePayload) => {
    setShowSignatureModal(false);
    setUploadingMedia(true);
    setError('');

    try {
      const mediaUrls = [];
      let profilePicUrl = '';

      if (profilePicFile) {
        const pData = new FormData();
        pData.append('file', profilePicFile);
        const pRes = await fetch('/api/upload', { method: 'POST', body: pData });
        const pJson = await pRes.json();
        if (pJson.fileUrl) profilePicUrl = pJson.fileUrl;
      }
      
      // Upload media files one by one
      for (const file of mediaFiles) {
        const fileData = new FormData();
        fileData.append('file', file);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: fileData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.fileUrl) {
          mediaUrls.push(uploadData.fileUrl);
        }
      }
      setUploadingMedia(false);

      const payload = { 
        ...formData, 
        mediaGallery: mediaUrls, 
        programProfilePicture: profilePicUrl,
        requirements: requirements.filter(req => req.trim() !== ''),
        faq: faqs.filter(faq => faq.question.trim() !== '' && faq.answer.trim() !== ''),
        signature: signaturePayload
      };

      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to create program');
      } else {
        router.push('/trainer-dashboard/programs');
      }
    } catch (err) {
      setError('An error occurred while creating the program.');
    } finally {
      setLoading(false);
      setUploadingMedia(false);
    }
  };

  const handleMediaChange = (e) => {
    if (e.target.files) {
      setMediaFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.page}>
      <Sidebar />
      <div className={styles.content}>
        <div className="container">
          <Link href="/trainer-dashboard/programs" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', marginBottom: '24px', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back to Programs
          </Link>

          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Create New Program</h1>
              <p className={styles.subtitle}>Define the structure and pricing for your new training program.</p>
            </div>
          </div>

          <form className={styles.card} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              {error && <div className={styles.errorText}>{error}</div>}

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>Program Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. 12-Week Body Recomposition" 
                  required 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>Program Profile Picture (Optional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {profilePicFile ? (
                    <img src={URL.createObjectURL(profilePicFile)} alt="Profile Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={24} color="#888" />
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setProfilePicFile(e.target.files[0]);
                    }
                  }} />
                </div>
                <small style={{ color: 'var(--color-text-muted)' }}>If not provided, your main trainer profile picture will be used.</small>
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>Description</label>
                <textarea 
                  placeholder="Detail what clients can expect, requirements, and outcomes..." 
                  required
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>Training Mode</label>
                <div className={styles.optionsGrid}>
                  {['remote', 'physical', 'hybrid'].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      className={`${styles.optionBtn} ${formData.trainingMode === mode ? styles.selected : ''}`}
                      onClick={() => setFormData({...formData, trainingMode: mode})}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Total Price ($)</label>
                <input 
                  type="number" 
                  min={1} 
                  required 
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Sessions Per Week</label>
                <input 
                  type="number" 
                  min={1} 
                  max={7}
                  required 
                  value={formData.sessionsPerWeek}
                  onChange={e => setFormData({...formData, sessionsPerWeek: e.target.value})}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Total Sessions in Program</label>
                <input 
                  type="number" 
                  min={1} 
                  required 
                  value={formData.totalSessions}
                  onChange={e => setFormData({...formData, totalSessions: e.target.value})}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Free Trial Sessions (Optional)</label>
                <input 
                  type="number" 
                  min={0} 
                  value={formData.freeSessions}
                  onChange={e => setFormData({...formData, freeSessions: e.target.value})}
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Language</label>
                <input 
                  type="text" 
                  placeholder="e.g. English" 
                  value={formData.language}
                  onChange={e => setFormData({...formData, language: e.target.value})}
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Target Country / Region</label>
                <input 
                  type="text" 
                  placeholder="e.g. Global, US, UK" 
                  value={formData.country}
                  onChange={e => setFormData({...formData, country: e.target.value})}
                />
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>Target Audience</label>
                <input 
                  type="text" 
                  placeholder="e.g. Beginners looking to build a foundation, Advanced Lifters..." 
                  required 
                  value={formData.targetAudience}
                  onChange={e => setFormData({...formData, targetAudience: e.target.value})}
                />
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>Program Requirements / Prerequisites</label>
                {requirements.map((req, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="e.g. Access to a fully equipped gym" 
                      value={req}
                      onChange={(e) => {
                        const newReqs = [...requirements];
                        newReqs[i] = e.target.value;
                        setRequirements(newReqs);
                      }}
                    />
                    {requirements.length > 1 && (
                      <button type="button" onClick={() => setRequirements(requirements.filter((_, idx) => idx !== i))} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 8px' }}>
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setRequirements([...requirements, ''])} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', width: 'max-content', fontSize: '0.9rem', fontWeight: 600, padding: 0 }}>
                  <Plus size={16} /> Add Requirement
                </button>
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>Frequently Asked Questions (FAQ)</label>
                {faqs.map((faq, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', position: 'relative' }}>
                    {faqs.length > 1 && (
                      <button type="button" onClick={() => setFaqs(faqs.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={18} />
                      </button>
                    )}
                    <input 
                      type="text" 
                      placeholder="Question: e.g. Do I need any special equipment?" 
                      value={faq.question}
                      style={{ paddingRight: '40px' }}
                      onChange={(e) => {
                        const newFaqs = [...faqs];
                        newFaqs[i].question = e.target.value;
                        setFaqs(newFaqs);
                      }}
                    />
                    <textarea 
                      placeholder="Answer: e.g. You will only need basic dumbbells." 
                      value={faq.answer}
                      rows={2}
                      style={{ minHeight: '60px' }}
                      onChange={(e) => {
                        const newFaqs = [...faqs];
                        newFaqs[i].answer = e.target.value;
                        setFaqs(newFaqs);
                      }}
                    />
                  </div>
                ))}
                <button type="button" onClick={() => setFaqs([...faqs, { question: '', answer: '' }])} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', width: 'max-content', fontSize: '0.9rem', fontWeight: 600, padding: 0 }}>
                  <Plus size={16} /> Add FAQ
                </button>
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>Media Gallery <span style={{ color: '#ef4444' }}>* (Min 2 images & 1 video required)</span></label>
                <div className={styles.mediaUploadContainer}>
                  <label className={styles.uploadBox}>
                    <input 
                      type="file" 
                      accept="image/*,video/*"
                      multiple
                      onChange={handleMediaChange}
                      style={{ display: 'none' }}
                    />
                    <ImageIcon size={24} color="var(--color-text-muted)" />
                    <span>Click to add images/videos</span>
                  </label>
                  
                  {mediaFiles.length > 0 && (
                    <div className={styles.mediaPreviewGrid}>
                      {mediaFiles.map((file, i) => (
                        <div key={i} className={styles.mediaPreviewItem}>
                          {file.type.startsWith('image/') ? (
                            <img src={URL.createObjectURL(file)} alt="preview" />
                          ) : (
                            <div className={styles.videoPreview}><Video size={24} /></div>
                          )}
                          <button type="button" onClick={() => removeMedia(i)} className={styles.removeMediaBtn}><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={`${styles.actions} ${styles.fullWidth}`}>
                <Link href="/trainer-dashboard/programs" className={styles.cancelBtn}>
                  Cancel
                </Link>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? <Loader2 size={18} className={styles.spin} /> : <Save size={18} />}
                  {uploadingMedia ? 'Uploading Media...' : 'Publish Program'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      <DigitalSignatureModal 
        isOpen={showSignatureModal} 
        onClose={() => {
          setShowSignatureModal(false);
          setLoading(false);
        }}
        onSign={handleSignatureComplete}
        type="trainer_revenue_share"
      />
    </div>
  );
}
