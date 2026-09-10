'use client';

import { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Heart, MessageCircle, Eye, Plus, X, Send, MoreVertical, Bookmark, Edit2, Trash2, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import styles from './page.module.css';

export default function MomentsPage() {
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMoment, setActiveMoment] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('global'); // 'global' or 'saved'
  
  // Upload State
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showEmojiUpload, setShowEmojiUpload] = useState(false);

  // Comment State
  const [commentText, setCommentText] = useState('');
  const [showEmojiComment, setShowEmojiComment] = useState(false);

  // Edit State
  const [editingMomentId, setEditingMomentId] = useState(null);
  const [editCaption, setEditCaption] = useState('');

  // Dropdown Menu State
  const [menuOpenId, setMenuOpenId] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setCurrentUser(d.user))
      .catch(console.error);
    fetchMoments();
  }, []);

  const fetchMoments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/moments');
      const data = await res.json();
      if (data.moments) setMoments(data.moments);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/moments/${id}/like`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMoments(prev => prev.map(m => {
          if (m._id === id) {
            const userId = currentUser?._id || 'me';
            const hasLiked = data.isLiked;
            return {
              ...m,
              likes: hasLiked ? [...m.likes, userId] : m.likes.filter(l => l !== userId),
              isLikedByMe: hasLiked
            };
          }
          return m;
        }));
        if (activeMoment && activeMoment._id === id) {
          setActiveMoment(prev => ({
            ...prev,
            likes: data.isLiked ? [...prev.likes, currentUser?._id || 'me'] : prev.likes.slice(0, -1),
            isLikedByMe: data.isLiked
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/moments/${id}/save`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMoments(prev => prev.map(m => {
          if (m._id === id) {
            const userId = currentUser?._id || 'me';
            const hasSaved = data.isSaved;
            return {
              ...m,
              savedBy: hasSaved ? [...(m.savedBy || []), userId] : (m.savedBy || []).filter(s => s !== userId)
            };
          }
          return m;
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this moment?')) return;
    
    try {
      const res = await fetch(`/api/moments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMoments(prev => prev.filter(m => m._id !== id));
        setMenuOpenId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startEdit = (e, moment) => {
    e.stopPropagation();
    setEditingMomentId(moment._id);
    setEditCaption(moment.caption);
    setMenuOpenId(null);
  };

  const saveEdit = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/moments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: editCaption })
      });
      const data = await res.json();
      if (data.success) {
        setMoments(prev => prev.map(m => m._id === id ? { ...m, caption: editCaption } : m));
        setEditingMomentId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openMoment = async (moment) => {
    setActiveMoment(moment);
    try {
      await fetch(`/api/moments/${moment._id}/view`, { method: 'POST' });
      setMoments(prev => prev.map(m => m._id === moment._id ? { ...m, views: m.views + 1 } : m));
      setActiveMoment(prev => ({ ...prev, views: prev.views + 1 }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !activeMoment) return;
    
    try {
      const res = await fetch(`/api/moments/${activeMoment._id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText })
      });
      const data = await res.json();
      if (data.success) {
        setActiveMoment(prev => ({ ...prev, comments: data.comments }));
        setMoments(prev => prev.map(m => m._id === activeMoment._id ? { ...m, comments: data.comments } : m));
        setCommentText('');
        setShowEmojiComment(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setFilePreview(URL.createObjectURL(f));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file && !mediaUrl) return;

    setUploading(true);
    try {
      let finalMediaUrl = mediaUrl;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        
        if (uploadData.success) {
          finalMediaUrl = uploadData.fileUrl;
        } else {
          throw new Error('File upload failed');
        }
      }

      const res = await fetch('/api/moments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaUrl: finalMediaUrl, caption })
      });
      const data = await res.json();
      if (data.success) {
        setMoments([data.moment, ...moments]);
        setShowUpload(false);
        setMediaUrl('');
        setCaption('');
        setFile(null);
        setFilePreview(null);
        setShowEmojiUpload(false);
      }
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  const displayedMoments = activeTab === 'saved' 
    ? moments.filter(m => m.savedBy?.includes(currentUser?._id))
    : moments;

  return (
    <div className={styles.page}>
      <Navbar />
      <Sidebar />
      <div className="container" style={{ marginLeft: '250px', width: 'calc(100% - 250px)' }}>
        
        <div className={styles.header}>
          <h1>Community Moments</h1>
          <button className={styles.uploadBtn} onClick={() => setShowUpload(true)}>
            <Plus size={20} /> Share a Moment
          </button>
        </div>

        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'global' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('global')}
          >
            Global Feed
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'saved' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            Saved Moments
          </button>
        </div>

        {loading ? (
          <p>Loading moments...</p>
        ) : displayedMoments.length === 0 ? (
          <p className={styles.muted}>No moments to display here.</p>
        ) : (
          <div className={styles.feed}>
            {displayedMoments.map(m => {
              const isSavedByMe = m.savedBy?.includes(currentUser?._id);
              const isMyMoment = m.user?._id === currentUser?._id;

              return (
                <div key={m._id} className={styles.momentCard} onClick={() => openMoment(m)}>
                  <div className={styles.momentHeader}>
                    <img src={m.user?.avatarUrl || `https://ui-avatars.com/api/?name=${m.user?.username}&background=22c55e&color=fff`} className={styles.avatar} alt={m.user?.username} />
                    <div className={styles.username}>{m.user?.username}</div>
                    
                    {isMyMoment && (
                      <div className={styles.menuContainer} onClick={e => e.stopPropagation()}>
                        <button className={styles.menuBtn} onClick={() => setMenuOpenId(menuOpenId === m._id ? null : m._id)}>
                          <MoreVertical size={20} />
                        </button>
                        {menuOpenId === m._id && (
                          <div className={styles.dropdownMenu}>
                            <button className={styles.dropdownItem} onClick={(e) => startEdit(e, m)}>
                              <Edit2 size={16} /> Edit Caption
                            </button>
                            <button className={`${styles.dropdownItem} ${styles.danger}`} onClick={(e) => handleDelete(e, m._id)}>
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.mediaContainer}>
                    {m.mediaUrl.match(/\.(mp4|webm)$/i) ? (
                      <video src={m.mediaUrl} className={styles.media} muted loop autoPlay />
                    ) : (
                      <img src={m.mediaUrl} className={styles.media} alt="Moment" />
                    )}
                  </div>

                  <div className={styles.actions}>
                    <button className={`${styles.actionBtn} ${m.isLikedByMe ? styles.liked : ''}`} onClick={(e) => handleLike(e, m._id)}>
                      <Heart size={20} fill={m.isLikedByMe ? "currentColor" : "none"} /> {m.likes?.length || 0}
                    </button>
                    <button className={styles.actionBtn}>
                      <MessageCircle size={20} /> {m.comments?.length || 0}
                    </button>
                    
                    <button className={`${styles.actionBtn} ${isSavedByMe ? styles.liked : ''}`} style={{ marginLeft: 'auto' }} onClick={(e) => handleSave(e, m._id)}>
                      <Bookmark size={20} fill={isSavedByMe ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <div className={styles.caption}>
                    {editingMomentId === m._id ? (
                      <div onClick={e => e.stopPropagation()}>
                        <textarea 
                          value={editCaption}
                          onChange={e => setEditCaption(e.target.value)}
                          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)', marginBottom: '8px' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={(e) => saveEdit(e, m._id)} style={{ background: '#22c55e', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Save</button>
                          <button onClick={() => setEditingMomentId(null)} style={{ background: 'transparent', border: '1px solid var(--color-border)', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                      </div>
                    ) : m.caption ? (
                      <>
                        <strong>{m.user?.username}</strong> {m.caption}
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className={styles.overlay} onClick={() => setShowUpload(false)}>
          <form className={styles.uploadForm} onClick={e => e.stopPropagation()} onSubmit={handleUpload}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Share a Moment</h2>
              <X size={24} style={{ cursor: 'pointer' }} onClick={() => setShowUpload(false)} />
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input 
                type="file" 
                accept="image/*,video/mp4,video/webm" 
                onChange={handleFileChange} 
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>OR</span>
              <input 
                type="text" 
                placeholder="Paste Media URL" 
                value={mediaUrl} 
                onChange={e => setMediaUrl(e.target.value)} 
                style={{ flex: 1 }}
              />
            </div>
            
            {(filePreview || mediaUrl) && (
              <div style={{ width: '100%', height: '200px', borderRadius: '8px', overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(file?.type.startsWith('video/') || mediaUrl.match(/\.(mp4|webm)$/i)) ? (
                  <video src={filePreview || mediaUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} controls />
                ) : (
                  <img src={filePreview || mediaUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} onError={(e) => e.target.style.display='none'} />
                )}
              </div>
            )}
            
            <div style={{ position: 'relative' }}>
              <textarea 
                placeholder="Write a caption..." 
                value={caption} 
                onChange={e => setCaption(e.target.value)} 
                rows={3} 
              />
              <button 
                type="button"
                onClick={() => setShowEmojiUpload(!showEmojiUpload)}
                style={{ position: 'absolute', bottom: '16px', right: '12px', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <Smile size={20} />
              </button>
              {showEmojiUpload && (
                <div style={{ position: 'absolute', zIndex: 50, bottom: '100%', right: 0, marginBottom: '8px' }}>
                  <EmojiPicker theme="dark" onEmojiClick={(e) => setCaption(prev => prev + e.emoji)} />
                </div>
              )}
            </div>
            <button className={styles.uploadBtn} type="submit" disabled={uploading}>
              {uploading ? 'Posting...' : 'Post Moment'}
            </button>
          </form>
        </div>
      )}

      {/* View Modal */}
      {activeMoment && (
        <div className={styles.overlay} onClick={() => setActiveMoment(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalMedia}>
              {activeMoment.mediaUrl.match(/\.(mp4|webm)$/i) ? (
                <video src={activeMoment.mediaUrl} controls autoPlay />
              ) : (
                <img src={activeMoment.mediaUrl} alt="Moment" />
              )}
            </div>
            
            <div className={styles.modalSidebar}>
              <div className={styles.momentHeader} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <img src={activeMoment.user?.avatarUrl || `https://ui-avatars.com/api/?name=${activeMoment.user?.username}&background=22c55e&color=fff`} className={styles.avatar} alt={activeMoment.user?.username} />
                <div className={styles.username}>{activeMoment.user?.username}</div>
                <X size={20} style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={() => setActiveMoment(null)} />
              </div>
              
              <div className={styles.commentsArea}>
                {activeMoment.caption && (
                  <div className={styles.comment}>
                    <img src={activeMoment.user?.avatarUrl || `https://ui-avatars.com/api/?name=${activeMoment.user?.username}&background=22c55e&color=fff`} className={styles.commentAvatar} />
                    <div className={styles.commentText}>
                      <strong>{activeMoment.user?.username}</strong> {activeMoment.caption}
                    </div>
                  </div>
                )}
                
                {activeMoment.comments?.map((c, i) => (
                  <div key={i} className={styles.comment}>
                    <img src={c.user?.avatarUrl || `https://ui-avatars.com/api/?name=${c.user?.username}&background=22c55e&color=fff`} className={styles.commentAvatar} />
                    <div className={styles.commentText}>
                      <strong>{c.user?.username}</strong> {c.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.actions} style={{ borderTop: '1px solid var(--color-border)' }}>
                <button className={`${styles.actionBtn} ${activeMoment.isLikedByMe ? styles.liked : ''}`} onClick={(e) => handleLike(e, activeMoment._id)}>
                  <Heart size={24} fill={activeMoment.isLikedByMe ? "currentColor" : "none"} />
                </button>
                <button className={styles.actionBtn}>
                  <MessageCircle size={24} />
                </button>
                <button className={`${styles.actionBtn} ${activeMoment.savedBy?.includes(currentUser?._id) ? styles.liked : ''}`} onClick={(e) => handleSave(e, activeMoment._id)}>
                  <Bookmark size={24} fill={activeMoment.savedBy?.includes(currentUser?._id) ? "currentColor" : "none"} />
                </button>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                  <span>{activeMoment.likes?.length || 0} likes</span>
                  <span>{activeMoment.views || 0} views</span>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <form className={styles.commentInputArea} onSubmit={handleComment}>
                  <button type="button" onClick={() => setShowEmojiComment(!showEmojiComment)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', paddingRight: '4px' }}>
                    <Smile size={20} />
                  </button>
                  <input 
                    type="text" 
                    placeholder="Add a comment..." 
                    value={commentText} 
                    onChange={e => setCommentText(e.target.value)} 
                    style={{ flex: 1 }}
                  />
                  <button type="submit">Post</button>
                </form>
                {showEmojiComment && (
                  <div style={{ position: 'absolute', zIndex: 50, bottom: '100%', left: 0, marginBottom: '8px' }}>
                    <EmojiPicker theme="dark" onEmojiClick={(e) => setCommentText(prev => prev + e.emoji)} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
