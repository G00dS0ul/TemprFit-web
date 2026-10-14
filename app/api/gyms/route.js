import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Gym from '@/models/Gym';
import { SEED_GYMS } from '@/lib/seed-data/gyms';
import { geocodeGlobalLocation, fetchLiveWorldwideGyms, reverseGeocodeCoordinates } from '@/lib/overpass-gyms';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();

    // Ensure seed gyms exist in MongoDB
    try {
      for (const gym of SEED_GYMS) {
        await Gym.findOneAndUpdate(
          { slug: gym.slug },
          gym,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    } catch (seedErr) {
      console.warn('[API /api/gyms] Seeding notice:', seedErr.message);
    }

    const { searchParams } = new URL(request.url);
    let lat = parseFloat(searchParams.get('lat'));
    let lng = parseFloat(searchParams.get('lng'));
    const radiusKm = parseFloat(searchParams.get('radius')) || 25;
    const query = searchParams.get('q')?.trim();
    const city = searchParams.get('city')?.trim();
    const verifiedOnly = searchParams.get('verified') === 'true';

    // 1. If user typed a search or selected a city, geocode to target that exact region globally
    let targetLocationName = city || query || '';
    let geocodedCoords = null;

    if (targetLocationName) {
      const geo = await geocodeGlobalLocation(targetLocationName);
      if (geo?.lat && geo?.lng) {
        geocodedCoords = { lat: geo.lat, lng: geo.lng, city: geo.city, country: geo.country };
        // Use geocoded center as the focus point for this search
        lat = geo.lat;
        lng = geo.lng;
      }
    }

    let filter = {};
    if (verifiedOnly) {
      filter.isVerified = true;
    }

    // Database search filter
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { address: { $regex: query, $options: 'i' } },
        { city: { $regex: query, $options: 'i' } },
        { country: { $regex: query, $options: 'i' } },
        { amenities: { $regex: query, $options: 'i' } },
      ];
    } else if (city) {
      filter.$or = [
        { city: { $regex: city, $options: 'i' } },
        { address: { $regex: city, $options: 'i' } },
      ];
    }

    let liveGyms = [];
    // 2. Fetch live worldwide gyms from OSM / Photon
    if (targetLocationName || (!isNaN(lat) && !isNaN(lng))) {
      try {
        liveGyms = await fetchLiveWorldwideGyms({
          lat: !isNaN(lat) ? lat : undefined,
          lng: !isNaN(lng) ? lng : undefined,
          query,
          city: geocodedCoords?.city || city,
          country: geocodedCoords?.country || '',
          limit: 35,
        });
      } catch (liveErr) {
        console.warn('[API /api/gyms] Live gym fetch notice:', liveErr.message);
      }
    }

    // 3. Fetch matched gyms from database
    let dbGyms = [];
    try {
      dbGyms = await Gym.find(filter).lean();
    } catch (dbErr) {
      dbGyms = SEED_GYMS.filter((g) => {
        if (verifiedOnly && !g.isVerified) return false;
        if (query) {
          const qLower = query.toLowerCase();
          return (
            g.name.toLowerCase().includes(qLower) ||
            g.address.toLowerCase().includes(qLower) ||
            g.city.toLowerCase().includes(qLower) ||
            (g.country && g.country.toLowerCase().includes(qLower))
          );
        }
        if (city) {
          return g.city.toLowerCase().includes(city.toLowerCase());
        }
        return true;
      });
    }

    // 4. Combine and deduplicate
    const combined = [];
    const seenKeys = new Set();

    // Priority to database-verified gyms matching the location
    for (const g of dbGyms) {
      if (verifiedOnly && !g.isVerified) continue;
      const key = `${g.name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${g.city?.toLowerCase()}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        combined.push(g);
      }
    }

    // Then add live worldwide gyms
    for (const g of liveGyms) {
      if (verifiedOnly && !g.isVerified) continue;
      const key = `${g.name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${g.city?.toLowerCase()}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        combined.push(g);
      }
    }

    // If completely empty (no search term), load all seed gyms
    let finalGyms = combined;
    if (finalGyms.length === 0 && !query && !city) {
      finalGyms = [...SEED_GYMS];
      if (verifiedOnly) {
        finalGyms = finalGyms.filter((g) => g.isVerified);
      }
    }

    // 5. Annotate distance relative to the active focus point (lat, lng)
    const annotated = finalGyms.map((gym, idx) => {
      let distanceKm = null;
      if (!isNaN(lat) && !isNaN(lng) && gym.location?.coordinates) {
        const [gLng, gLat] = gym.location.coordinates;
        distanceKm = calculateHaversineDistance(lat, lng, gLat, gLng);
      }
      return {
        ...gym,
        _id: gym._id ? String(gym._id) : gym.slug || `gym_${idx}`,
        distanceKm: distanceKm !== null ? parseFloat(distanceKm.toFixed(1)) : null,
      };
    });

    // Sort by distance if we have coordinates
    if (!isNaN(lat) && !isNaN(lng)) {
      annotated.sort((a, b) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    return NextResponse.json({
      success: true,
      gyms: annotated,
      total: annotated.length,
      center: !isNaN(lat) && !isNaN(lng) ? { lat, lng } : null,
    });
  } catch (error) {
    console.error('[API /api/gyms] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve gyms', details: error.message },
      { status: 500 }
    );
  }
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}
