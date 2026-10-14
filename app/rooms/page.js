'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import UserAvatar from '@/components/UserAvatar';
import Link from 'next/link';
import { 
  MessageSquare, Plus, Search, Users, Shield, 
  Sparkles, MessageCircle, ArrowRight, Lock, 
  Settings, Check, X, Filter 
} from 'lucide-react';
import styles from './rooms.module.css';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, my_rooms, joined
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    isPrivate: false,
    icon: 'Flame',
    coverGradient: 'from-blue-600 to-indigo-900'
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    fetchRooms();
  }, [filter]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('q', search);
      if (filter !== 'all') query.append('filter', filter);

      const res = await fetch(`/api/rooms?${query.toString()}`);
      const data = await res.json();
      if (data.rooms) setRooms(data.rooms);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRooms();
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) return;

    setCreating(true);
    setCreateError('');

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });
      const data = await res.json();
      if (data.success && data.room) {
        setShowCreateModal(false);
        setCreateForm({
          title: '',
          subtitle: '',
          description: '',
          isPrivate: false,
          icon: 'Flame',
          coverGradient: 'from-blue-600 to-indigo-900'
        });
        fetchRooms();
      } else {
        setCreateError(data.error || 'Failed to create room');
      }
    } catch (err) {
      setCreateError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <Sidebar />

      <main className={styles.mainContent}>
        <div className="container">
          
          {/* Header Banner */}
          <div className={styles.header}>
            <div>
              <div className={styles.badge}>
                <Sparkles size={14} /> Community Hub & Live Rooms
              </div>
              <h1 className={styles.title}>Fitness Chat & Discussion Rooms</h1>
              <p className={styles.subtitle}>
                Create live workout rooms, debate nutrition routines, assign moderators, and chat securely with trainees worldwide.
              </p>
            </div>

            <button 
              className={styles.createBtn}
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={18} />
              <span>Create New Room</span>
            </button>
          </div>

          {/* Search and Filters Bar */}
          <div className={styles.controlsBar}>
            <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
              <Search size={18} className={styles.searchIcon} />
              <input 
                type="text"
                placeholder="Search rooms by title, subtitle, or topic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
              <button type="submit" className={styles.searchBtn}>Search</button>
            </form>

            <div className={styles.filterPills}>
              <button 
                className={`${styles.filterPill} ${filter === 'all' ? styles.activeFilter : ''}`}
                onClick={() => setFilter('all')}
              >
                All Rooms
              </button>
              <button 
                className={`${styles.filterPill} ${filter === 'joined' ? styles.activeFilter : ''}`}
                onClick={() => setFilter('joined')}
              >
                Joined Rooms
              </button>
              <button 
                className={`${styles.filterPill} ${filter === 'my_rooms' ? styles.activeFilter : ''}`}
                onClick={() => setFilter('my_rooms')}
              >
                My Created Rooms
              </button>
            </div>
          </div>

          {/* Room Cards Grid */}
          {loading ? (
            <div className={styles.loadingState}>
              <p>Loading community rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className={styles.emptyState}>
              <MessageSquare size={48} className={styles.emptyIcon} />
              <h3>No rooms found</h3>
              <p>Be the first to create a discussion room and build your fitness tribe!</p>
              <button 
                className={styles.createBtn} 
                onClick={() => setShowCreateModal(true)}
                style={{ marginTop: '16px' }}
              >
                <Plus size={16} /> Create Room
              </button>
            </div>
          ) : (
            <div className={styles.roomGrid}>
              {rooms.map(room => (
                <div key={room._id} className={styles.roomCard}>
                  <div className={styles.cardHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={styles.iconBadge}>
                        <MessageCircle size={18} />
                      </span>
                      {room.isPrivate && (
                        <span className={styles.privateBadge}>
                          <Lock size={12} /> Private
                        </span>
                      )}
                    </div>

                    <div className={styles.memberCount}>
                      <Users size={14} /> {room.memberCount || 1} members
                    </div>
                  </div>

                  <h3 className={styles.roomTitle}>{room.title}</h3>
                  {room.subtitle && (
                    <p className={styles.roomSubtitle}>{room.subtitle}</p>
                  )}
                  {room.description && (
                    <p className={styles.roomDesc}>{room.description}</p>
                  )}

                  <div className={styles.cardFooter}>
                    <div className={styles.creatorInfo}>
                      <UserAvatar user={room.creator} size="sm" />
                      <span>@{room.creator?.username}</span>
                    </div>

                    <Link href={`/rooms/${room._id}`} className={styles.joinLink}>
                      <span>{room.isMember ? 'Enter Room' : 'Join Room'}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Create Community Room</h3>
              <button onClick={() => setShowCreateModal(false)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Room Title *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. 5AM Club • Heavy Squats & Deadlifts"
                  value={createForm.title}
                  onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                  maxLength={100}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Subtitle / Tagline</label>
                <input 
                  type="text"
                  placeholder="e.g. Powerlifters sharing PR clips and form feedback"
                  value={createForm.subtitle}
                  onChange={e => setCreateForm({ ...createForm, subtitle: e.target.value })}
                  maxLength={200}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Room Description & Rules</label>
                <textarea 
                  placeholder="Introduce the purpose of this room, daily topics, and community guidelines..."
                  value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={4}
                  maxLength={1000}
                />
              </div>

              <div className={styles.formGroupCheckbox}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    checked={createForm.isPrivate}
                    onChange={e => setCreateForm({ ...createForm, isPrivate: e.target.checked })}
                  />
                  <span>Make this room invite-only (Private)</span>
                </label>
              </div>

              {createError && (
                <p className={styles.errorText}>{createError}</p>
              )}

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating || !createForm.title.trim()}
                  className={styles.submitBtn}
                >
                  {creating ? 'Creating Room...' : 'Launch Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
