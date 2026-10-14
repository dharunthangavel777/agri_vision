import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface RealLocationData {
  lat: number;
  lon: number;
  accuracy?: number; // meters
  city?: string;
  town?: string;
  village?: string;
  district?: string;
  state?: string;
  country?: string;
  formatted: string;
  source: 'gps' | 'wifi' | 'ip' | 'cached' | 'manual';
  timestamp: number;
}

interface LocationStore {
  location: RealLocationData | null;
  loading: boolean;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unsupported';
  error: string | null;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  fetchRealLocation: (forcePrompt?: boolean) => Promise<RealLocationData | null>;
  setManualLocation: (name: string, lat?: number, lon?: number) => void;
  searchLocations: (query: string) => Promise<any[]>;
}

const DEFAULT_COORDS = { lat: 11.2189, lon: 78.1674, formatted: 'Namakkal, Tamil Nadu' };

/**
 * Reverse geocode coordinates to a verified, precise location name
 * Queries backend proxy first (which uses Nominatim with full server User-Agent)
 * Falls back to client-side OpenWeatherMap or BigDataCloud
 */
export async function reverseGeocodeCoords(lat: number, lon: number): Promise<{
  city?: string;
  town?: string;
  village?: string;
  district?: string;
  state?: string;
  country?: string;
  formatted: string;
}> {
  // 1. Try our backend proxy route first (zero CORS, authentic OpenStreetMap data)
  try {
    const res = await fetch(`/api/location/reverse?lat=${lat}&lon=${lon}`);
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'ok' && json.data?.formatted) {
        return json.data;
      }
    }
  } catch (e) {
    console.warn('[Location] Backend reverse geocode proxy unreachable, using direct fallback:', e);
  }

  // 2. Direct client-side BigDataCloud reverse geocode client (free, CORS-open, no key required)
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await fetch(bdcUrl);
    if (res.ok) {
      const data = await res.json();
      const primary = data.locality || data.city || '';
      const district = data.localityInfo?.administrative?.find((a: any) => a.adminLevel === 6 || a.adminLevel === 5)?.name || '';
      const state = data.principalSubdivision || '';
      const country = data.countryName || 'India';

      let formatted = '';
      if (primary && district && primary !== district) {
        formatted = `${primary}, ${district}`;
      } else if (primary && state) {
        formatted = `${primary}, ${state}`;
      } else if (district && state) {
        formatted = `${district}, ${state}`;
      } else {
        formatted = primary || district || state || country;
      }

      return {
        city: data.city || primary,
        district: district || state,
        state,
        country,
        formatted: formatted || `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`,
      };
    }
  } catch (err) {
    console.warn('[Location] BigDataCloud fallback error:', err);
  }

  // 3. OpenWeatherMap Reverse Geocoding fallback
  try {
    const apiKey = '19927003d654bcd63f64e32840eeba91';
    const owmUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
    const res = await fetch(owmUrl);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const place = data[0];
        const formatted = place.state ? `${place.name}, ${place.state}` : `${place.name}, ${place.country}`;
        return {
          city: place.name,
          state: place.state,
          district: place.state,
          country: place.country,
          formatted,
        };
      }
    }
  } catch (err) {
    console.warn('[Location] OpenWeatherMap reverse geocode error:', err);
  }

  return {
    formatted: `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`,
  };
}

/**
 * Fallback to IP or user profile when device GPS is denied or unavailable
 */
async function fetchFallbackLocation(): Promise<RealLocationData> {
  // First, check if the authenticated user has set their farm location in profile
  try {
    const rawUser = localStorage.getItem('auth_user') || localStorage.getItem('agri_user_profile');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed.location && parsed.location.length > 2) {
        const parts = parsed.location.split(',');
        return {
          lat: DEFAULT_COORDS.lat,
          lon: DEFAULT_COORDS.lon,
          city: parts[0]?.trim() || parsed.location,
          state: parts[1]?.trim() || 'Tamil Nadu',
          formatted: parsed.location,
          source: 'manual',
          timestamp: Date.now(),
        };
      }
    }
  } catch (e) {
    // Ignore profile read error
  }

  // Next, try backend IP location
  try {
    const res = await fetch('/api/location/ip');
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'ok' && json.data) {
        return json.data;
      }
    }
  } catch (e) {
    // Backend offline
  }

  return {
    lat: DEFAULT_COORDS.lat,
    lon: DEFAULT_COORDS.lon,
    city: 'Namakkal',
    state: 'Tamil Nadu',
    country: 'India',
    formatted: DEFAULT_COORDS.formatted,
    source: 'manual',
    timestamp: Date.now(),
  };
}

/**
 * High-accuracy multi-phase browser geolocation:
 * Uses watchPosition and dual-strategy high/low accuracy to capture real device coordinates
 */
function acquireDeviceCoordinates(timeoutMs = 9000): Promise<{ lat: number; lon: number; accuracy: number; source: 'gps' | 'wifi' }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation not supported by browser'));
    }

    let resolved = false;
    let bestCoords: { lat: number; lon: number; accuracy: number; source: 'gps' | 'wifi' } | null = null;
    let watchId: number | null = null;
    let timerId: any = null;

    const cleanup = () => {
      if (watchId !== null) {
        try { navigator.geolocation.clearWatch(watchId); } catch (e) {}
      }
      if (timerId) clearTimeout(timerId);
    };

    const handlePos = (pos: GeolocationPosition, isHigh: boolean) => {
      const accuracy = pos.coords.accuracy;
      const candidate = {
        lat: parseFloat(pos.coords.latitude.toFixed(5)),
        lon: parseFloat(pos.coords.longitude.toFixed(5)),
        accuracy,
        source: (accuracy < 100 ? 'gps' : 'wifi') as 'gps' | 'wifi',
      };

      if (!bestCoords || accuracy < bestCoords.accuracy) {
        bestCoords = candidate;
      }

      // If accuracy is high (< 50 meters), lock onto position immediately
      if (accuracy <= 50 && !resolved) {
        resolved = true;
        cleanup();
        resolve(candidate);
      }
    };

    // 1. Start watchPosition for continuous refined GPS readings
    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => handlePos(pos, true),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            resolved = true;
            cleanup();
            reject(err);
          }
        },
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
      );
    } catch (e) {}

    // 2. Immediate getCurrentPosition trigger with high accuracy
    navigator.geolocation.getCurrentPosition(
      (pos) => handlePos(pos, true),
      (_err) => {
        // High accuracy failed or timed out (common on PCs/laptops without GPS receiver)
        // Immediately try low accuracy (Wi-Fi / Cell tower triangulation)
        navigator.geolocation.getCurrentPosition(
          (pos) => handlePos(pos, false),
          (lowErr) => {
            if (!bestCoords && !resolved) {
              resolved = true;
              cleanup();
              reject(lowErr);
            }
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    // 3. Fallback timer: take the best position detected within timeoutMs
    timerId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        if (bestCoords) {
          resolve(bestCoords);
        } else {
          reject(new Error('GPS location timeout'));
        }
      }
    }, timeoutMs);
  });
}

export const useLocationStore = create<LocationStore>()(
  persist(
    (set, get) => ({
      location: null,
      loading: false,
      permissionState: 'prompt',
      error: null,
      isModalOpen: false,

      setIsModalOpen: (open: boolean) => set({ isModalOpen: open }),

      fetchRealLocation: async (_forcePrompt = false) => {
        if (!navigator.geolocation) {
          set({ permissionState: 'unsupported', error: 'Geolocation not supported' });
          const fallback = await fetchFallbackLocation();
          set({ location: fallback, error: null, loading: false });
          return fallback;
        }

        set({ loading: true, error: null });

        try {
          // Probe permission status if supported
          if ('permissions' in navigator && navigator.permissions?.query) {
            try {
              const status = await navigator.permissions.query({ name: 'geolocation' });
              set({ permissionState: status.state });
              status.onchange = () => {
                set({ permissionState: status.state });
                if (status.state === 'granted') {
                  get().fetchRealLocation();
                }
              };
            } catch (e) {}
          }

          // Acquire precise device coordinates
          const coords = await acquireDeviceCoordinates(9000);
          const details = await reverseGeocodeCoords(coords.lat, coords.lon);

          const newLocation: RealLocationData = {
            lat: coords.lat,
            lon: coords.lon,
            accuracy: coords.accuracy,
            city: details.city,
            town: details.town,
            village: details.village,
            district: details.district,
            state: details.state,
            country: details.country,
            formatted: details.formatted,
            source: coords.source,
            timestamp: Date.now(),
          };

          set({
            location: newLocation,
            loading: false,
            permissionState: 'granted',
            error: null,
          });

          localStorage.setItem('agri_location', JSON.stringify(newLocation));
          return newLocation;
        } catch (err: any) {
          console.warn('[Location] GPS error, using verified farm fallback:', err?.message || err);

          const permissionState = err?.code === 1 ? 'denied' : 'prompt';
          const fallback = await fetchFallbackLocation();

          set({
            location: fallback,
            loading: false,
            permissionState,
            error: permissionState === 'denied' 
              ? 'GPS permission denied. Using your saved farm location.' 
              : null,
          });

          localStorage.setItem('agri_location', JSON.stringify(fallback));
          return fallback;
        }
      },

      setManualLocation: (name: string, lat = DEFAULT_COORDS.lat, lon = DEFAULT_COORDS.lon) => {
        const parts = name.split(',');
        const manualLoc: RealLocationData = {
          lat,
          lon,
          city: parts[0]?.trim() || name,
          district: parts[1]?.trim() || parts[0]?.trim(),
          state: parts[parts.length - 1]?.trim() || 'India',
          formatted: name,
          source: 'manual',
          timestamp: Date.now(),
        };
        set({ location: manualLoc, error: null, isModalOpen: false });
        localStorage.setItem('agri_location', JSON.stringify(manualLoc));
      },

      searchLocations: async (query: string) => {
        if (!query || query.trim().length < 2) return [];
        try {
          const res = await fetch(`/api/location/search?q=${encodeURIComponent(query)}`);
          if (res.ok) {
            const json = await res.json();
            if (json.status === 'ok') return json.data;
          }
        } catch (e) {
          console.warn('[Location] Search query error:', e);
        }
        return [];
      },
    }),
    {
      name: 'agri_real_location',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        location: state.location,
      }),
    }
  )
);
