'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Maximize2, Navigation, Compass, Layers, ExternalLink } from 'lucide-react';
import styles from './InteractiveMap.module.css';

export default function InteractiveMap({
  gyms = [],
  selectedGym = null,
  onSelectGym = () => {},
  userLocation = null,
  onMapMoveEnd = null, // callback({ lat, lng, zoom }) when map is panned/scrolled
  isSearchingArea = false,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [mapLayer, setMapLayer] = useState('streets'); // 'streets' | 'satellite' | 'dark'
  const [showSearchAreaBtn, setShowSearchAreaBtn] = useState(false);
  const currentCenterRef = useRef(null);

  // Dynamically load Leaflet library and CSS once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadLeaflet = async () => {
      // 1. Ensure CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // 2. Ensure JS
      if (!window.L) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.crossOrigin = '';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      setIsReady(true);
    };

    loadLeaflet().catch((err) => {
      console.warn('Leaflet load notice:', err);
    });
  }, []);

  const getTileLayerConfig = (layerType) => {
    switch (layerType) {
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri World Imagery',
        };
      case 'dark':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap &copy; CARTO',
        };
      case 'streets':
      default:
        return {
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        };
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!isReady || !window.L || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter = userLocation
        ? [userLocation.lat, userLocation.lng]
        : selectedGym?.location?.coordinates
        ? [selectedGym.location.coordinates[1], selectedGym.location.coordinates[0]]
        : [6.5244, 3.3792]; // Lagos default

      const map = window.L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 12,
        zoomControl: false,
      });

      // Add zoom control top-left
      window.L.control.zoom({ position: 'topleft' }).addTo(map);

      // Add initial Tile Layer with full road and street cartography
      const tileConfig = getTileLayerConfig(mapLayer);
      const tileLayer = window.L.tileLayer(tileConfig.url, {
        maxZoom: tileConfig.maxZoom,
      }).addTo(map);

      // Listen for map drag / scroll to show "Search This Area"
      map.on('moveend', () => {
        const c = map.getCenter();
        currentCenterRef.current = { lat: c.lat, lng: c.lng, zoom: map.getZoom() };
        setShowSearchAreaBtn(true);
      });

      mapInstanceRef.current = map;
      mapInstanceRef.current._tileLayer = tileLayer;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = {};
      }
    };
  }, [isReady]);

  // Update tile style when mapLayer toggles
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    if (mapInstanceRef.current._tileLayer) {
      mapInstanceRef.current.removeLayer(mapInstanceRef.current._tileLayer);
    }

    const tileConfig = getTileLayerConfig(mapLayer);
    const tileLayer = window.L.tileLayer(tileConfig.url, {
      maxZoom: tileConfig.maxZoom,
    }).addTo(mapInstanceRef.current);

    mapInstanceRef.current._tileLayer = tileLayer;
  }, [mapLayer]);

  // Render All Gym Markers with Tooltips & Popups
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    const map = mapInstanceRef.current;
    const L = window.L;

    // Clear old gym markers
    Object.values(markersRef.current).forEach((m) => map.removeLayer(m));
    markersRef.current = {};

    const markerGroup = [];

    gyms.forEach((gym) => {
      if (!gym.location?.coordinates || gym.location.coordinates.length < 2) return;
      const [lng, lat] = gym.location.coordinates;
      if (isNaN(lat) || isNaN(lng)) return;

      const isSelected = (selectedGym?._id || selectedGym?.slug) === (gym._id || gym.slug);
      const isCalisthenics = gym.category === 'calisthenics_park';
      const isVerified = gym.isVerified;

      // Custom HTML Pin Icon
      const pinHtml = `
        <div class="gym-custom-pin ${isCalisthenics ? 'calisthenics-pin' : ''} ${
        isVerified ? 'verified-pin' : 'unverified-pin'
      } ${isSelected ? 'selected-pin' : ''}">
          <span class="gym-pin-icon">${isCalisthenics ? '🤸' : isVerified ? '🏋️' : '📍'}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: pinHtml,
        className: 'custom-leaflet-pin',
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      // Tooltip on Hover
      const tooltipContent = `
        <div style="font-family: inherit;">
          <div style="display: flex; align-items: center; gap: 4px;">
            <span class="tooltip-gym-name">${gym.name}</span>
            ${isVerified ? '<span style="color:#22c55e; font-size:10px;">✔ Verified</span>' : ''}
          </div>
          <div class="tooltip-gym-meta">
            <span class="tooltip-rating">⭐ ${gym.rating || 4.7}</span>
            <span>·</span>
            <span>${gym.pricing?.dailyPass ? `₦${gym.pricing.dailyPass.toLocaleString()}/day` : 'Free / Public'}</span>
            ${gym.distanceKm !== null ? `<span>·</span><span class="tooltip-dist">${gym.distanceKm} km</span>` : ''}
          </div>
        </div>
      `;
      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        offset: [0, -18],
        className: 'gym-map-tooltip',
      });

      // Rich Popup on Click with Directions
      const photoUrl =
        gym.photos?.[0] ||
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80';

      const directionsUrl = userLocation
        ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${lat},${lng}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      const popupHtml = `
        <div class="popup-card">
          <img src="${photoUrl}" alt="${gym.name}" class="popup-thumb" />
          <h4 class="popup-title">${gym.name}</h4>
          <p class="popup-address">📍 ${gym.address}, ${gym.city}</p>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:0.75rem;">
            <span style="color:#f59e0b; font-weight:700;">⭐ ${gym.rating || 4.7} (${gym.reviewCount || 20})</span>
            ${gym.distanceKm !== null ? `<span style="color:#22c55e; font-weight:700;">${gym.distanceKm} km away</span>` : ''}
          </div>
          <div style="display:flex; gap:6px;">
            <button id="select-gym-${gym._id || gym.slug}" class="popup-btn" style="flex:1;">
              View Details
            </button>
            <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="popup-btn" style="background:#3b82f6; color:#fff; display:flex; align-items:center; justify-content:center; padding:7px 10px; text-decoration:none;">
              Directions ↗
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 280 });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`select-gym-${gym._id || gym.slug}`);
        if (btn) {
          btn.onclick = () => {
            onSelectGym(gym);
          };
        }
      });

      marker.on('click', () => {
        onSelectGym(gym);
      });

      markersRef.current[gym._id || gym.slug] = marker;
      markerGroup.push(marker);
    });

    // Auto-fit bounds so ALL gym pins (close and far) are visible simultaneously
    if (markerGroup.length > 0) {
      const group = L.featureGroup(markerGroup);
      if (userLocation) {
        group.addLayer(L.marker([userLocation.lat, userLocation.lng]));
      }
      try {
        map.fitBounds(group.getBounds().pad(0.18), { maxZoom: 15 });
      } catch {}
    }
  }, [gyms, isReady]);

  // Handle User Live Location Pin & Directions
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    const map = mapInstanceRef.current;
    const L = window.L;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (userLocation && !isNaN(userLocation.lat) && !isNaN(userLocation.lng)) {
      const userIcon = L.divIcon({
        html: `
          <div class="user-live-pin">
            <div class="user-live-beacon"></div>
            <div class="user-live-center"></div>
          </div>
        `,
        className: 'user-pin-wrapper',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const uMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1200,
      }).addTo(map);

      uMarker.bindTooltip(
        `<div style="font-weight:700; color:#3b82f6;">📍 You Are Here (My Live GPS)</div><div style="font-size:0.75rem; color:#94a3b8;">${userLocation.lat.toFixed(
          4
        )}°, ${userLocation.lng.toFixed(4)}°</div>`,
        {
          permanent: false,
          direction: 'top',
          offset: [0, -12],
          className: 'gym-map-tooltip',
        }
      );

      userMarkerRef.current = uMarker;
    }
  }, [userLocation, isReady]);

  // When selectedGym changes from the outside, fly smoothly to it
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedGym || !window.L) return;
    const coords = selectedGym.location?.coordinates;
    if (!coords) return;
    const [lng, lat] = coords;

    mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.2 });

    const key = selectedGym._id || selectedGym.slug;
    const marker = markersRef.current[key];
    if (marker) {
      marker.openPopup();
    }
  }, [selectedGym]);

  const handleFitAll = () => {
    if (!mapInstanceRef.current || !window.L) return;
    const allMarkers = Object.values(markersRef.current);
    if (userMarkerRef.current) allMarkers.push(userMarkerRef.current);
    if (allMarkers.length > 0) {
      const group = window.L.featureGroup(allMarkers);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.18));
    }
  };

  const handleCenterUser = () => {
    if (!mapInstanceRef.current || !userLocation) return;
    mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1 });
  };

  const handleSearchThisArea = () => {
    if (onMapMoveEnd && currentCenterRef.current) {
      onMapMoveEnd(currentCenterRef.current);
    }
    setShowSearchAreaBtn(false);
  };

  return (
    <div className={styles.mapContainer}>
      {!isReady && (
        <div className={styles.mapLoading}>
          <Loader2 size={28} className={styles.spin} />
          <span>Rendering live global gym map...</span>
        </div>
      )}

      <div ref={mapContainerRef} className={styles.mapElement} />

      {/* Floating "Search this area" button similar to Google Maps */}
      {showSearchAreaBtn && onMapMoveEnd && (
        <div className={styles.searchAreaPromptWrap}>
          <button
            type="button"
            onClick={handleSearchThisArea}
            disabled={isSearchingArea}
            className={styles.searchAreaBtn}
          >
            {isSearchingArea ? (
              <>
                <Loader2 size={13} className={styles.spin} />
                <span>Locating gyms here...</span>
              </>
            ) : (
              <>
                <Compass size={13} />
                <span>🔍 Search gyms in this area</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Floating Map Controls */}
      <div className={styles.mapControlsOverlay}>
        <div className={styles.layerToggleGroup}>
          <button
            type="button"
            onClick={() => setMapLayer('streets')}
            className={`${styles.layerBtn} ${mapLayer === 'streets' ? styles.activeLayerBtn : ''}`}
            title="Roads & Street View"
          >
            Roads
          </button>
          <button
            type="button"
            onClick={() => setMapLayer('satellite')}
            className={`${styles.layerBtn} ${mapLayer === 'satellite' ? styles.activeLayerBtn : ''}`}
            title="Satellite Aerial View"
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => setMapLayer('dark')}
            className={`${styles.layerBtn} ${mapLayer === 'dark' ? styles.activeLayerBtn : ''}`}
            title="Dark Carto View"
          >
            Dark
          </button>
        </div>

        <button
          type="button"
          onClick={handleFitAll}
          className={styles.controlBtn}
          title="Fit all gyms on screen"
        >
          <Maximize2 size={13} /> View All ({gyms.length})
        </button>

        {userLocation && (
          <button
            type="button"
            onClick={handleCenterUser}
            className={styles.controlBtn}
            title="Recenter on My Location"
          >
            <Navigation size={13} /> My GPS
          </button>
        )}
      </div>

      <div className={styles.mapStatsBadge}>
        <span className={styles.liveBeacon} />
        <span>{gyms.length} Gyms & Hubs Worldwide on Map</span>
      </div>
    </div>
  );
}
