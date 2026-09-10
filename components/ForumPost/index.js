'use client';

import { Heart, MessageSquare, Share2, Bookmark } from 'lucide-react';
import styles from './ForumPost.module.css';

export default function ForumPost({ post }) {
  return (
    <div className={styles.post}>
      <div className={styles.header}>
        <img src={post.avatar} alt={post.author} className={styles.avatar} />
        <div className={styles.authorInfo}>
          <span className={styles.author}>{post.author}</span>
          <span className={styles.time}>{post.time}</span>
        </div>
      </div>

      <h3 className={styles.title}>{post.title}</h3>
      <p className={styles.content}>{post.content}</p>

      <div className={styles.tags}>
        {post.tags.map(tag => (
          <span key={tag} className={styles.tag}>#{tag}</span>
        ))}
      </div>

      <div className={styles.actions}>
        <button className={styles.actionBtn}>
          <Heart size={16} />
          <span>{post.likes}</span>
        </button>
        <button className={styles.actionBtn}>
          <MessageSquare size={16} />
          <span>{post.comments}</span>
        </button>
        <button className={styles.actionBtn}>
          <Share2 size={16} />
        </button>
        <button className={styles.actionBtn}>
          <Bookmark size={16} />
        </button>
      </div>
    </div>
  );
}
