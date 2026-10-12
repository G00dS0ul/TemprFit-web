'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import UserAvatar from '@/components/UserAvatar';
import Link from 'next/link';
import { 
  MessageSquare, Send, Users, Shield, ShieldCheck, 
  Settings, UserPlus, UserMinus, ArrowLeft, Lock, 
  MessageCircle, Sparkles, Check, X, MessageSquareQuote,
  Share2, Heart, CornerDownRight, Trash2, Copy, Edit2,
  Forward, Search, ChevronLeft, ChevronRight
} from 'lucide-react';
import styles from './roomDetail.module.css';

export default function RoomDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [comments, setComments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'discussion', or 'members'
  const [membersPage, setMembersPage] = useState(1);
  const [membersSearch, setMembersSearch] = useState('');

  // Forward message modal states
  const [forwardModalMsg, setForwardModalMsg] = useState(null);
  const [forwardTab, setForwardTab] = useState('dms'); // 'dms' or 'rooms'
  const [forwardRooms, setForwardRooms] = useState([]);
  const [forwardConvs, setForwardConvs] = useState([]);
  const [forwardUserSearch, setForwardUserSearch] = useState('');
  const [forwardUserResults, setForwardUserResults] = useState([]);
  const [forwardLoading, setForwardLoading] = useState(false);
  const [forwardSuccess, setForwardSuccess] = useState('');

  // Chat message input, reply & edit states
  const [text, setText] = useState('');
  const [replyingToMsg, setReplyingToMsg] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Discussion comment input & replies
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingCommentId, setReplyingCommentId] = useState(null);
  const [replyCommentText, setReplyCommentText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Edit Room Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', subtitle: '', description: '', isPrivate: false });
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const messagesContainerRef = useRef(null);
  const isScrolledToBottomRef = useRef(true);

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

    fetchRoomData(true);
    const interval = setInterval(() => fetchRoomData(false), 4000); // 4s live polling
    return () => clearInterval(interval);
  }, [id]);

  const fetchRoomData = async (isInitial = false) => {
    try {
      const code = searchParams?.get('code') || '';
      const url = code ? `/api/rooms/${id}?code=${code}` : `/api/rooms/${id}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.room) {
        setRoom(data.room);
        setMessages(data.messages || []);
        setComments(data.room.comments || []);
        setEditForm({
          title: data.room.title || '',
          subtitle: data.room.subtitle || '',
          description: data.room.description || '',
          isPrivate: Boolean(data.room.isPrivate)
        });

        if (isInitial) {
          setTimeout(() => scrollToBottom(true), 100);
        } else {
          scrollToBottom(false);
        }
      } else if (res.status === 403 && data.isPrivate) {
        setRoom({ isPrivate: true, title: 'Private Room' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInvite = () => {
    if (!room) return;
    const shareUrl = room.isPrivate && room.inviteCode
      ? `${window.location.origin}/rooms/${id}?code=${room.inviteCode}`
      : `${window.location.origin}/rooms/${id}`;
    
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyMessage = (msg) => {
    navigator.clipboard.writeText(msg.text);
    setCopiedId(msg._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendOrEditMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      if (editingMsg) {
        // Edit existing room message
        const res = await fetch(`/api/rooms/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'edit_message', messageId: editingMsg._id, text })
        });
        const data = await res.json();
        if (data.message) {
          setMessages(prev => prev.map(m => m._id === editingMsg._id ? data.message : m));
          setText('');
          setEditingMsg(null);
        }
      } else {
        // Send new room message
        const payload = { action: 'send_message', text };
        if (replyingToMsg) {
          payload.replyTo = {
            messageId: replyingToMsg._id,
            senderName: replyingToMsg.sender?.username || 'User',
            textSnippet: replyingToMsg.text?.slice(0, 80)
          };
        }

        const res = await fetch(`/api/rooms/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.message) {
          setMessages(prev => [...prev, data.message]);
          setText('');
          setReplyingToMsg(null);
          setTimeout(() => scrollToBottom(true), 50);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleLikeMessage = async (messageId) => {
    const uid = String(currentUser?._id || currentUser?.id || '');
    if (!uid) return;
    // Optimistic toggle
    setMessages(prev => prev.map(m => {
      if (m._id !== messageId) return m;
      const likes = m.likes || [];
      const hasLiked = likes.some(l => String(l) === uid);
      const newLikes = hasLiked ? likes.filter(l => String(l) !== uid) : [...likes, uid];
      return { ...m, likes: newLikes };
    }));

    try {
      const res = await fetch(`/api/rooms/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like_message', messageId })
      });
      const data = await res.json();
      if (data.message) {
        setMessages(prev => prev.map(m => m._id === messageId ? data.message : m));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch recipients whenever forward modal opens
  useEffect(() => {
    if (forwardModalMsg) {
      fetch('/api/rooms')
        .then(r => r.json())
        .then(d => { if (d.rooms) setForwardRooms(d.rooms); })
        .catch(() => {});
      fetch('/api/messages')
        .then(r => r.json())
        .then(d => { if (d.conversations) setForwardConvs(d.conversations); })
        .catch(() => {});
    }
  }, [forwardModalMsg]);

  // Search users to forward to
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
      console.error('Forward error:', err);
      alert('Failed to forward message');
    } finally {
      setForwardLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await fetch(`/api/rooms/${id}?messageId=${messageId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.filter(m => m._id !== messageId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEdit = (msg) => {
    setReplyingToMsg(null);
    setEditingMsg(msg);
    setText(msg.text);
  };

  const handleStartReply = (msg) => {
    setEditingMsg(null);
    setReplyingToMsg(msg);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/rooms/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_comment', text: commentText })
      });
      const data = await res.json();
      if (data.comments) {
        setComments(data.comments);
        setCommentText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const res = await fetch(`/api/rooms/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like_comment', commentId })
      });
      const data = await res.json();
      if (data.comments) setComments(data.comments);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddReplyComment = async (commentId) => {
    if (!replyCommentText.trim() || submittingReply) return;
    setSubmittingReply(true);

    try {
      const res = await fetch(`/api/rooms/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply_comment', commentId, text: replyCommentText })
      });
      const data = await res.json();
      if (data.comments) {
        setComments(data.comments);
        setReplyCommentText('');
        setReplyingCommentId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const res = await fetch(`/api/rooms/${id}?commentId=${commentId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setComments(prev => prev.filter(c => c._id !== commentId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinOrLeave = async () => {
    const isMember = (room.members || []).some(m => String(m._id || m) === String(currentUser?._id));
    const action = isMember ? 'leave' : 'join';

    try {
      const res = await fetch(`/api/rooms/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        fetchRoomData();
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditRoomSubmit = async (e) => {
    e.preventDefault();
    setEditing(true);
    setEditError('');

    try {
      const res = await fetch(`/api/rooms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        fetchRoomData();
      } else {
        setEditError(data.error || 'Failed to update room');
      }
    } catch (err) {
      setEditError('Update failed. Please try again.');
    } finally {
      setEditing(false);
    }
  };

  const handleAddModerator = async (targetUserId) => {
    try {
      const res = await fetch(`/api/rooms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moderatorAction: { targetUserId, action: 'add' }
        })
      });
      const data = await res.json();
      if (data.success) fetchRoomData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveModerator = async (targetUserId) => {
    try {
      const res = await fetch(`/api/rooms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moderatorAction: { targetUserId, action: 'remove' }
        })
      });
      const data = await res.json();
      if (data.success) fetchRoomData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleKickMember = async (targetUserId) => {
    if (!confirm('Remove this member from the room?')) return;
    try {
      const res = await fetch(`/api/rooms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberAction: { targetUserId, action: 'remove' }
        })
      });
      const data = await res.json();
      if (data.success) fetchRoomData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !room) {
    return (
      <div className={styles.page}>
        <Navbar />
        <Sidebar />
        <main className={styles.mainContent}>
          <div className="container" style={{ padding: '120px 20px', textAlign: 'center' }}>
            <p>Loading community room...</p>
          </div>
        </main>
      </div>
    );
  }

  const currentUserId = String(currentUser?._id || currentUser?.id || '');
  const isCreator = currentUserId && (String(room.creator?._id || room.creator?.id || room.creator) === currentUserId || currentUser?.role === 'admin');
  const isModerator = currentUserId && (room.moderators || []).some(m => String(m._id || m.id || m) === currentUserId);
  const isMember = currentUserId && (room.members || []).some(m => String(m._id || m.id || m) === currentUserId);

  return (
    <div className={styles.page}>
      <Navbar />
      <Sidebar />

      <main className={styles.mainContent}>
        {/* Top Bar Navigation */}
        <div className={styles.topBar}>
          <Link href="/rooms" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to Rooms
          </Link>

          <div className={styles.topActions}>
            <button 
              type="button"
              onClick={handleCopyInvite}
              className={styles.shareBtn}
              title="Copy share or invite link"
            >
              {copiedLink ? <Check size={15} style={{ color: '#22c55e' }} /> : <Share2 size={15} />}
              <span>{copiedLink ? 'Link Copied!' : room.isPrivate ? 'Copy Private Invite' : 'Share Room'}</span>
            </button>

            {(isCreator || isModerator) && (
              <button 
                className={styles.settingsBtn}
                onClick={() => setShowEditModal(true)}
              >
                <Settings size={15} /> Edit Room & Mods
              </button>
            )}

            {currentUser && !isCreator && !room.isPreset && (
              <button 
                onClick={handleJoinOrLeave}
                className={isMember ? styles.leaveBtn : styles.joinBtn}
              >
                {isMember ? 'Leave Room' : 'Join Room'}
              </button>
            )}
          </div>
        </div>

        {/* Room Header Banner */}
        <div className={styles.roomBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className={styles.roomBadge}>
              <Sparkles size={13} /> LIVE FITNESS ROOM
            </span>
            {room.isPrivate && (
              <span className={styles.privateBadge}>
                <Lock size={12} /> Invite Only (Private)
              </span>
            )}
            {room.isPreset && (
              <span className={styles.officialBadge}>
                Official HQ
              </span>
            )}
          </div>

          <h1 className={styles.roomTitle}>{room.title}</h1>
          {room.subtitle && (
            <p className={styles.roomSubtitle}>{room.subtitle}</p>
          )}
          {room.description && (
            <p className={styles.roomDesc}>{room.description}</p>
          )}

          {/* Room Metadata */}
          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <span style={{ color: 'var(--color-text-muted)' }}>Host:</span>
              <Link href={`/u/${room.creator?.username}`} className={styles.creatorLink}>
                <UserAvatar user={room.creator} size="xs" />
                <span>@{room.creator?.username}</span>
                {room.creator?.role === 'admin' ? (
                  <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', fontWeight: 800, marginLeft: '4px' }}>HOST • ADMIN</span>
                ) : (
                  <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontWeight: 700, marginLeft: '4px' }}>HOST</span>
                )}
              </Link>
            </div>

            <div 
              className={`${styles.metaItem} ${styles.clickableMeta}`}
              onClick={() => { setActiveTab('members'); setMembersPage(1); }}
              title="Click to view all room members"
            >
              <Users size={15} style={{ color: '#22c55e' }} />
              <span>{room.members?.length || 1} Trainees</span>
            </div>

            <div className={styles.metaItem}>
              <Shield size={15} style={{ color: '#38bdf8' }} />
              <span>{room.moderators?.length || 1} Moderators</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation: Live Chat vs Topic Wall vs Members */}
        <div className={styles.tabBar}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={16} /> Live Room Chat ({messages.length})
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'discussion' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('discussion')}
          >
            <MessageSquareQuote size={16} /> Discussion Wall & Comments ({comments.length})
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'members' ? styles.activeTab : ''}`}
            onClick={() => { setActiveTab('members'); setMembersPage(1); }}
          >
            <Users size={16} /> View Members ({room.members?.length || 0})
          </button>
        </div>

        {/* TAB 1: Live Chat */}
        {activeTab === 'chat' && (
          <div className={styles.chatContainer}>
            <div 
              className={styles.chatMessages} 
              ref={messagesContainerRef}
              onScroll={handleScroll}
            >
              {messages.length === 0 ? (
                <div className={styles.emptyChat}>
                  <MessageCircle size={40} style={{ opacity: 0.4, marginBottom: '8px' }} />
                  <p>No messages yet in this room. Say hello to kick things off!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = String(msg.sender?._id || msg.sender) === currentUserId;
                  const isMod = (room.moderators || []).some(m => String(m._id || m) === String(msg.sender?._id || msg.sender));
                  const isRoomCreator = String(room.creator?._id || room.creator) === String(msg.sender?._id || msg.sender);
                  const hasLiked = (msg.likes || []).some(l => String(l) === currentUserId);
                  const canDelete = isMine || isCreator || isModerator;

                  return (
                    <div key={msg._id} className={`${styles.messageItem} ${isMine ? styles.myMsg : ''}`}>
                      {/* WhatsApp Hover Quick Actions */}
                      <div className={styles.msgHoverActions}>
                        <button 
                          type="button" 
                          onClick={() => handleLikeMessage(msg._id)}
                          className={`${styles.msgHoverBtn} ${hasLiked ? styles.liked : ''}`}
                          title="Like message"
                        >
                          <Heart size={12} fill={hasLiked ? '#f43f5e' : 'none'} />
                          {msg.likes?.length > 0 && <span style={{ fontSize: '0.7rem', marginLeft: '3px' }}>{msg.likes.length}</span>}
                        </button>

                        <button 
                          type="button" 
                          onClick={() => handleCopyMessage(msg)}
                          className={styles.msgHoverBtn}
                          title="Copy message"
                        >
                          {copiedId === msg._id ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                        </button>

                        <button 
                          type="button" 
                          onClick={() => setForwardModalMsg(msg)}
                          className={styles.msgHoverBtn}
                          title="Forward message to chats or rooms"
                        >
                          <Forward size={12} />
                        </button>

                        <button 
                          type="button" 
                          onClick={() => handleStartReply(msg)}
                          className={styles.msgHoverBtn}
                          title="Reply"
                        >
                          <CornerDownRight size={12} />
                        </button>

                        {isMine && (
                          <button 
                            type="button" 
                            onClick={() => handleStartEdit(msg)}
                            className={styles.msgHoverBtn}
                            title="Edit message"
                          >
                            <Edit2 size={12} />
                          </button>
                        )}

                        {canDelete && (
                          <button 
                            type="button" 
                            onClick={() => handleDeleteMessage(msg._id)}
                            className={styles.msgHoverBtn}
                            style={{ color: '#ef4444' }}
                            title="Delete message"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>

                      <UserAvatar user={msg.sender} size="sm" />
                      <div className={styles.msgBody}>
                        <div className={styles.msgSenderRow}>
                          <Link href={`/u/${msg.sender?.username}`} className={styles.msgAuthor}>
                            @{msg.sender?.username}
                          </Link>
                          {isRoomCreator && (
                            <span className={styles.hostBadge}>HOST</span>
                          )}
                          {isMod && !isRoomCreator && (
                            <span className={styles.modBadge}>MOD</span>
                          )}
                        </div>

                        {msg.replyTo && (
                          <div className={styles.replyBanner}>
                            Replying to @{msg.replyTo.senderName}: &quot;{msg.replyTo.textSnippet}&quot;
                          </div>
                        )}

                        <div className={styles.msgContent}>
                          {msg.isForwarded && (
                            <div className={styles.forwardedBadge}>
                              <Forward size={10} /> Forwarded
                            </div>
                          )}
                          {msg.text}

                          {/* Likes at bottom of chat message */}
                          <div className={styles.msgFooterRow}>
                            <button 
                              type="button" 
                              onClick={() => handleLikeMessage(msg._id)}
                              className={`${styles.msgLikeBtn} ${hasLiked ? styles.msgLikeBtnLiked : ''}`}
                              title={hasLiked ? "Unlike message" : "Like message"}
                            >
                              <Heart size={12} fill={hasLiked ? '#f43f5e' : 'none'} color={hasLiked ? '#f43f5e' : '#94a3b8'} />
                              <span>{msg.likes?.length > 0 ? msg.likes.length : ''}</span>
                            </button>

                            <div className={styles.msgTimeRow}>
                              {msg.isEdited && <span className={styles.msgEdited}>edited</span>}
                              <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {replyingToMsg && (
              <div className={styles.contextBar}>
                <span>Replying to @{replyingToMsg.sender?.username}: &quot;{replyingToMsg.text?.slice(0, 60)}&quot;</span>
                <button type="button" onClick={() => setReplyingToMsg(null)} className={styles.contextBarClose}><X size={14} /></button>
              </div>
            )}

            {editingMsg && (
              <div className={styles.contextBar} style={{ borderColor: '#f59e0b', color: '#fbbf24' }}>
                <span>Editing message...</span>
                <button type="button" onClick={() => { setEditingMsg(null); setText(''); }} className={styles.contextBarClose}><X size={14} /></button>
              </div>
            )}

            <form onSubmit={handleSendOrEditMessage} className={styles.chatInputForm}>
              <input 
                type="text"
                placeholder={editingMsg ? "Edit message..." : replyingToMsg ? `Reply to @${replyingToMsg.sender?.username}...` : "Share a tip, ask for advice, or chat..."}
                value={text}
                onChange={e => setText(e.target.value)}
                maxLength={2000}
              />
              <button type="submit" disabled={!text.trim() || sending} className={styles.sendBtn} title={editingMsg ? "Save edit" : "Send"}>
                {editingMsg ? <Check size={16} /> : <Send size={16} />}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: Discussion Wall & Comments */}
        {activeTab === 'discussion' && (
          <div className={styles.discussionContainer}>
            {/* Post a Comment / Topic Box */}
            <form onSubmit={handleAddComment} className={styles.commentForm}>
              <h4 style={{ margin: '0 0 10px', fontSize: '1.05rem', color: '#fff' }}>Post on the Room Wall</h4>
              <textarea 
                placeholder="Leave a detailed question, routine feedback, or discussion topic for all members..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                rows={3}
                maxLength={1500}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="submit" disabled={!commentText.trim() || submittingComment} className={styles.sendBtn} style={{ width: 'auto', borderRadius: '10px', padding: '0 18px', height: '38px' }}>
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>

            {/* Comments Stream */}
            <div className={styles.commentsList}>
              {comments.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '32px' }}>
                  No wall comments yet. Be the first to start a discussion thread!
                </p>
              ) : (
                comments.map(c => {
                  const hasLikedComment = (c.likes || []).some(l => String(l) === currentUserId);
                  const isCommentAuthor = String(c.user?._id || c.user) === currentUserId;
                  const canDeleteComment = isCommentAuthor || isCreator || isModerator;

                  return (
                    <div key={c._id} className={styles.commentCard}>
                      <div className={styles.commentHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <UserAvatar user={c.user} size="sm" />
                          <Link href={`/u/${c.user?.username}`} className={styles.msgAuthor}>
                            @{c.user?.username}
                          </Link>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {new Date(c.createdAt).toLocaleDateString()} at {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className={styles.commentText}>{c.text}</p>

                      <div className={styles.commentFooter}>
                        <button 
                          type="button" 
                          onClick={() => handleLikeComment(c._id)}
                          className={`${styles.commentActionBtn} ${hasLikedComment ? styles.liked : ''}`}
                        >
                          <Heart size={14} fill={hasLikedComment ? '#f43f5e' : 'none'} />
                          <span>{c.likes?.length || 0} Likes</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => setReplyingCommentId(replyingCommentId === c._id ? null : c._id)}
                          className={styles.commentActionBtn}
                        >
                          <CornerDownRight size={14} />
                          <span>Reply ({c.replies?.length || 0})</span>
                        </button>

                        {canDeleteComment && (
                          <button 
                            type="button" 
                            onClick={() => handleDeleteComment(c._id)}
                            className={styles.commentActionBtn}
                            style={{ color: '#ef4444', marginLeft: 'auto' }}
                            title="Delete comment"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* Threaded replies */}
                      {c.replies && c.replies.length > 0 && (
                        <div className={styles.repliesContainer}>
                          {c.replies.map(reply => (
                            <div key={reply._id} className={styles.replyItem}>
                              <div className={styles.replyHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <UserAvatar user={reply.user} size="xs" />
                                  <Link href={`/u/${reply.user?.username}`} className={styles.msgAuthor} style={{ fontSize: '0.82rem' }}>
                                    @{reply.user?.username}
                                  </Link>
                                </div>
                                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#cbd5e1' }}>{reply.text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {replyingCommentId === c._id && (
                        <div className={styles.replyForm}>
                          <input 
                            type="text"
                            placeholder={`Reply to @${c.user?.username}...`}
                            value={replyCommentText}
                            onChange={e => setReplyCommentText(e.target.value)}
                            className={styles.replyInput}
                            maxLength={1000}
                          />
                          <button 
                            type="button" 
                            onClick={() => handleAddReplyComment(c._id)}
                            disabled={!replyCommentText.trim() || submittingReply}
                            className={styles.sendBtn}
                            style={{ width: 'auto', borderRadius: '8px', padding: '0 14px', height: '34px', fontSize: '0.82rem' }}
                          >
                            Reply
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: View Room Members with Search & Pagination (10 per page) */}
        {activeTab === 'members' && (() => {
          const allMembers = room.members || [];
          const filteredMembers = allMembers.filter(m => {
            if (!membersSearch.trim()) return true;
            const q = membersSearch.toLowerCase();
            return (m.username || '').toLowerCase().includes(q) || (m.name || '').toLowerCase().includes(q);
          });

          const PAGE_SIZE = 10;
          const totalMemberPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
          const safePage = Math.min(Math.max(1, membersPage), totalMemberPages);
          const pagedMembers = filteredMembers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

          return (
            <div className={styles.membersContainer}>
              <div className={styles.membersHeader}>
                <div className={styles.membersSearchBox}>
                  <Search size={16} className={styles.membersSearchIcon} />
                  <input 
                    type="text"
                    placeholder="Search trainees in this room..."
                    value={membersSearch}
                    onChange={e => { setMembersSearch(e.target.value); setMembersPage(1); }}
                    className={styles.membersSearchInput}
                  />
                </div>
                <div className={styles.membersCountBadge}>
                  {filteredMembers.length} {filteredMembers.length === 1 ? 'Athlete' : 'Athletes'} in Room
                </div>
              </div>

              {filteredMembers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                  <Users size={36} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                  <p>No athletes found matching &quot;{membersSearch}&quot;.</p>
                </div>
              ) : (
                <div className={styles.membersGrid}>
                  {pagedMembers.map(member => {
                    const isRoomHost = String(room.creator?._id || room.creator) === String(member._id);
                    const isRoomMod = (room.moderators || []).some(m => String(m._id || m) === String(member._id));
                    const isMe = String(member._id) === currentUserId;

                    return (
                      <div key={member._id} className={styles.memberCard}>
                        <div className={styles.memberLeft}>
                          <UserAvatar user={member} size="sm" />
                          <div className={styles.memberInfo}>
                            <Link href={`/u/${member.username}`} className={styles.memberNameLink}>
                              @{member.username}
                            </Link>
                            <div className={styles.memberBadgeRow}>
                              {member.role === 'admin' ? (
                                <span className={styles.memberBadgeAdmin}>ADMIN</span>
                              ) : isRoomHost ? (
                                <span className={styles.memberBadgeHost}>HOST</span>
                              ) : isRoomMod ? (
                                <span className={styles.memberBadgeMod}>MOD</span>
                              ) : null}

                              {member.plan === 'max' && (
                                <span className={`${styles.memberBadgePlan} ${styles.planMax}`}>MAX</span>
                              )}
                              {member.plan === 'pro' && (
                                <span className={`${styles.memberBadgePlan} ${styles.planPro}`}>PRO</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {!isMe && (
                          <Link 
                            href={`/messages?user=${member.username}`} 
                            className={styles.memberDmBtn}
                            title={`Send direct message to @${member.username}`}
                          >
                            <MessageSquare size={13} />
                            <span>Message</span>
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination Controls (10 per page) */}
              {filteredMembers.length > PAGE_SIZE && (
                <div className={styles.membersPagination}>
                  <div className={styles.paginationInfo}>
                    Showing {(safePage - 1) * PAGE_SIZE + 1} - {Math.min(safePage * PAGE_SIZE, filteredMembers.length)} of {filteredMembers.length} athletes
                  </div>
                  <div className={styles.paginationControls}>
                    <button 
                      type="button" 
                      onClick={() => setMembersPage(p => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className={styles.pageNavBtn}
                    >
                      <ChevronLeft size={15} /> Prev
                    </button>
                    <span className={styles.pageIndicator}>
                      Page {safePage} of {totalMemberPages}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setMembersPage(p => Math.min(totalMemberPages, p + 1))}
                      disabled={safePage >= totalMemberPages}
                      className={styles.pageNavBtn}
                    >
                      Next <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </main>

      {/* FORWARD MESSAGE MODAL */}
      {forwardModalMsg && (
        <div className={styles.modalOverlay} onClick={() => setForwardModalMsg(null)}>
          <div className={styles.forwardModal} onClick={e => e.stopPropagation()}>
            <div className={styles.forwardModalHeader}>
              <div className={styles.forwardModalTitle}>
                <Forward size={18} style={{ color: '#38bdf8' }} /> Forward Message
              </div>
              <button 
                type="button" 
                onClick={() => setForwardModalMsg(null)} 
                className={styles.forwardCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.forwardSnippet}>
              &quot;{forwardModalMsg.text?.slice(0, 90)}{forwardModalMsg.text?.length > 90 ? '...' : ''}&quot;
            </div>

            {forwardSuccess && (
              <div className={styles.forwardSuccessBanner}>
                <Check size={16} /> {forwardSuccess}
              </div>
            )}

            <div className={styles.forwardTabs}>
              <button 
                type="button" 
                className={`${styles.forwardTabBtn} ${forwardTab === 'dms' ? styles.forwardTabBtnActive : ''}`}
                onClick={() => setForwardTab('dms')}
              >
                <MessageSquare size={14} /> Direct Chats
              </button>
              <button 
                type="button" 
                className={`${styles.forwardTabBtn} ${forwardTab === 'rooms' ? styles.forwardTabBtnActive : ''}`}
                onClick={() => setForwardTab('rooms')}
              >
                <Users size={14} /> Community Rooms
              </button>
            </div>

            {/* TAB: Direct Chats */}
            {forwardTab === 'dms' && (
              <div className={styles.forwardList}>
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
                  <input 
                    type="text"
                    placeholder="Search any athlete to forward..."
                    value={forwardUserSearch}
                    onChange={e => setForwardUserSearch(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '7px 12px 7px 32px', borderRadius: '8px', fontSize: '0.82rem', outline: 'none' }}
                  />
                </div>

                {/* Search Results */}
                {forwardUserResults.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Search Results</div>
                    {forwardUserResults.map(u => (
                      <div key={u._id} className={styles.forwardItem}>
                        <div className={styles.forwardItemInfo}>
                          <UserAvatar user={u} size="xs" />
                          <div className={styles.forwardItemText}>
                            <span className={styles.forwardItemTitle}>@{u.username}</span>
                            <span className={styles.forwardItemSubtitle}>{u.role || 'Athlete'}</span>
                          </div>
                        </div>
                        <button 
                          type="button"
                          disabled={forwardLoading}
                          onClick={() => handleForwardMessage('user', u._id, u.username)}
                          className={styles.forwardSendBtn}
                        >
                          Send
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Active Conversations */}
                {forwardConvs.map(conv => {
                  const other = (conv.participants || []).find(p => String(p._id) !== currentUserId) || {};
                  return (
                    <div key={conv._id} className={styles.forwardItem}>
                      <div className={styles.forwardItemInfo}>
                        <UserAvatar user={other} size="xs" />
                        <div className={styles.forwardItemText}>
                          <span className={styles.forwardItemTitle}>@{other.username || 'user'}</span>
                          <span className={styles.forwardItemSubtitle}>Direct Message</span>
                        </div>
                      </div>
                      <button 
                        type="button"
                        disabled={forwardLoading}
                        onClick={() => handleForwardMessage('conv', conv._id, other.username)}
                        className={styles.forwardSendBtn}
                      >
                        Send
                      </button>
                    </div>
                  );
                })}

                {forwardConvs.length === 0 && forwardUserResults.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem', margin: '20px 0' }}>
                    Type an athlete username above to send.
                  </p>
                )}
              </div>
            )}

            {/* TAB: Community Rooms */}
            {forwardTab === 'rooms' && (
              <div className={styles.forwardList}>
                {forwardRooms.map(rm => (
                  <div key={rm._id} className={styles.forwardItem}>
                    <div className={styles.forwardItemInfo}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                        <Users size={16} />
                      </div>
                      <div className={styles.forwardItemText}>
                        <span className={styles.forwardItemTitle}>{rm.title}</span>
                        <span className={styles.forwardItemSubtitle}>{rm.members?.length || 1} members</span>
                      </div>
                    </div>
                    <button 
                      type="button"
                      disabled={forwardLoading}
                      onClick={() => handleForwardMessage('room', rm._id, rm.title)}
                      className={styles.forwardSendBtn}
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

      {/* Edit Room, Moderators & Members Modal */}
      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Room Settings & Moderation</h3>
              <button onClick={() => setShowEditModal(false)} className={styles.closeBtn}><X size={20} /></button>
            </div>

            <form onSubmit={handleEditRoomSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Room Title</label>
                <input 
                  type="text"
                  required
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  maxLength={100}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Subtitle</label>
                <input 
                  type="text"
                  value={editForm.subtitle}
                  onChange={e => setEditForm({ ...editForm, subtitle: e.target.value })}
                  maxLength={200}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea 
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  maxLength={1000}
                />
              </div>

              <div className={styles.formGroup}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={editForm.isPrivate}
                    onChange={e => setEditForm({ ...editForm, isPrivate: e.target.checked })}
                  />
                  <span>Private Room (Requires Invite Link to join)</span>
                </label>
              </div>

              {editError && <p className={styles.errorText}>{editError}</p>}

              <button type="submit" disabled={editing} className={styles.submitBtn}>
                {editing ? 'Saving...' : 'Save Details'}
              </button>
            </form>

            {/* Moderators & Members Management */}
            {isCreator && (
              <div className={styles.modSection}>
                <h4 style={{ margin: '0 0 10px', fontSize: '1rem', color: '#38bdf8' }}>Manage Members & Moderators</h4>
                <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  Promote trusted members to moderators or remove members from this room.
                </p>

                <div className={styles.modList}>
                  {room.members?.map(member => {
                    const isUserMod = (room.moderators || []).some(m => String(m._id || m) === String(member._id));
                    const isUserCreator = String(room.creator?._id || room.creator) === String(member._id);

                    if (isUserCreator) return null;

                    return (
                      <div key={member._id} className={styles.modItem}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <UserAvatar user={member} size="xs" />
                          <span style={{ fontSize: '0.88rem', color: '#fff' }}>@{member.username}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {isUserMod ? (
                            <button 
                              type="button" 
                              onClick={() => handleRemoveModerator(member._id)}
                              className={styles.demoteBtn}
                            >
                              Demote Mod
                            </button>
                          ) : (
                            <button 
                              type="button" 
                              onClick={() => handleAddModerator(member._id)}
                              className={styles.promoteBtn}
                            >
                              Make Mod
                            </button>
                          )}

                          <button 
                            type="button" 
                            onClick={() => handleKickMember(member._id)}
                            className={styles.kickBtn}
                            title="Remove member"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
