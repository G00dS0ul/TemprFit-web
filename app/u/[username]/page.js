'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import UserAvatar from '@/components/UserAvatar';
import { BADGES } from '@/lib/badges';
import { 
  Activity, Flame, Medal, Star, Trophy, MapPin, 
  User as UserIcon, Target, Users, MessageSquare, 
  Lock, Gift, ArrowRight, ShieldCheck, Sparkles, 
  Heart, UserPlus, UserCheck, Briefcase, Smile, Award, Calendar
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';
import { formatNumberCompact } from '@/lib/utils';
import styles from './page.module.css';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username;
  const { showToast } = useToast();
  
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [pods, setPods] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [messageXpFee, setMessageXpFee] = useState(0);

  // Social interactions: Follow & Like
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Message modal state
  const [startingChat, setStartingChat] = useState(false);
  const [xpPrompt, setXpPrompt] = useState(null); // { fee, recipientUsername, senderXp, canAfford }
  const [chatError, setChatError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = () => {
    fetch(`/api/users/${username}`)
      .then(async r => {
        const data = await r.json();
        if (r.status === 403 && data.isPrivate) {
          setIsPrivate(true);
          setProfile(data.user);
        } else if (data.user) {
          setProfile(data.user);
          setStats(data.stats);
          setPods(data.pods || []);
          setRooms(data.rooms || []);
          setMoments(data.moments || []);
          setIsOwner(data.isOwner || false);
          setIsFollowing(Boolean(data.isFollowing));
          setFollowersCount(data.followersCount || 0);
          setFollowingCount(data.followingCount || 0);
          setHasLiked(Boolean(data.hasLiked));
          setLikesCount(data.likesCount || 0);
          setMessageXpFee(data.messageXpFee || 0);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleToggleFollow = async () => {
    if (!profile?._id || followLoading) return;
    setFollowLoading(true);

    const prevFollowing = isFollowing;
    const prevCount = followersCount;

    // Optimistic toggle
    setIsFollowing(!prevFollowing);
    setFollowersCount(prevFollowing ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await fetch(`/api/users/${profile._id}/follow`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.followersCount);
        showToast(data.isFollowing ? `Now following @${profile.username}!` : `Unfollowed @${profile.username}`, 'success');
      } else if (data.error) {
        // Revert on error
        setIsFollowing(prevFollowing);
        setFollowersCount(prevCount);
        showToast(data.error, 'error');
      }
    } catch (err) {
      console.error(err);
      setIsFollowing(prevFollowing);
      setFollowersCount(prevCount);
      showToast('Connection error while toggling follow', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleToggleLike = async () => {
    if (!profile?._id || likeLoading) return;
    setLikeLoading(true);

    const prevLiked = hasLiked;
    const prevCount = likesCount;

    // Optimistic toggle
    setHasLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await fetch(`/api/users/${profile._id}/like`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setHasLiked(data.hasLiked);
        setLikesCount(data.likesCount);
        showToast(data.hasLiked ? `Liked @${profile.username}'s profile! ❤️` : 'Unliked profile', 'success');
      } else if (data.error) {
        // Revert on error
        setHasLiked(prevLiked);
        setLikesCount(prevCount);
        showToast(data.error, 'error');
      }
    } catch (err) {
      console.error(err);
      setHasLiked(prevLiked);
      setLikesCount(prevCount);
      showToast('Connection error while toggling like', 'error');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleStartChat = async (confirmPayment = false) => {
    if (!profile?._id) return;
    setStartingChat(true);
    setChatError('');

    try {
      const res = await fetch('/api/messages/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          targetUserId: profile._id,
          confirmXpPayment: confirmPayment
        })
      });

      const data = await res.json();

      if (res.status === 402 && data.requiresXpFee) {
        setXpPrompt(data);
        setStartingChat(false);
        return;
      }

      if (data.conversationId) {
        router.push(`/messages?convId=${data.conversationId}`);
      } else if (data.error) {
        setChatError(data.error);
        setStartingChat(false);
      }
    } catch (err) {
      setChatError('Failed to start chat. Please try again.');
      setStartingChat(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <div className={styles.content}>
          <div className="container"><p>Loading profile...</p></div>
        </div>
      </div>
    );
  }

  if (isPrivate) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <div className={styles.content}>
          <div className="container" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
            <div style={{ background: 'var(--color-surface)', padding: '40px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ width: '64px', height: '64px', margin: '0 auto 20px', borderRadius: '50%', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={32} />
              </div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', color: '#fff' }}>Profile is Private</h2>
              <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
                @{profile?.username || username} has set their profile visibility to private. Only they can view their fitness stats, badges, and activity history.
              </p>
              <Link href="/dashboard" style={{ background: 'var(--color-primary)', color: '#000', padding: '10px 24px', borderRadius: '8px', fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <div className={styles.content}>
          <div className="container" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
            <h2>User not found</h2>
            <p>The user &quot;{username}&quot; does not exist.</p>
            <Link href="/dashboard" style={{ marginTop: '16px', display: 'inline-block', color: 'var(--color-primary)' }}>
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ownedBadgeIds = new Set(profile.badges?.map(b => b.badgeId) || []);
  const ownedBadges = BADGES.filter(b => ownedBadgeIds.has(b.id));

  return (
    <div className={styles.page}>
      <Sidebar />
      <div className={styles.content}>
        <div className="container">
          
          {/* Main User Card */}
          <div className={`${styles.profileCard} ${profile.activeBorder ? `bg-effect-${profile.activeBorder}` : ''}`}>
            <UserAvatar user={profile} size="xl" disableLightbox={false} />
            
            <h1 
              className={styles.username}
              style={{ color: profile.activeColor ? profile.activeColor : 'inherit' }}
            >
              {profile.username}
            </h1>

            {profile.profession && (
              <div style={{ color: '#38bdf8', fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>
                <Briefcase size={14} style={{ display: 'inline', marginRight: '6px' }} />
                {profile.profession}
              </div>
            )}
            
            {profile.plan !== 'free' && (
              <div className={`${styles.planBadge} ${profile.plan === 'max' ? styles.max : ''}`}>
                {profile.plan.toUpperCase()} TIER
              </div>
            )}

            {/* Social Follow & Like Counter Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', color: '#cbd5e1' }}>
                <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{formatNumberCompact(followersCount)}</strong> Followers
              </div>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', color: '#cbd5e1' }}>
                <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{formatNumberCompact(followingCount)}</strong> Following
              </div>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', color: '#f43f5e' }}>
                <Heart size={15} fill={hasLiked ? '#f43f5e' : 'none'} />
                <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{formatNumberCompact(likesCount)}</strong> Likes
              </div>
            </div>

            {/* User Bio / Intro */}
            {profile.bio ? (
              <p style={{ maxWidth: '640px', color: '#e2e8f0', fontSize: '1rem', lineHeight: '1.6', margin: '0 auto 24px', background: 'rgba(255,255,255,0.03)', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                &ldquo;{profile.bio}&rdquo;
              </p>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '20px' }}>
                No bio written yet.
              </p>
            )}

            {/* Action Buttons: Follow, Like, Message */}
            {!isOwner ? (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px' }}>
                {/* Follow Button */}
                <button
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  style={{
                    background: isFollowing ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: isFollowing ? '#fff' : '#000',
                    border: isFollowing ? '1px solid rgba(255,255,255,0.2)' : 'none',
                    padding: '10px 22px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s'
                  }}
                >
                  {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                  <span>{isFollowing ? 'Following' : 'Follow'}</span>
                </button>

                {/* Like Profile Button */}
                <button
                  onClick={handleToggleLike}
                  disabled={likeLoading}
                  style={{
                    background: hasLiked ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255,255,255,0.08)',
                    color: hasLiked ? '#f43f5e' : '#fff',
                    border: hasLiked ? '1px solid rgba(244, 63, 94, 0.5)' : '1px solid rgba(255,255,255,0.15)',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Heart size={16} fill={hasLiked ? '#f43f5e' : 'none'} />
                  <span>{hasLiked ? 'Liked' : 'Like Profile'}</span>
                </button>

                {/* Direct Message Button */}
                <button
                  onClick={() => handleStartChat(false)}
                  disabled={startingChat}
                  style={{
                    background: messageXpFee > 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(56, 189, 248, 0.15)',
                    color: messageXpFee > 0 ? '#000' : '#38bdf8',
                    border: messageXpFee > 0 ? 'none' : '1px solid rgba(56, 189, 248, 0.35)',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
                  }}
                >
                  <MessageSquare size={16} />
                  <span>
                    {messageXpFee > 0 ? `Message (${messageXpFee} XP Gift)` : 'Send Direct Message'}
                  </span>
                </button>
              </div>
            ) : (
              <div style={{ marginBottom: '24px' }}>
                <Link 
                  href="/settings" 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    background: 'rgba(255,255,255,0.08)', 
                    border: '1px solid rgba(255,255,255,0.15)', 
                    color: '#fff', 
                    padding: '8px 20px', 
                    borderRadius: '10px', 
                    textDecoration: 'none', 
                    fontSize: '0.9rem', 
                    fontWeight: 600 
                  }}
                >
                  Edit Profile & Hobbies
                </Link>
              </div>
            )}

            {chatError && (
              <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '16px' }}>{chatError}</p>
            )}

            {/* Demographics row */}
            {(() => {
              const userAge = profile.age ?? profile.fitnessProfile?.bodyMetrics?.age ?? profile.fitnessProfile?.age ?? null;
              return (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px', fontSize: '0.9rem' }}>
                  {/* Age */}
                  {userAge ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', padding: '5px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Calendar size={14} style={{ color: '#38bdf8' }} /> 
                      <span style={{ color: '#fff', fontWeight: 600 }}>{userAge} yrs old</span>
                    </div>
                  ) : isOwner ? (
                    <Link href="/settings" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.1)', border: '1px dashed rgba(245, 158, 11, 0.4)', padding: '5px 14px', borderRadius: '20px', color: '#fbbf24', textDecoration: 'none', fontSize: '0.85rem' }}>
                      <Calendar size={14} />
                      <span>+ Add Age in Settings</span>
                    </Link>
                  ) : null}

                  {/* Sex / Gender */}
                  {profile.sex && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', padding: '5px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <UserIcon size={14} style={{ color: '#a855f7' }} /> 
                      <span style={{ color: '#fff', textTransform: 'capitalize' }}>{profile.sex}</span>
                    </div>
                  )}

                  {/* Country */}
                  {profile.fitnessProfile?.country && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', padding: '5px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <MapPin size={14} style={{ color: '#22c55e' }} /> 
                      <span style={{ color: '#fff' }}>{profile.fitnessProfile.country}</span>
                    </div>
                  )}

                  {/* Primary Goal */}
                  {profile.fitnessProfile?.primaryGoal && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', padding: '5px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Target size={14} style={{ color: '#f59e0b' }} /> 
                      <span style={{ color: '#fff', textTransform: 'capitalize' }}>{profile.fitnessProfile.primaryGoal.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Stats Overview */}
            {stats && (
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: '#fbbf24' }} title={`Exact XP: ${Number(profile.xp || 0).toLocaleString()}`}>
                    {formatNumberCompact(profile.xp || 0)}
                  </div>
                  <div className={styles.statLabel}>Total XP</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: '#3b82f6' }} title={`Exact Volume: ${Number(stats.totalVolume || 0).toLocaleString()} kg`}>
                    {formatNumberCompact(stats.totalVolume || 0)}
                  </div>
                  <div className={styles.statLabel}>Volume (kg)</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: '#10b981' }}>
                    {formatNumberCompact(stats.sessions || 0)}
                  </div>
                  <div className={styles.statLabel}>Workouts</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: '#ef4444' }}>
                    {formatNumberCompact(Math.max(profile.currentStreak || 0, profile.totalCheckInStreak || 0))}
                  </div>
                  <div className={styles.statLabel}>Day Streak</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: '#a855f7' }}>
                    {formatNumberCompact(Math.max(profile.longestStreak || 0, profile.longestCheckInStreak || 0))}
                  </div>
                  <div className={styles.statLabel}>Best Streak</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue} style={{ color: '#06b6d4', fontSize: '1.2rem' }}>
                    {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </div>
                  <div className={styles.statLabel}>Joined</div>
                </div>
              </div>
            )}
          </div>

          {/* Hobbies & Talents Showcase */}
          {((profile.hobbies && profile.hobbies.length > 0) || (profile.talents && profile.talents.length > 0)) && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Interests & Talents</h2>
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {profile.hobbies && profile.hobbies.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Smile size={16} /> Hobbies & Activities
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {profile.hobbies.map((h, i) => (
                        <span key={i} style={{ background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', padding: '6px 14px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600 }}>
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.talents && profile.talents.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Award size={16} /> Special Skills & Talents
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {profile.talents.map((t, i) => (
                        <span key={i} style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', padding: '6px 14px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User's Community & Chat Rooms */}
          <div className={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Community Rooms</h2>
              <Link href="/rooms" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                Explore All Rooms →
              </Link>
            </div>
            {rooms.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)' }}>This user hasn&apos;t joined or created any community rooms yet.</p>
            ) : (
              <div className={styles.badgesGrid}>
                {rooms.map(room => (
                  <Link href={`/rooms/${room._id}`} key={room._id} style={{ textDecoration: 'none' }}>
                    <div className={styles.badgeCard} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div className={styles.badgeIconWrap} style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8' }}>
                          <MessageSquare size={20} />
                        </div>
                        {room.isPreset && (
                          <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 700 }}>
                            OFFICIAL
                          </span>
                        )}
                      </div>
                      <h3 className={styles.badgeName} style={{ margin: '0 0 6px', fontSize: '1rem', color: '#fff' }}>{room.title}</h3>
                      {room.subtitle && (
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 10px', lineHeight: '1.4' }}>{room.subtitle}</p>
                      )}
                      <div style={{ marginTop: 'auto', fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
                        {room.isCreator ? '👑 Room Host' : 'Member'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Trophy Case */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Trophy Case</h2>
            {ownedBadges.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)' }}>This user hasn&apos;t unlocked any badges yet.</p>
            ) : (
              <div className={styles.badgesGrid}>
                {ownedBadges.map(badge => {
                  const Icon = badge.icon;
                  return (
                    <div key={badge.id} className={styles.badgeCard}>
                      <div className={styles.badgeIconWrap} style={{ color: badge.color }}>
                        <Icon size={24} />
                      </div>
                      <h3 className={styles.badgeName}>{badge.name}</h3>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Joined Pods */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Joined Pods</h2>
            {pods.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)' }}>This user hasn&apos;t joined any pods yet.</p>
            ) : (
              <div className={styles.badgesGrid}>
                {pods.map(pod => (
                  <Link href={`/pods?id=${pod._id}`} key={pod._id} style={{ textDecoration: 'none' }}>
                    <div className={styles.badgeCard}>
                      <div className={styles.badgeIconWrap} style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                        <Users size={24} />
                      </div>
                      <h3 className={styles.badgeName}>{pod.name}</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{pod.isPrivate ? 'Private' : 'Public'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* XP Fee Confirmation Modal */}
      {xpPrompt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--color-surface, #1e293b)',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '32px',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Gift size={28} />
            </div>

            <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '8px' }}>XP Gift Required</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '20px' }}>
              <strong>@{xpPrompt.recipientUsername}</strong> is a Max member and has locked their direct messages. To initiate a conversation, you must send a gift of <strong>{xpPrompt.fee} XP</strong>.
            </p>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '10px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Your Current XP:</span>
              <span style={{ color: xpPrompt.canAfford ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                {xpPrompt.senderXp} XP
              </span>
            </div>

            {xpPrompt.canAfford ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setXpPrompt(null)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setXpPrompt(null);
                    handleStartChat(true);
                  }}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', fontWeight: 700, cursor: 'pointer' }}
                >
                  Send {xpPrompt.fee} XP & Chat
                </button>
              </div>
            ) : (
              <div>
                <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '16px' }}>
                  You don't have enough XP ({xpPrompt.senderXp}/{xpPrompt.fee} XP). Log workouts or complete streaks to earn more XP!
                </p>
                <button
                  onClick={() => setXpPrompt(null)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: '#fff', cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
