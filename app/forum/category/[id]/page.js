'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Plus, MessageSquare, Eye, X, ArrowLeft, Pin } from 'lucide-react';
import styles from './page.module.css';

export default function CategoryPage() {
  const params = useParams();
  const id = params.id;
  
  const [threads, setThreads] = useState([]);
  const [categoryName, setCategoryName] = useState('Loading...');
  const [loading, setLoading] = useState(true);
  
  const [showNewThread, setShowNewThread] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    // Quick hack to get category name since we only fetch threads API here
    // A better way would be an API that returns both category info and threads, but this works.
    fetch('/api/forum/categories')
      .then(r => r.json())
      .then(d => {
        const cat = d.categories.find(c => c._id === id);
        if (cat) setCategoryName(cat.name);
      });

    fetchThreads();
  }, [id]);

  const fetchThreads = async () => {
    try {
      const res = await fetch(`/api/forum/categories/${id}/threads`);
      const data = await res.json();
      if (data.threads) setThreads(data.threads);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    setPosting(true);
    try {
      const res = await fetch(`/api/forum/categories/${id}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
      const data = await res.json();
      if (data.success) {
        setThreads([data.thread, ...threads]);
        setShowNewThread(false);
        setTitle('');
        setContent('');
      }
    } catch (err) {
      console.error(err);
    }
    setPosting(false);
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <Sidebar />
      <div className="container" style={{ marginLeft: '250px', width: 'calc(100% - 250px)' }}>
        
        <Link href="/forum" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to Rooms
        </Link>

        <div className={styles.header}>
          <h1>{categoryName}</h1>
          <button className={styles.newThreadBtn} onClick={() => setShowNewThread(true)}>
            <Plus size={18} /> New Thread
          </button>
        </div>

        {loading ? (
          <p>Loading threads...</p>
        ) : threads.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No threads here yet. Be the first to start a discussion!</p>
        ) : (
          <div className={styles.threadList}>
            {threads.map(thread => (
              <Link href={`/forum/thread/${thread._id}`} key={thread._id} className={styles.threadCard}>
                <div className={styles.threadMain}>
                  <h3 className={styles.threadTitle}>
                    {thread.isPinned && <span className={styles.pinnedBadge}><Pin size={10} style={{marginRight: '4px'}}/> Pinned</span>}
                    {thread.title}
                  </h3>
                  <div className={styles.threadMeta}>
                    <img src={thread.author?.avatarUrl || `https://ui-avatars.com/api/?name=${thread.author?.username}&background=22c55e&color=fff`} className={styles.avatar} alt={thread.author?.username} />
                    <span>{thread.author?.username}</span>
                    
                    {thread.author?.role === 'admin' && (
                      <span className={`${styles.roleBadge} ${styles.admin}`}>Admin</span>
                    )}
                    {(thread.author?.role === 'trainer' || thread.author?.trainerInfo?.isVerified) && (
                      <span className={`${styles.roleBadge} ${styles.trainer}`}>Trainer</span>
                    )}
                    
                    <span>•</span>
                    <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className={styles.threadStats}>
                  <div className={styles.stat}><MessageSquare size={16} /> {thread.replyCount || 0}</div>
                  <div className={styles.stat}><Eye size={16} /> {thread.views || 0}</div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>

      {showNewThread && (
        <div className={styles.overlay} onClick={() => setShowNewThread(false)}>
          <form className={styles.uploadForm} onClick={e => e.stopPropagation()} onSubmit={handlePost}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Start a Discussion</h2>
              <X size={24} style={{ cursor: 'pointer' }} onClick={() => setShowNewThread(false)} />
            </div>
            
            <input 
              type="text" 
              placeholder="Thread Title" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required 
            />
            
            <textarea 
              placeholder="What do you want to talk about? (Markdown supported)" 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              required 
            />
            
            <button className={styles.uploadBtn} type="submit" disabled={posting}>
              {posting ? 'Posting...' : 'Create Thread'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
