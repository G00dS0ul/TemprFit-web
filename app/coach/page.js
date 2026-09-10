'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Send, User, Loader2 } from 'lucide-react';
import Image from 'next/image';
import AIResponseRenderer from '@/components/AIResponseRenderer';
import styles from './coach.module.css';

const STARTER_PROMPTS = [
  'How am I trending this month?',
  'What should I train next?',
  'Explain progressive overload',
  'Am I hitting my weekly goal?',
];

export default function CoachPage() {
  const [signedIn, setSignedIn] = useState(true);
  const [messages, setMessages] = useState(null); // null = loading
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    fetch('/api/coach')
      .then((r) => {
        if (r.status === 401) throw new Error('signin');
        return r.json();
      })
      .then((d) => setMessages(d.messages || []))
      .catch((e) => {
        if (e.message === 'signin') setSignedIn(false);
        else setMessages([]);
      });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setError('');
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content }]);
    setSending(true);
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'The coach ran into an error.');
        return;
      }
      setMessages((prev) => [...prev, data.message]);
    } catch (e) {
      setError('Could not reach the AI coach. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  if (!signedIn) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <Image src="/images/brand/logo-mark.png" alt="" width={28} height={28} />
          <h1>AI Coach</h1>
          <p>Sign in to chat with your AI coach — it uses your real workout data to give grounded advice.</p>
          <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatPage}>
      <div className="container">
        <div className={styles.chatHeader}>
          <div className={styles.aiAvatar}><Image src="/images/brand/logo-mark.png" alt="" width={20} height={20} /></div>
          <div>
            <h1>AI Coach</h1>
            <p>Grounded in your real sessions, streaks, and goals — not generic advice.</p>
          </div>
          <Link href="/form-check" className={styles.formCheckLink}>Check my form →</Link>
        </div>

        <div className={styles.chatWindow}>
          <div className={styles.messages} ref={scrollRef}>
            {messages === null && <div className={styles.loading}><Loader2 size={20} className={styles.spin} /></div>}

            {messages?.length === 0 && (
              <div className={styles.empty}>
                <p>Ask about your training, your goals, or how a lift is going — the coach can see your real logged data.</p>
                <div className={styles.starters}>
                  {STARTER_PROMPTS.map((p) => (
                    <button key={p} className={styles.starterBtn} onClick={() => send(p)}>{p}</button>
                  ))}
                </div>
              </div>
            )}

            {messages?.map((m, i) => (
              <div key={i} className={`${styles.message} ${styles[m.role]}`}>
                <div className={styles.avatar}>
                  {m.role === 'assistant' ? <Image src="/images/brand/logo-mark.png" alt="" width={16} height={16} /> : <User size={16} />}
                </div>
                <div className={styles.bubble}>
                  {m.role === 'assistant' ? (
                    <AIResponseRenderer content={m.content} />
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className={`${styles.message} ${styles.assistant}`}>
                <div className={styles.avatar}><Image src="/images/brand/logo-mark.png" alt="" width={16} height={16} /></div>
                <div className={styles.typing}><span /><span /><span /></div>
              </div>
            )}
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <div className={styles.inputArea}>
            <input
              type="text"
              placeholder="Ask your AI coach anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              disabled={sending}
            />
            <button className={styles.sendBtn} onClick={() => send()} disabled={sending || !input.trim()}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
