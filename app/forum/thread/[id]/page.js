'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Pin, Lock, ShieldCheck } from 'lucide-react';
import styles from './page.module.css';

export default function ThreadPage() {
  const params = useParams();
  const id = params.id;
  
  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [replyContent, setReplyContent] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchThread();
  }, [id]);

  const fetchThread = async () => {
    try {
      const res = await fetch(`/api/forum/threads/${id}`);
      const data = await res.json();
      if (data.thread) {
        setThread(data.thread);
        setReplies(data.replies || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    setPosting(true);
    try {
      const res = await fetch(`/api/forum/threads/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent })
      });
      const data = await res.json();
      if (data.success) {
        setReplies([...replies, data.reply]);
        setReplyContent('');
      }
    } catch (err) {
      console.error(err);
    }
    setPosting(false);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <Sidebar />
        <div className="container" style={{ marginLeft: '250px', width: 'calc(100% - 250px)', textAlign: 'center', paddingTop: '100px' }}>
          Loading thread...
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className={styles.page}>
        <Navbar />
        <Sidebar />
        <div className="container" style={{ marginLeft: '250px', width: 'calc(100% - 250px)', textAlign: 'center', paddingTop: '100px' }}>
          Thread not found.
        </div>
      </div>
    );
  }

  const renderPost = (author, content, createdAt, isOriginalPost = false) => {
    const isAdmin = author?.role === 'admin';
    const isTrainer = author?.role === 'trainer' || author?.trainerInfo?.isVerified;

    return (
      <div className={styles.postCard}>
        <div className={styles.authorSidebar}>
          <img src={author?.avatarUrl || `https://ui-avatars.com/api/?name=${author?.username}&background=22c55e&color=fff`} className={styles.avatar} alt={author?.username} />
          <div className={styles.authorName}>{author?.username}</div>
          
          {isAdmin && (
            <div className={`${styles.roleBadge} ${styles.admin}`}><ShieldCheck size={12} style={{marginRight:'4px', verticalAlign:'middle'}}/>Admin</div>
          )}
          {isTrainer && !isAdmin && (
            <div className={`${styles.roleBadge} ${styles.trainer}`}>Verified Trainer</div>
          )}
        </div>
        
        <div className={styles.postMain}>
          <div className={styles.postMeta}>
            Posted on {new Date(createdAt).toLocaleString()}
          </div>
          <div className={styles.postContent}>
            {content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <Sidebar />
      <div className="container" style={{ marginLeft: '250px', width: 'calc(100% - 250px)' }}>
        
        <Link href={`/forum/category/${thread.category}`} className={styles.backLink}>
          <ArrowLeft size={16} /> Back to Category
        </Link>

        <div className={styles.threadHeader}>
          <h1 className={styles.title}>
            {thread.isPinned && <span className={styles.pinnedBadge}><Pin size={14} /> Pinned</span>}
            {thread.isLocked && <span className={styles.pinnedBadge} style={{background: 'rgba(255,255,255,0.1)', color: '#fff'}}><Lock size={14} /> Locked</span>}
            {thread.title}
          </h1>
        </div>

        {/* Original Post */}
        {renderPost(thread.author, thread.content, thread.createdAt, true)}

        {/* Replies */}
        {replies.map(reply => (
          <div key={reply._id}>
            {renderPost(reply.author, reply.content, reply.createdAt)}
          </div>
        ))}

        {/* Reply Form */}
        {!thread.isLocked && (
          <form className={styles.replyForm} onSubmit={handleReply}>
            <h3>Leave a Reply</h3>
            <textarea 
              placeholder="Write your response here..." 
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              required
            />
            <button className={styles.replyBtn} type="submit" disabled={posting}>
              {posting ? 'Posting...' : 'Post Reply'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
