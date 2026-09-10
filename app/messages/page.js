'use client';

import { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Send, MessageCircle } from 'lucide-react';
import styles from './page.module.css';

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => setCurrentUser(data.user || null));

    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
      const interval = setInterval(() => fetchMessages(activeConvId), 5000); // Poll messages faster
      return () => clearInterval(interval);
    }
  }, [activeConvId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      if (data.conversations) setConversations(data.conversations);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const res = await fetch(`/api/messages/${convId}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConvId) return;

    try {
      const res = await fetch(`/api/messages/${activeConvId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.success) {
        setMessages([...messages, data.message]);
        setText('');
        fetchConversations(); // Update last message in sidebar
      }
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const activeConv = conversations.find(c => c._id === activeConvId);
  const otherUser = activeConv?.participants.find(p => p._id !== currentUser?._id);

  return (
    <div className={styles.page}>
      <Navbar />
      <Sidebar />
      <div className={styles.container}>
        
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2>Messages</h2>
          </div>
          <div className={styles.conversationList}>
            {conversations.map(conv => {
              const other = conv.participants.find(p => p._id !== currentUser?._id);
              if (!other) return null;
              
              return (
                <div 
                  key={conv._id} 
                  className={`${styles.convItem} ${activeConvId === conv._id ? styles.active : ''}`}
                  onClick={() => setActiveConvId(conv._id)}
                >
                  <img src={other.avatarUrl || `https://ui-avatars.com/api/?name=${other.username}&background=22c55e&color=fff`} className={styles.avatar} alt={other.username} />
                  <div className={styles.convInfo}>
                    <div className={styles.convName}>{other.username}</div>
                    <div className={styles.convLastMsg}>
                      {conv.lastMessage ? conv.lastMessage.text : 'New conversation'}
                    </div>
                  </div>
                </div>
              );
            })}
            {conversations.length === 0 && (
              <div style={{ padding: '24px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                No messages yet.
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {activeConvId ? (
          <div className={styles.chatArea}>
            <div className={styles.chatHeader}>
              <img src={otherUser?.avatarUrl || `https://ui-avatars.com/api/?name=${otherUser?.username}&background=22c55e&color=fff`} className={styles.avatar} style={{ width: '40px', height: '40px' }} alt={otherUser?.username} />
              <h3>{otherUser?.username}</h3>
            </div>
            
            <div className={styles.messages}>
              {messages.map(msg => {
                const isMine = msg.sender._id === currentUser?._id;
                return (
                  <div key={msg._id} className={`${styles.message} ${isMine ? styles.mine : styles.theirs}`}>
                    {msg.text}
                    <span className={styles.msgTime}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className={styles.inputArea} onSubmit={handleSend}>
              <input 
                type="text" 
                placeholder="Type a message..." 
                value={text} 
                onChange={e => setText(e.target.value)}
              />
              <button type="submit" className={styles.sendBtn} disabled={!text.trim()}>
                <Send size={18} />
              </button>
            </form>
          </div>
        ) : (
          <div className={styles.noChatSelected}>
            <MessageCircle size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h2>Your Messages</h2>
            <p>Select a conversation to start chatting</p>
          </div>
        )}

      </div>
    </div>
  );
}
