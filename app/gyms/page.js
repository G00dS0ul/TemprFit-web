'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  MapPin, Search, Navigation, Phone, Clock, Star,
  CheckCircle2, Users, ExternalLink, Loader2, Compass
} from 'lucide-react';
import InteractiveMap from '@/components/GymMap/InteractiveMap';
import styles from './page.module.css';

export default function GymsPage() {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('all'); // 'all' | 'verified'
  const [selectedGym, setSelectedGym] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [isSearchingArea, setIsSearchingArea] = useState(false);

  const fetchGyms = async (coords = null, query = '', city = '', verifiedOnly = false) => {
    setLoading(true);
    setErrorMsg('');
    try {
      let url = '/api/gyms?';
      // If a specific query or city is provided, focus the search on that location rather than forcing GPS coords
      if (coords && !query && !city) {
        url += `lat=${coords.lat}&lng=${coords.lng}&`;
      }
      if (query) {
        url += `q=${encodeURIComponent(query)}&`;
      }
      if (city) {
        url += `city=${encodeURIComponent(city)}&`;
      }
      if (verifiedOnly) {
        url += `verified=true&`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.gyms) {
        setGyms(data.gyms);
        if (data.gyms.length > 0) {
          setSelectedGym(data.gyms[0]);
        }
      }
    } catch (err) {
      setErrorMsg('Failed to load gyms. Please try again.');
    } finally {
      setLoading(false);
      setIsSearchingArea(false);
    }
  };

  // Called when user drags/pans the map to another part of the city or world
  const handleMapMoveEnd = ({ lat, lng }) => {
    setIsSearchingArea(true);
    fetchGyms({ lat, lng }, searchQuery, selectedCity, verifiedFilter === 'verified');
  };

  const [nearbyAthletes, setNearbyAthletes] = useState([]);
  const [activeTab, setActiveTab] = useState('gyms'); // 'gyms' | 'athletes'

  const fetchNearbyAthletes = async (coords = null) => {
    try {
      let url = '/api/gyms/live-users';
      if (coords) url += `?lat=${coords.lat}&lng=${coords.lng}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.athletes) {
        setNearbyAthletes(data.athletes);
      }
    } catch {}
  };

  const syncUserLiveLocation = async (coords) => {
    try {
      await fetch('/api/gyms/live-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: coords.lat, lng: coords.lng, share: true }),
      });
    } catch {}
  };

  useEffect(() => {
    fetchGyms(null, '', '', false);
    fetchNearbyAthletes();
    
    // Automatically query user's live location on first page visit if browser allows
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);
          fetchGyms(coords, searchQuery, selectedCity, verifiedFilter === 'verified');
          fetchNearbyAthletes(coords);
          syncUserLiveLocation(coords);
        },
        () => {},
        { timeout: 8000 }
      );
    }
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setLocating(false);
        fetchGyms(coords, searchQuery, selectedCity, verifiedFilter === 'verified');
        fetchNearbyAthletes(coords);
        syncUserLiveLocation(coords);
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err);
        setLocating(false);
        alert('Could not get your live location. You can search any city, state, or country worldwide.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchGyms(userLocation, searchQuery, selectedCity, verifiedFilter === 'verified');
  };

  const handleVerifiedToggle = (type) => {
    setVerifiedFilter(type);
    fetchGyms(userLocation, searchQuery, selectedCity, type === 'verified');
  };

  const activeGym = selectedGym || gyms[0];
  const activeCoords = activeGym?.location?.coordinates || (userLocation ? [userLocation.lng, userLocation.lat] : [3.4735, 6.4474]);
  const mapLng = activeCoords[0];
  const mapLat = activeCoords[1];

  const [mapType, setMapType] = useState('google'); // 'google' | 'osm'

  // Live map URLs
  const googleMapsDirectionsUrl = userLocation && activeGym
    ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${mapLat},${mapLng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${mapLat},${mapLng}`;

  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeGym?.name || 'Gyms')}+${mapLat},${mapLng}`;
  const googleMapsNearMeUrl = userLocation
    ? `https://www.google.com/maps/search/gyms+fitness/@${userLocation.lat},${userLocation.lng},14z`
    : `https://www.google.com/maps/search/gyms+near+me`;
  
  // Real Google Maps Live Embed with zoom & street view controls
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${mapLat},${mapLng}&z=15&output=embed`;

  // Real OpenStreetMap embed centered on the exact gym point
  const bbox = `${mapLng - 0.015},${mapLat - 0.015},${mapLng + 0.015},${mapLat + 0.015}`;
  const embedOsmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${mapLat},${mapLng}`;

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.badge}>
            <Compass size={14} /> LIVE GYM LOCATOR & HUBS
          </div>
          <h1>Find Gyms & Workout Rooms Near You</h1>
          <p>
            Explore verified fitness spaces, powerlifting boxes, and local community workout groups with real equipment and directions.
          </p>
        </div>

        {/* Filter / Search Bar */}
        <div className={styles.searchBarContainer}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.inputWrap}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search any gym, city, state, or country worldwide (e.g. Lagos, London, New York)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                fetchGyms(null, searchQuery, e.target.value, verifiedFilter === 'verified');
              }}
              className={styles.citySelect}
            >
              <option value="">🌍 Worldwide (All Cities & Countries)</option>
              <optgroup label="📍 Nigeria (Local)">
                <option value="Lagos">Lagos (All Areas)</option>
                <option value="Ejigbo">Ejigbo / Isolo / Ikotun (Local Hub)</option>
                <option value="Surulere">Surulere, Lagos</option>
                <option value="Ikeja">Ikeja / Mainland, Lagos</option>
                <option value="Lekki">Lekki / Victoria Island, Lagos</option>
                <option value="Abuja">Abuja, FCT</option>
                <option value="Port Harcourt">Port Harcourt, Rivers</option>
                <option value="Ibadan">Ibadan, Oyo</option>
              </optgroup>
              <optgroup label="🇨🇦 Canada">
                <option value="Toronto">Toronto, Ontario</option>
                <option value="Vancouver">Vancouver, BC</option>
                <option value="Montreal">Montreal, Quebec</option>
                <option value="Calgary">Calgary, Alberta</option>
                <option value="Ottawa">Ottawa, Ontario</option>
              </optgroup>
              <optgroup label="🇺🇸 United States">
                <option value="New York">New York City, NY</option>
                <option value="Los Angeles">Los Angeles, CA</option>
                <option value="Miami">Miami, FL</option>
                <option value="Houston">Houston, TX</option>
                <option value="Chicago">Chicago, IL</option>
                <option value="Atlanta">Atlanta, GA</option>
              </optgroup>
              <optgroup label="🇦🇪 United Arab Emirates">
                <option value="Dubai">Dubai, UAE</option>
                <option value="Abu Dhabi">Abu Dhabi, UAE</option>
              </optgroup>
              <optgroup label="🇬🇧 United Kingdom & Europe">
                <option value="London">London, UK</option>
                <option value="Manchester">Manchester, UK</option>
                <option value="Birmingham">Birmingham, UK</option>
                <option value="Paris">Paris, France</option>
                <option value="Berlin">Berlin, Germany</option>
              </optgroup>
              <optgroup label="🌍 Africa">
                <option value="Accra">Accra, Ghana</option>
                <option value="Nairobi">Nairobi, Kenya</option>
                <option value="Johannesburg">Johannesburg, South Africa</option>
                <option value="Cairo">Cairo, Egypt</option>
              </optgroup>
              <optgroup label="🌏 Asia & Pacific">
                <option value="Tokyo">Tokyo, Japan</option>
                <option value="Sydney">Sydney, Australia</option>
                <option value="Singapore">Singapore</option>
              </optgroup>
            </select>
            <button type="submit" className={styles.searchBtn}>Search Global</button>
          </form>

          <button
            type="button"
            onClick={handleGetLocation}
            disabled={locating}
            className={styles.geoBtn}
          >
            {locating ? <Loader2 size={16} className={styles.spin} /> : <Navigation size={16} />}
            <span>{userLocation ? 'GPS Active (Centered)' : 'Near Me (GPS)'}</span>
          </button>
        </div>

        {/* View Options: All Gyms vs Verified Hubs Only */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Filter:</span>
          <button
            type="button"
            onClick={() => handleVerifiedToggle('all')}
            style={{
              padding: '5px 14px',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              background: verifiedFilter === 'all' ? 'var(--color-primary, #22c55e)' : 'rgba(255,255,255,0.06)',
              color: verifiedFilter === 'all' ? '#000' : '#e2e8f0',
              borderColor: verifiedFilter === 'all' ? 'var(--color-primary, #22c55e)' : 'rgba(255,255,255,0.12)',
              transition: 'all 0.2s ease',
            }}
          >
            🌍 All Gyms & Workout Spaces ({gyms.length})
          </button>
          <button
            type="button"
            onClick={() => handleVerifiedToggle('verified')}
            style={{
              padding: '5px 14px',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              background: verifiedFilter === 'verified' ? '#f59e0b' : 'rgba(255,255,255,0.06)',
              color: verifiedFilter === 'verified' ? '#000' : '#e2e8f0',
              borderColor: verifiedFilter === 'verified' ? '#f59e0b' : 'rgba(255,255,255,0.12)',
              transition: 'all 0.2s ease',
            }}
          >
            ⭐ Verified Gyms Only
          </button>
        </div>

        {/* Category Tabs: Gyms vs Nearby Athletes */}
        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'gyms' ? styles.activeTabBtn : ''}`}
            onClick={() => setActiveTab('gyms')}
          >
            <Compass size={16} /> Gyms & Workout Rooms ({gyms.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'athletes' ? styles.activeTabBtn : ''}`}
            onClick={() => setActiveTab('athletes')}
          >
            <Users size={16} /> Nearby Workout Enthusiasts ({nearbyAthletes.length})
          </button>
        </div>

        {/* Content Layout */}
        <div className={styles.mainGrid}>
          {/* Main Column */}
          <div className={styles.listingsCol}>
            {activeTab === 'athletes' ? (
              <div className={styles.athletesList}>
                {nearbyAthletes.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Users size={36} />
                    <h3>No workout enthusiasts located nearby yet</h3>
                    <p>Click "Near Me (GPS)" above to broadcast your approximate workout location and discover training partners.</p>
                  </div>
                ) : (
                  nearbyAthletes.map((ath) => (
                    <div key={ath._id} className={styles.athleteCard}>
                      <div className={styles.athleteAvatar}>
                        {ath.avatarUrl ? (
                          <img src={ath.avatarUrl} alt={ath.username} className={styles.avatarImg} />
                        ) : (
                          <div className={styles.avatarFallback}>{ath.username.slice(0, 2).toUpperCase()}</div>
                        )}
                        <span className={styles.liveDot} title="Sharing live workout area" />
                      </div>
                      <div className={styles.athleteInfo}>
                        <div className={styles.cardHeaderRow}>
                          <h3 className={styles.gymName}>
                            @{ath.username}
                            {ath.isDemoAmbassador && (
                              <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 'normal', marginLeft: '6px' }}>
                                (Demo Ambassador)
                              </span>
                            )}
                          </h3>
                          {ath.distanceKm !== null ? (
                            <span className={styles.athleteDist}>{ath.distanceKm} km away</span>
                          ) : (
                            <span className={styles.athleteDist} style={{ color: '#94a3b8' }}>Member</span>
                          )}
                        </div>
                        <p className={styles.athleteMeta}>
                          🎯 {ath.goal} · ⚡ {ath.experience}
                        </p>
                        <div className={styles.athleteFooter}>
                          <span className={styles.streakBadge}>🔥 {ath.streak} Day Streak</span>
                          <span className={styles.athleteCity}>📍 {ath.city}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : loading ? (
              <div className={styles.loadingBox}>
                <Loader2 size={32} className={styles.spin} />
                <p>Locating verified gym hubs...</p>
              </div>
            ) : gyms.length === 0 ? (
              <div className={styles.emptyState}>
                <MapPin size={36} />
                <h3>No gyms found in this area</h3>
                <p>Try clearing filters or search another city.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCity('');
                    fetchGyms(null, '', '');
                  }}
                  className={styles.resetBtn}
                >
                  Show All Verified Gyms
                </button>
              </div>
            ) : (
              <div className={styles.gymList}>
                {gyms.map((gym, index) => {
                  const gymId = gym._id || gym.slug || `gym_${index}`;
                  const selectedId = selectedGym?._id || selectedGym?.slug;
                  const isSelected = selectedId === gymId || (selectedGym?.name === gym.name);
                  return (
                    <div
                      key={gymId}
                      onClick={() => setSelectedGym(gym)}
                      className={`${styles.gymCard} ${isSelected ? styles.selectedCard : ''}`}
                    >
                      <div className={styles.gymThumbWrap}>
                        {gym.photos?.[0] ? (
                          <Image
                            src={gym.photos[0]}
                            alt={gym.name}
                            fill
                            className={styles.gymThumb}
                          />
                        ) : (
                          <div className={styles.placeholderThumb}><MapPin size={24} /></div>
                        )}
                        {gym.distanceKm !== null && (
                          <div className={styles.distTag}>{gym.distanceKm} km away</div>
                        )}
                      </div>

                      <div className={styles.gymInfo}>
                        <div className={styles.cardHeaderRow}>
                          <h3 className={styles.gymName}>{gym.name}</h3>
                          <div className={styles.ratingBox}>
                            <Star size={13} fill="#f59e0b" color="#f59e0b" />
                            <span>{gym.rating}</span>
                          </div>
                        </div>

                        <div className={styles.addressLine}>
                          <MapPin size={14} />
                          <span>{gym.address}, {gym.city}</span>
                        </div>

                        <div className={styles.amenitiesChips}>
                          {gym.amenities.slice(0, 3).map((a, i) => (
                            <span key={i} className={styles.amenityChip}>{a}</span>
                          ))}
                          {gym.amenities.length > 3 && (
                            <span className={styles.amenityMore}>+{gym.amenities.length - 3}</span>
                          )}
                        </div>

                        <div className={styles.footerRow}>
                          <span className={styles.priceTag}>
                            {gym.pricing?.dailyPass ? (
                              <>
                                {gym.pricing.currency === 'USD' ? '$' : gym.pricing.currency === 'CAD' ? 'CA$' : gym.pricing.currency === 'GBP' ? '£' : gym.pricing.currency === 'AED' ? 'AED ' : gym.pricing.currency === 'EUR' ? '€' : gym.pricing.currency === 'GHS' ? 'GH₵' : '₦'}
                                {gym.pricing.dailyPass.toLocaleString()} <span>/ day</span>
                              </>
                            ) : (
                              <span style={{ color: '#22c55e' }}>Free Public Access</span>
                            )}
                          </span>
                          <span className={styles.viewOnMap}>View on Map →</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Interactive Map & Gym Details Column */}
          <div className={styles.mapCol}>
            <div className={styles.mapStickyWrap}>
              <div className={styles.mapIframeBox}>
                <InteractiveMap
                  gyms={gyms}
                  selectedGym={activeGym}
                  onSelectGym={(g) => setSelectedGym(g)}
                  userLocation={userLocation}
                  onMapMoveEnd={handleMapMoveEnd}
                  isSearchingArea={isSearchingArea}
                />
                <div className={styles.mapOverlayBar}>
                  <span className={styles.mapAddressLabel}>
                    <MapPin size={14} /> {activeGym ? activeGym.address : userLocation ? `Your Location (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})` : 'Lagos, Nigeria'}
                  </span>
                  <a
                    href={googleMapsDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.directionsBtn}
                  >
                    <Navigation size={13} /> Open in Google Maps <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* Gym Detail Panel */}
              {activeGym ? (
                <div className={styles.detailCard}>
                  <div className={styles.detailHeader}>
                    <div>
                      <h2>{activeGym.name}</h2>
                      <p className={styles.subCity}>{activeGym.city}{activeGym.state ? `, ${activeGym.state}` : ''}</p>
                    </div>
                    {activeGym.isVerified && (
                      <span className={styles.verifiedBadge}>
                        <CheckCircle2 size={14} /> Verified Space
                      </span>
                    )}
                  </div>

                  <div className={styles.detailMetaGrid}>
                    <div className={styles.metaBox}>
                      <Clock size={16} />
                      <div>
                        <strong>Hours:</strong>
                        <span>{activeGym.openingHours || 'Mon-Sat: 6:00 AM - 9:00 PM'}</span>
                      </div>
                    </div>
                    {activeGym.phone && (
                      <div className={styles.metaBox}>
                        <Phone size={16} />
                        <div>
                          <strong>Phone:</strong>
                          <a href={`tel:${activeGym.phone}`}>{activeGym.phone}</a>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.detailAmenities}>
                    <strong>Equipment & Amenities:</strong>
                    <div className={styles.amenitiesWrap}>
                      {activeGym.amenities?.map((item, idx) => (
                        <span key={idx} className={styles.fullAmenityBadge}>
                          ✓ {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {activeGym.communityGroupUrl && (
                    <div className={styles.communityConnectBox}>
                      <div className={styles.commText}>
                        <Users size={18} />
                        <div>
                          <strong>Join the Local Gym Pod</strong>
                          <p>Connect with other TemprFit athletes who train here.</p>
                        </div>
                      </div>
                      <a
                        href={activeGym.communityGroupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.communityBtn}
                      >
                        Join Squad
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.detailCard}>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '16px' }}>
                    Select any gym from the list on the left to view opening hours, equipment, pass rates, and directions.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
