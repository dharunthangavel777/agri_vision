import { Request, Response } from 'express';

/**
 * Reverse geocode coordinates to a clean, human-friendly village/district/state name
 */
export async function reverseGeocode(req: Request, res: Response) {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ status: 'error', error: 'Missing lat or lon query parameter' });
  }

  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lon as string);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ status: 'error', error: 'Invalid coordinates' });
  }

  // 1. Try OpenStreetMap Nominatim with a proper Server-Side User-Agent (allowed by OSM policy)
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`;
    const nomRes = await fetch(nomUrl, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'AgriVision-Smart-Agriculture/1.0 (contact: info@agrivision.ai)',
      },
    });

    if (nomRes.ok) {
      const data: any = await nomRes.json();
      const addr = data.address || {};

      const primary = addr.village || addr.suburb || addr.neighbourhood || addr.town || addr.city || addr.municipality || '';
      const district = addr.county || addr.district || addr.state_district || '';
      const state = addr.state || '';
      const country = addr.country || 'India';

      let formatted = '';
      if (primary && district && primary !== district) {
        formatted = `${primary}, ${district}`;
      } else if (primary && state && primary !== state) {
        formatted = `${primary}, ${state}`;
      } else if (district && state && district !== state) {
        formatted = `${district}, ${state}`;
      } else {
        formatted = primary || district || state || country || `${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E`;
      }

      return res.json({
        status: 'ok',
        data: {
          lat: latitude,
          lon: longitude,
          city: addr.city || addr.town || district || primary,
          town: addr.town,
          village: addr.village,
          district,
          state,
          country,
          formatted,
          displayName: data.display_name,
          source: 'osm_nominatim',
        },
      });
    }
  } catch (err: any) {
    console.warn('[Location] Nominatim reverse geocode error:', err.message);
  }

  // 2. Fallback to OpenWeatherMap Reverse Geocoding
  try {
    const apiKey = process.env.WEATHER_API_KEY || '19927003d654bcd63f64e32840eeba91';
    const owmUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`;
    const owmRes = await fetch(owmUrl);

    if (owmRes.ok) {
      const data: any = await owmRes.json();
      if (Array.isArray(data) && data.length > 0) {
        const place = data[0];
        const formatted = place.state ? `${place.name}, ${place.state}` : `${place.name}, ${place.country}`;
        return res.json({
          status: 'ok',
          data: {
            lat: latitude,
            lon: longitude,
            city: place.name,
            state: place.state,
            district: place.state,
            country: place.country,
            formatted,
            source: 'openweathermap',
          },
        });
      }
    }
  } catch (err: any) {
    console.warn('[Location] OpenWeatherMap reverse geocode error:', err.message);
  }

  // 3. Coordinate fallback
  return res.json({
    status: 'ok',
    data: {
      lat: latitude,
      lon: longitude,
      formatted: `${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E`,
      source: 'coords',
    },
  });
}

/**
 * Search locations (villages, districts, cities)
 */
export async function searchLocations(req: Request, res: Response) {
  const query = (req.query.q as string || '').trim();

  if (!query || query.length < 2) {
    return res.json({ status: 'ok', data: [] });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1&countrycodes=in`;
    const nomRes = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'AgriVision-Smart-Agriculture/1.0 (contact: info@agrivision.ai)',
      },
    });

    if (nomRes.ok) {
      const data: any = await nomRes.json();
      const results = (Array.isArray(data) ? data : []).map((item: any) => {
        const addr = item.address || {};
        const primary = addr.village || addr.suburb || addr.neighbourhood || addr.town || addr.city || '';
        const district = addr.county || addr.district || addr.state_district || '';
        const state = addr.state || '';
        
        let label = item.display_name;
        if (primary && state) {
          label = district ? `${primary}, ${district}, ${state}` : `${primary}, ${state}`;
        }

        return {
          displayName: label,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          city: addr.city || addr.town || primary || district,
          district,
          state,
          country: addr.country || 'India',
        };
      });

      return res.json({ status: 'ok', data: results });
    }
  } catch (err: any) {
    console.warn('[Location] Search failed:', err.message);
  }

  return res.json({ status: 'ok', data: [] });
}

/**
 * Fallback IP Geolocation when GPS is unavailable
 */
export async function ipLocation(req: Request, res: Response) {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';

  try {
    // Try ipwho.is for clean HTTPS geolocation
    const ipRes = await fetch('https://ipwho.is/');
    if (ipRes.ok) {
      const data: any = await ipRes.json();
      if (data.success && data.latitude && data.longitude) {
        const city = data.city || '';
        const state = data.region || '';
        const formatted = city && state ? `${city}, ${state}` : city || state || 'India';
        return res.json({
          status: 'ok',
          data: {
            lat: data.latitude,
            lon: data.longitude,
            city,
            district: state,
            state,
            country: data.country || 'India',
            formatted,
            source: 'ip',
          },
        });
      }
    }
  } catch (err: any) {
    console.warn('[Location] IP geolocation error:', err.message);
  }

  return res.json({
    status: 'ok',
    data: {
      lat: 11.2189,
      lon: 78.1674,
      city: 'Namakkal',
      district: 'Namakkal',
      state: 'Tamil Nadu',
      country: 'India',
      formatted: 'Namakkal, Tamil Nadu',
      source: 'default',
    },
  });
}
