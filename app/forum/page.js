'use client';

import { useState } from 'react';
import { Plus, TrendingUp, Clock, MessageSquare, Flame } from 'lucide-react';
import ForumPost from '@/components/ForumPost';
import { forumPosts } from '@/lib/data';
import styles from './page.module.css';

export default function Forum() {
  const [activeTab, setActiveTab] = useState('trending');
  const [showNewPost, setShowNewPost] = useState(false);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1>Community <span className={styles.gradient}>Forum</span></h1>
          <button className={styles.newPostBtn} onClick={() => setShowNewPost(!showNewPost)}>
            <Plus size={18} /> New Post
          </button>
        </div>

        {showNewPost && (
          <div className={styles.newPostForm}>
            <input type="text" placeholder="Post title..." className={styles.titleInput} />
            <textarea placeholder="Share your thoughts, ask questions, or celebrate wins..." className={styles.contentInput} rows={4} />
            <div className={styles.formActions}>
              <button className={styles.cancelBtn} onClick={() => setShowNewPost(false)}>Cancel</button>
              <button className={styles.publishBtn}>Publish Post</button>
            </div>
          </div>
        )}

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'trending' ? styles.active : ''}`} onClick={() => setActiveTab('trending')}>
            <Flame size={16} /> Trending
          </button>
          <button className={`${styles.tab} ${activeTab === 'latest' ? styles.active : ''}`} onClick={() => setActiveTab('latest')}>
            <Clock size={16} /> Latest
          </button>
          <button className={`${styles.tab} ${activeTab === 'discussions' ? styles.active : ''}`} onClick={() => setActiveTab('discussions')}>
            <MessageSquare size={16} /> Discussions
          </button>
        </div>

        <div className={styles.posts}>
          {forumPosts.map(post => (
            <ForumPost key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}
