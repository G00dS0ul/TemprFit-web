'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import UserAvatar from '@/components/UserAvatar';
import Link from 'next/link';
import { 
  Send, MessageCircle, ShieldCheck, Lock, Users, Sparkles, 
  Search, Plus, X, UserPlus, Gift, AlertCircle, Check, CheckCheck,
  Edit2, Trash2, Copy, CornerDownRight, ArrowLeft, Heart, Forward
} from 'lucide-react';
import styles from './page.module.css';

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryConvId = searchParams.get('convId');

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(queryConvId || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [sending, setSending] = useState(false);
  
  // User search & start new conversation state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [initiatingChat, setInitiatingChat] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Forward message modal states
  const [forwardModalMsg, setForwardModalMsg] = useState(null);
  const [forwardTab, setForwardTab] = useState('dms'); // 'dms' or 'rooms'
  const [forwardRooms, setForwardRooms] = useState([]);
  const [forwardUserSearch, setForwardUserSearch] = useState('');
  const [forwardUserResults, setForwardUserResults] = useState([]);
  const [forwardLoading, setForwardLoading] = useState(false);
  const [forwardSuccess, setForwardSuccess] = useState('');

  // WhatsApp-like interactive states: Edit & Reply
  const [editingMsg, setEditingMsg] = useState(null); // { messageId, originalText }
  const [replyingToMsg, setReplyingToMsg] = useState(null); // { messageId, senderName, textSnippet }
  const [copiedId, setCopiedId] = useState(null);

  // Filter conversations list locally
  const [convFilterQuery, setConvFilterQuery] = useState('');

  // Mobile navigation toggle (true = chat visible on mobile)
  const [mobileChatOpen, setMobileChatOpen] = useState(Boolean(queryConvId));

  // XP gift confirmation modal
  const [xpPrompt, setXpPrompt] = useState(null); // { fee, recipientUsername, targetUserId, canAfford }

  const messagesContainerRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const isScrolledToBottomRef = useRef(true);

  // Keep track of user scroll position so we do NOT auto-scroll if user is reading older messages
  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    isScrolledToBottomRef.current = isAtBottom;
  }, []);

  const scrollToBottom = useCallback((force = false) => {
    if (force || isScrolledToBottomRef.current) {
      const el = messagesContainerRef.current;
      if (el) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    }
  }, []);

  useEffect(() => {
    fetch('/api/user/profile')
      .then(res => res.json())
      .then(data => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});

    fetchConversations();
    const interval = setInterval(fetchConversations, 5000); // Poll conversations
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (queryConvId) {
      setActiveConvId(queryConvId);
      setMobileChatOpen(true);
    }
  }, [queryConvId]);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId, true);
      const interval = setInterval(() => fetchMessages(activeConvId, false), 3000);
      return () => clearInterval(interval);
    }
  }, [activeConvId]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
        if (!activeConvId && !queryConvId && data.conversations.length > 0 && window.innerWidth > 768) {
          setActiveConvId(data.conversations[0]._id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (convId, isFirstLoad = false) => {
    try {
      const res = await fetch(`/api/messages/${convId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        if (isFirstLoad) {
          setTimeout(() => scrollToBottom(true), 100);
        } else {
          scrollToBottom(false);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendOrEdit = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConvId || sending) return;

    setSending(true);

    try {
      if (editingMsg) {
        // Edit existing message
        const res = await fetch(`/api/messages/${activeConvId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId: editingMsg._id, text })
        });
        const data = await res.json();
        if (data.message) {
          setMessages(prev => prev.map(m => m._id === editingMsg._id ? data.message : m));
          setText('');
          setEditingMsg(null);
        }
      } else {
        // Send new message
        const payload = { text };
        if (replyingToMsg) {
          payload.replyTo = replyingToMsg;
        }

        const res = await fetch(`/api/messages/${activeConvId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.message) {
          setMessages(prev => [...prev, data.message]);
          setText('');
          setReplyingToMsg(null);
          fetchConversations();
          setTimeout(() => scrollToBottom(true), 50);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Delete this message?')) return;
    try {
      const res = await fetch(`/api/messages/${activeConvId}?messageId=${messageId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.filter(m => m._id !== messageId));
        fetchConversations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyMessage = (msg) => {
    navigator.clipboard.writeText(msg.text);
    setCopiedId(msg._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLikeMessage = async (messageId) => {
    const uid = String(currentUser?._id || currentUser?.id || '');
    if (!uid || !activeConvId) return;

    // Optimistic like toggle
    setMessages(prev => prev.map(m => {
      if (m._id !== messageId) return m;
      const likes = m.likes || [];
      const hasLiked = likes.some(l => String(l) === uid);
      const newLikes = hasLiked ? likes.filter(l => String(l) !== uid) : [...likes, uid];
      return { ...m, likes: newLikes };
    }));

    try {
      const res = await fetch(`/api/messages/${activeConvId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, action: 'like' })
      });
      const data = await res.json();
      if (data.message) {
        setMessages(prev => prev.map(m => m._id === messageId ? data.message : m));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch rooms whenever forward modal opens
  useEffect(() => {
    if (forwardModalMsg) {
      fetch('/api/rooms')
        .then(r => r.json())
        .then(d => { if (d.rooms) setForwardRooms(d.rooms); })
        .catch(() => {});
    }
  }, [forwardModalMsg]);

  // Search users for forward modal
  useEffect(() => {
    if (!forwardUserSearch.trim()) {
      setForwardUserResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(forwardUserSearch.trim())}`)
        .then(r => r.json())
        .then(d => { if (d.users) setForwardUserResults(d.users); })
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [forwardUserSearch]);

  const handleForwardMessage = async (targetType, targetId, targetName = '') => {
    if (!forwardModalMsg) return;
    setForwardLoading(true);
    setForwardSuccess('');

    try {
      const forwardedText = `↪️ [Forwarded from @${forwardModalMsg.sender?.username || 'user'}]: ${forwardModalMsg.text}`;

      if (targetType === 'room') {
        const res = await fetch(`/api/rooms/${targetId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'send_message', text: forwardedText, isForwarded: true })
        });
        const data = await res.json();
        if (data.success) {
          setForwardSuccess(`Forwarded to ${targetName || 'room'}!`);
          setTimeout(() => {
            setForwardModalMsg(null);
            setForwardSuccess('');
          }, 1400);
        } else {
          alert(data.error || 'Failed to forward to room');
        }
      } else if (targetType === 'conv') {
        const res = await fetch(`/api/messages/${targetId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: forwardedText, isForwarded: true })
        });
        const data = await res.json();
        if (data.success) {
          setForwardSuccess(`Forwarded to @${targetName || 'chat'}!`);
          setTimeout(() => {
            setForwardModalMsg(null);
            setForwardSuccess('');
          }, 1400);
        } else {
          alert(data.error || 'Failed to forward message');
        }
      } else if (targetType === 'user') {
        const initRes = await fetch('/api/messages/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId: targetId })
        });
        const initData = await initRes.json();
        if (initData.conversation) {
          const res = await fetch(`/api/messages/${initData.conversation._id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: forwardedText, isForwarded: true })
          });
          const data = await res.json();
          if (data.success) {
            setForwardSuccess(`Forwarded to @${targetName || 'athlete'}!`);
            setTimeout(() => {
              setForwardModalMsg(null);
              setForwardSuccess('');
            }, 1400);
          }
        } else {
          alert(initData.error || 'Failed to start chat with user');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to forward message');
    } finally {
      setForwardLoading(false);
    }
  };

  const handleStartEdit = (msg) => {
    setReplyingToMsg(null);
    setEditingMsg(msg);
    setText(msg.text);
  };

  const handleStartReply = (msg) => {
    setEditingMsg(null);
    setReplyingToMsg({
      messageId: msg._id,
      senderName: msg.sender?.username || 'User',
      textSnippet: msg.text?.slice(0, 80)
    });
  };

  const handleSearchUsers = (q) => {
    setSearchQuery(q);
    setSearchError('');
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!q.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setSearchResults(data.users || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleStartChatWithUser = async (targetUserId, confirmPayment = false) => {
    setInitiatingChat(true);
    setSearchError('');

    try {
      const res = await fetch('/api/messages/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, confirmXpPayment: confirmPayment })
      });

      const data = await res.json();

      if (res.status === 402 && data.requiresXpFee) {
        setXpPrompt({
          targetUserId,
          recipientUsername: data.recipientUsername,
          fee: data.fee,
          canAfford: data.canAfford,
          message: data.message
        });
        return;
      }

      if (data.conversation) {
        setXpPrompt(null);
        setShowSearchModal(false);
        setSearchQuery('');
        setSearchResults([]);
        await fetchConversations();
        setActiveConvId(data.conversation._id);
        setMobileChatOpen(true);
      } else if (data.error) {
        setSearchError(data.error);
      }
    } catch (err) {
      setSearchError('Failed to initialize conversation');
    } finally {
      setInitiatingChat(false);
    }
  };

  const currentUserId = String(currentUser?._id || currentUser?.id || '');
  const activeConv = conversations.find(c => String(c._id) === String(activeConvId));
  const otherUser = activeConv?.participants?.find(p => String(p._id || p.id) !== currentUserId) || activeConv?.participants?.[0];

  const filteredConversations = conversations.filter(conv => {
    if (!convFilterQuery) return true;
    const other = conv.participants?.find(p => String(p._id || p.id) !== currentUserId);
    return other?.username?.toLowerCase().includes(convFilterQuery.toLowerCase());
  });

  return (
    <div className={styles.page}>
      <Navbar />
      <Sidebar />
      <div className={styles.container}>
        
        {/* Sidebar Conversations List */}
        <div className={`${styles.sidebar} ${mobileChatOpen ? styles.sidebarHiddenOnMobile : ''}`}>
          <div className={styles.sidebarHeader}>
            <div className={styles.headerTitleRow}>
              <h2>Messages</h2>
              <div className={styles.headerActions}>
                <Link href="/rooms" className={styles.roomsShortcutBtn} title="Browse Community Rooms">
                  <Users size={13} /> Rooms
                </Link>
                <button 
                  type="button" 
                  onClick={() => setShowSearchModal(true)}
                  className={styles.newChatBtn}
                  title="Start a new chat"
                >
                  <Plus size={14} /> New
                </button>
              </div>
            </div>

            {/* Filter Search Box */}
            <div className={styles.searchBox}>
              <Search size={15} className={styles.searchIcon} />
              <input 
                type="text"
                placeholder="Search conversations..."
                value={convFilterQuery}
                onChange={e => setConvFilterQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.conversationList}>
            {filteredConversations.map(conv => {
              const other = conv.participants?.find(p => String(p._id || p.id) !== currentUserId) || conv.participants?.[0];
              if (!other) return null;
              
              const isSelected = activeConvId === conv._id;
              const lastMsg = conv.lastMessage;
              const isLastMsgMine = String(lastMsg?.sender?._id || lastMsg?.sender) === currentUserId;

              return (
                <div 
                  key={conv._id} 
                  className={`${styles.convItem} ${isSelected ? styles.active : ''}`}
                  onClick={() => {
                    setActiveConvId(conv._id);
                    setMobileChatOpen(true);
                  }}
                >
                  <div className={styles.convAvatarWrap}>
                    <UserAvatar user={other} size="md" />
                    <span className={styles.onlineBadge} />
                  </div>

                  <div className={styles.convInfo}>
                    <div className={styles.convTopRow}>
                      <div className={styles.convName}>
                        @{other.username}
                        {other.plan === 'max' && <span className={`${styles.planTag} ${styles.planMax}`}>MAX</span>}
                        {other.plan === 'pro' && <span className={`${styles.planTag} ${styles.planPro}`}>PRO</span>}
                      </div>
                      {conv.updatedAt && (
                        <span className={styles.convTimestamp}>
                          {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <div className={styles.convBottomRow}>
                      <div className={styles.convLastMsg}>
                        {isLastMsgMine && (
                          <span style={{ marginRight: '4px', display: 'inline-flex', verticalAlign: 'middle' }}>
                            {lastMsg?.status === 'seen' ? (
                              <CheckCheck size={14} className={styles.statusIconSeen} />
                            ) : (
                              <CheckCheck size={14} className={styles.statusIconSent} />
                            )}
                          </span>
                        )}
                        {lastMsg?.text || 'Start chatting...'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredConversations.length === 0 && (
              <div style={{ padding: '36px 16px', color: '#94a3b8', textAlign: 'center', fontSize: '0.9rem' }}>
                <MessageCircle size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p style={{ margin: '0 0 10px', fontWeight: 600 }}>No conversations found</p>
                <button 
                  type="button" 
                  onClick={() => setShowSearchModal(true)}
                  style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', padding: '8px 16px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  🔍 Search & Start a Chat
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {activeConvId && otherUser ? (
          <div className={styles.chatArea}>
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                <button 
                  type="button" 
                  className={styles.mobileBackBtn} 
                  onClick={() => setMobileChatOpen(false)}
                >
                  <ArrowLeft size={20} />
                </button>

                <UserAvatar user={otherUser} size="md" />
                <div className={styles.chatHeaderUser}>
                  <Link href={`/u/${otherUser.username}`} className={styles.chatHeaderUsername}>
                    @{otherUser.username}
                  </Link>
                  <span className={styles.chatHeaderStatus}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                    Active direct session
                  </span>
                </div>
              </div>

              <div className={styles.chatHeaderActions}>
                <Link href={`/u/${otherUser.username}`} className={styles.profileLinkBtn}>
                  Profile
                </Link>
              </div>
            </div>
            
            {/* Scrollable Messages Stream */}
            <div 
              className={styles.messagesContainer} 
              ref={messagesContainerRef}
              onScroll={handleScroll}
            >
              <div className={styles.dateSeparator}>
                <span className={styles.datePill}>Messages are end-to-end encrypted</span>
              </div>

              {messages.map(msg => {
                const isMine = String(msg.sender?._id || msg.sender) === currentUserId;
                const isSeen = msg.status === 'seen';
                const isDelivered = msg.status === 'delivered' || msg.status === 'seen';

                return (
                  <div key={msg._id} className={`${styles.bubbleRow} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
                    {/* Hover Action Bar */}
                    <div className={styles.bubbleActions}>
                      <button 
                        type="button" 
                        onClick={() => handleCopyMessage(msg)} 
                        className={styles.bubbleActionBtn}
                        title="Copy message"
                      >
                        {copiedId === msg._id ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                      </button>

                      <button 
                        type="button" 
                        onClick={() => setForwardModalMsg(msg)} 
                        className={styles.bubbleActionBtn}
                        title="Forward message to chats or rooms"
                      >
                        <Forward size={12} />
                      </button>

                      <button 
                        type="button" 
                        onClick={() => handleStartReply(msg)} 
                        className={styles.bubbleActionBtn}
                        title="Reply"
                      >
                        <CornerDownRight size={12} />
                      </button>

                      {isMine && (
                        <button 
                          type="button" 
                          onClick={() => handleStartEdit(msg)} 
                          className={styles.bubbleActionBtn}
                          title="Edit message"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}

                      {isMine && (
                        <button 
                          type="button" 
                          onClick={() => handleDeleteMessage(msg._id)} 
                          className={styles.bubbleActionBtn}
                          style={{ color: '#ef4444' }}
                          title="Delete message"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>

                    {/* Replied quote snippet */}
                    {msg.replyTo && (
                      <div className={styles.replyQuoteBox}>
                        <span className={styles.replyQuoteUser}>@{msg.replyTo.senderName}</span>
                        {msg.replyTo.textSnippet}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className={styles.bubble}>
                      {msg.isForwarded && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', color: '#38bdf8', fontStyle: 'italic', marginBottom: '3px' }}>
                          <Forward size={10} /> Forwarded
                        </div>
                      )}
                      <div>{msg.text}</div>

                      {/* Bottom Footer Row with Likes & Time/Ticks */}
                      <div className={styles.bubbleFooterRow}>
                        <button 
                          type="button"
                          onClick={() => handleLikeMessage(msg._id)}
                          className={`${styles.bubbleLikeBtn} ${(msg.likes || []).some(l => String(l) === currentUserId) ? styles.bubbleLikeBtnLiked : ''}`}
                          title="Like message"
                        >
                          <Heart size={11} fill={(msg.likes || []).some(l => String(l) === currentUserId) ? '#f43f5e' : 'none'} color={(msg.likes || []).some(l => String(l) === currentUserId) ? '#f43f5e' : '#94a3b8'} />
                          {msg.likes?.length > 0 && <span>{msg.likes.length}</span>}
                        </button>

                        <div className={styles.bubbleMeta}>
                          {msg.isEdited && <span className={styles.editedTag}>edited</span>}
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMine && (
                            <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginLeft: '2px' }}>
                              {isSeen ? (
                                <CheckCheck size={14} className={styles.ticksSeen} />
                              ) : isDelivered ? (
                                <CheckCheck size={14} className={styles.ticksDelivered} />
                              ) : (
                                <Check size={14} className={styles.ticksDelivered} />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Replying or Editing Context Banner */}
            {replyingToMsg && (
              <div className={styles.contextBar}>
                <span>Replying to @{replyingToMsg.senderName}: &quot;{replyingToMsg.textSnippet}&quot;</span>
                <button type="button" onClick={() => setReplyingToMsg(null)} className={styles.contextBarClose}>
                  <X size={15} />
                </button>
              </div>
            )}

            {editingMsg && (
              <div className={styles.contextBar} style={{ borderColor: '#f59e0b', color: '#fbbf24' }}>
                <span>Editing message...</span>
                <button type="button" onClick={() => { setEditingMsg(null); setText(''); }} className={styles.contextBarClose}>
                  <X size={15} />
                </button>
              </div>
            )}

            {/* Message Input Form */}
            <form className={styles.inputForm} onSubmit={handleSendOrEdit}>
              <input 
                type="text" 
                placeholder={editingMsg ? 'Edit message...' : replyingToMsg ? `Reply to @${replyingToMsg.senderName}...` : `Type a message...`}
                value={text} 
                onChange={e => setText(e.target.value)}
                maxLength={2000}
                className={styles.textInput}
              />
              <button 
                type="submit" 
                className={styles.sendBtn} 
                disabled={!text.trim() || sending}
                title={editingMsg ? 'Save edit' : 'Send message'}
              >
                {editingMsg ? <Check size={18} /> : <Send size={18} />}
              </button>
            </form>
          </div>
        ) : (
          <div className={styles.noChatSelected}>
            <MessageCircle size={72} style={{ marginBottom: '16px', opacity: 0.4, color: '#22c55e' }} />
            <h2>Direct Trainee Chat</h2>
            <p>
              Select an existing chat from the left or search for any athlete by username to start an instant private conversation.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                onClick={() => setShowSearchModal(true)} 
                className={styles.newChatBtn}
                style={{ padding: '10px 22px', fontSize: '0.9rem' }}
              >
                <Search size={16} /> Search Trainees
              </button>
              <Link href="/rooms" className={styles.roomsShortcutBtn} style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                Community Rooms
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* Search & Start Conversation Modal */}
      {showSearchModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', maxWidth: '480px', width: '100%', padding: '24px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.25rem' }}>Start Direct Conversation</h3>
              <button onClick={() => setShowSearchModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: '#94a3b8' }} />
              <input 
                type="text"
                autoFocus
                placeholder="Type username or name to search..."
                value={searchQuery}
                onChange={e => handleSearchUsers(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 14px 10px 42px', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
              />
            </div>

            {searchError && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '0 0 12px' }}>{searchError}</p>}

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {isSearching ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Searching trainees...</p>
              ) : searchResults.length === 0 && searchQuery ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No users found matching &quot;{searchQuery}&quot;</p>
              ) : searchResults.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '24px' }}>Type a username above to find athletes and start chatting.</p>
              ) : (
                searchResults.map(u => (
                  <div 
                    key={u._id} 
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <UserAvatar user={u} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>
                          @{u.username}
                          {u.plan !== 'free' && (
                            <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(245,158,11,0.2)', color: '#fbbf24', marginLeft: '6px', fontWeight: 700 }}>
                              {u.plan?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        {u.name && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{u.name}</div>}
                      </div>
                    </div>

                    <button 
                      type="button"
                      disabled={initiatingChat}
                      onClick={() => handleStartChatWithUser(u._id)}
                      style={{ background: 'var(--color-primary, #22c55e)', color: '#000', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Chat
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Max Tier XP Gift Prompt Modal */}
      {xpPrompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '20px', maxWidth: '420px', width: '100%', padding: '28px', textAlign: 'center' }}>
            <Gift size={44} style={{ color: '#fbbf24', marginBottom: '14px' }} />
            <h3 style={{ margin: '0 0 10px', color: '#fff' }}>XP Gift Required</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px' }}>
              {xpPrompt.message}
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                type="button" 
                onClick={() => setXpPrompt(null)}
                style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 18px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="button"
                disabled={!xpPrompt.canAfford}
                onClick={() => handleStartChatWithUser(xpPrompt.targetUserId, true)}
                style={{ background: xpPrompt.canAfford ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.1)', color: xpPrompt.canAfford ? '#000' : '#64748b', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: xpPrompt.canAfford ? 'pointer' : 'not-allowed' }}
              >
                {xpPrompt.canAfford ? `Gift ${xpPrompt.fee} XP & Chat` : 'Insufficient XP'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* FORWARD MESSAGE MODAL */}
      {forwardModalMsg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }} onClick={() => setForwardModalMsg(null)}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '18px', width: '100%', maxWidth: '440px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Forward size={18} style={{ color: '#38bdf8' }} /> Forward Message
              </div>
              <button type="button" onClick={() => setForwardModalMsg(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', borderLeft: '3px solid #38bdf8', padding: '8px 12px', borderRadius: '6px', fontSize: '0.82rem', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              &quot;{forwardModalMsg.text?.slice(0, 90)}{forwardModalMsg.text?.length > 90 ? '...' : ''}&quot;
            </div>

            {forwardSuccess && (
              <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80', padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} /> {forwardSuccess}
              </div>
            )}

            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', gap: '8px' }}>
              <button 
                type="button" 
                onClick={() => setForwardTab('dms')}
                style={{ flex: 1, background: 'none', border: 'none', borderBottom: forwardTab === 'dms' ? '2px solid #38bdf8' : '2px solid transparent', color: forwardTab === 'dms' ? '#38bdf8' : '#94a3b8', padding: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Direct Chats
              </button>
              <button 
                type="button" 
                onClick={() => setForwardTab('rooms')}
                style={{ flex: 1, background: 'none', border: 'none', borderBottom: forwardTab === 'rooms' ? '2px solid #38bdf8' : '2px solid transparent', color: forwardTab === 'rooms' ? '#38bdf8' : '#94a3b8', padding: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Community Rooms
              </button>
            </div>

            {/* TAB: Direct Chats */}
            {forwardTab === 'dms' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
                  <input 
                    type="text"
                    placeholder="Search any athlete to forward..."
                    value={forwardUserSearch}
                    onChange={e => setForwardUserSearch(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '7px 12px 7px 32px', borderRadius: '8px', fontSize: '0.82rem', outline: 'none' }}
                  />
                </div>

                {forwardUserResults.map(u => (
                  <div key={u._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserAvatar user={u} size="xs" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>@{u.username}</span>
                    </div>
                    <button 
                      type="button"
                      disabled={forwardLoading}
                      onClick={() => handleForwardMessage('user', u._id, u.username)}
                      style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#000', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Send
                    </button>
                  </div>
                ))}

                {conversations.map(conv => {
                  const other = (conv.participants || []).find(p => String(p._id) !== (currentUser?._id || currentUser?.id)) || {};
                  return (
                    <div key={conv._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserAvatar user={other} size="xs" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>@{other.username || 'user'}</span>
                      </div>
                      <button 
                        type="button"
                        disabled={forwardLoading}
                        onClick={() => handleForwardMessage('conv', conv._id, other.username)}
                        style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#000', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Send
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB: Community Rooms */}
            {forwardTab === 'rooms' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                {forwardRooms.map(rm => (
                  <div key={rm._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={16} style={{ color: '#38bdf8' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{rm.title}</span>
                    </div>
                    <button 
                      type="button"
                      disabled={forwardLoading}
                      onClick={() => handleForwardMessage('room', rm._id, rm.title)}
                      style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#000', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Send
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
