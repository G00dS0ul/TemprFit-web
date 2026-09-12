'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

const FALLBACK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23333" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" y1="8" x2="12" y2="15"/><line x1="12" y1="15" x2="9" y2="22"/><line x1="12" y1="15" x2="15" y2="22"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="9" x2="6" y2="12"/><line x1="15" y1="9" x2="18" y2="12"/></svg>`;

export default function ExercisePreview({ media, alt = "Exercise preview", className = "", style = {} }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const isArray = Array.isArray(media) && media.length > 0;
  
  // Set up auto-flip interval if it's an array of static images
  React.useEffect(() => {
    if (!isArray || media.length < 2) return;
    
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % media.length);
    }, 800); // flip every 800ms
    
    return () => clearInterval(interval);
  }, [isArray, media]);

  // Determine the URL to display. 
  let displayUrl = FALLBACK_SVG;
  
  if (isArray) {
    displayUrl = media[activeIndex]?.url || FALLBACK_SVG;
  } else if (!hasError && media?.url) {
    displayUrl = media.url;
  } else if (media?.fallbackUrl) {
    // If fallback is an array of legacy images, default to the first one if the GIF fails
    if (Array.isArray(media.fallbackUrl)) {
      displayUrl = media.fallbackUrl[0]?.url || FALLBACK_SVG;
    } else {
      displayUrl = media.fallbackUrl || FALLBACK_SVG;
    }
  }

  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div 
      className={className} 
      style={{ 
        position: 'relative', 
        overflow: 'hidden', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg, #1a1a1a)',
        borderRadius: '8px',
        border: '1px solid var(--border-color, #333)',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
        ...style
      }}
    >
      {/* Skeleton / Loader */}
      {isLoading && displayUrl !== FALLBACK_SVG && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg, #1a1a1a)' }}>
          <Loader2 className="spin" size={24} color="#555" />
        </div>
      )}

      {/* Image element */}
      <img
        src={displayUrl}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          padding: '4px',
          opacity: isLoading && displayUrl !== FALLBACK_SVG ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
    </div>
  );
}
