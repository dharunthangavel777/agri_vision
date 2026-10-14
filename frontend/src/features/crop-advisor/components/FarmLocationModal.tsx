import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Loader2, 
  X, 
  Check, 
  Compass, 
  CloudSun, 
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geoAgroService, GeoLocationResult, ExtractedAgroData } from '../services/geoAgroService.ts';

declare global {
  interface Window {
    L: any;
  }
}

interface FarmLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationConfirmed: (data: ExtractedAgroData) => void;
  initialCoords?: { lat: number; lon: number };
  initialLocationName?: string;
}

const POPULAR_FARMING_HUBS = [
  { name: 'Punjab (Wheat Belt)', lat: 30.90, lon: 75.85 },
  { name: 'Maharashtra (Deccan Regur)', lat: 19.87, lon: 75.34 },
  { name: 'Karnataka (Mandya / Cauvery)', lat: 12.52, lon: 76.89 },
  { name: 'UP (Gangetic Alluvial)', lat: 26.84, lon: 80.94 },
  { name: 'Gujarat (Saurashtra)', lat: 21.52, lon: 70.45 },
  { name: 'Andhra (Guntur Delta)', lat: 16.30, lon: 80.43 },
  { name: 'Tamil Nadu (Thanjavur)', lat: 10.78, lon: 79.13 },
  { name: 'West Bengal (Burdwan)', lat: 23.23, lon: 87.86 }
];

export const FarmLocationModal: React.FC<FarmLocationModalProps> = ({
  isOpen,
  onClose,
  onLocationConfirmed,
  initialCoords = { lat: 12.9716, lon: 77.5946 },
  initialLocationName = 'Bangalore, Karnataka'
}) => {
  const [coords, setCoords] = useState<{ lat: number; lon: number }>(initialCoords);
  const [locationName, setLocationName] = useState<string>(initialLocationName);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeoLocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [isLoadingAgro, setIsLoadingAgro] = useState(false);
  const [agroData, setAgroData] = useState<ExtractedAgroData | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Debounced search autocomplete
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await geoAgroService.searchLocations(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // Load and update agro parameters when coordinates change
  const refreshAgroData = async (lat: number, lon: number, customPlace?: string) => {
    setIsLoadingAgro(true);
    setStatusMessage('Querying satellite & regional agro-climatic grids...');

    try {
      const data = await geoAgroService.getAutoAgroParameters(lat, lon, customPlace);
      setAgroData(data);
      setLocationName(data.locationName || `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`);
      setStatusMessage(null);
    } catch (e) {
      console.warn('Failed to fetch full agro data, using baseline:', e);
      setStatusMessage('Using regional soil & climatic baseline');
    } finally {
      setIsLoadingAgro(false);
    }
  };

  // Move marker and pan map
  const updateMapPosition = (lat: number, lon: number, customPlace?: string, shouldFly = true) => {
    setCoords({ lat, lon });
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lon]);
    }
    if (mapInstanceRef.current && shouldFly) {
      mapInstanceRef.current.flyTo([lat, lon], 13, { duration: 1.2 });
    }
    refreshAgroData(lat, lon, customPlace);
  };

  // Initialize or re-render Leaflet Map when Modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const timer = setTimeout(() => {
      if (!isMounted || !mapContainerRef.current) return;

      const L = window.L;
      if (!L) {
        console.warn('Leaflet library is still loading from CDN...');
        return;
      }

      // Cleanup existing instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Create Custom Farm Pin Icon
      const farmIcon = L.divIcon({
        className: 'custom-farm-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
            <div style="background: #142216; border: 2px solid #278b50; color: #4ade80; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); white-space: nowrap; margin-bottom: 2px;">
              🌱 Farm Point
            </div>
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #278b50; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(39, 139, 80, 0.8); border: 3px solid #ffffff;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: #ffffff;"></div>
            </div>
            <div style="width: 4px; height: 10px; background: #278b50; border-radius: 2px;"></div>
          </div>
        `,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });

      // Initialize Leaflet Map
      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lon],
        zoom: 12,
        zoomControl: true,
        attributionControl: false
      });

      mapInstanceRef.current = map;

      // Dark styled tiles (CartoDB Dark Matter with OpenStreetMap fallback)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      // Add Draggable Marker
      const marker = L.marker([coords.lat, coords.lon], {
        icon: farmIcon,
        draggable: true
      }).addTo(map);

      markerRef.current = marker;

      // Marker drag event
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        const lat = parseFloat(position.lat.toFixed(4));
        const lon = parseFloat(position.lng.toFixed(4));
        updateMapPosition(lat, lon, undefined, false);
      });

      // Map click event
      map.on('click', (e: any) => {
        const lat = parseFloat(e.latlng.lat.toFixed(4));
        const lon = parseFloat(e.latlng.lng.toFixed(4));
        updateMapPosition(lat, lon, undefined, true);
      });

      // Invalidate size to ensure crisp display inside modal
      setTimeout(() => {
        map.invalidateSize();
      }, 250);

      // Trigger initial agro parameters calculation
      refreshAgroData(coords.lat, coords.lon, initialLocationName);

      // Try automatic GPS detection if no custom location was already selected
      if (!initialLocationName || initialLocationName === 'Bangalore, Karnataka') {
        attemptDeviceGps();
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // GPS Device Locator
  const attemptDeviceGps = () => {
    if (!navigator.geolocation) {
      setStatusMessage('Browser GPS is unavailable. Search or click on the map.');
      return;
    }

    setIsDetectingGps(true);
    setStatusMessage('Accessing device GPS location...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lon = parseFloat(pos.coords.longitude.toFixed(4));
        setIsDetectingGps(false);
        setStatusMessage('GPS position locked.');
        updateMapPosition(lat, lon);
      },
      (err) => {
        console.warn('GPS detection error/denied:', err);
        setIsDetectingGps(false);
        setStatusMessage('GPS permission denied. Please search or click on map.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSelectSearchResult = (result: GeoLocationResult) => {
    setSearchQuery(result.displayName);
    setSearchResults([]);
    const cleanName = result.displayName.split(',').slice(0, 2).join(', ');
    updateMapPosition(result.lat, result.lon, cleanName);
  };

  const handleConfirmLocation = () => {
    if (agroData) {
      onLocationConfirmed(agroData);
    } else {
      // Fallback agro profile
      const fallback: ExtractedAgroData = {
        locationName,
        lat: coords.lat,
        lon: coords.lon,
        nitrogen: 90,
        phosphorus: 42,
        potassium: 44,
        ph: 6.8,
        temperature: 26,
        humidity: 60,
        rainfall: 110,
        soilType: 'Agricultural Soil',
        dataSource: 'regional_heuristics'
      };
      onLocationConfirmed(fallback);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl h-[92vh] max-h-[750px] bg-[#141b14] border border-[#278b50]/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
        >
          {/* Modal Header */}
          <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#162217]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#278b50]/20 border border-[#278b50]/40 flex items-center justify-center text-[#4ade80]">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  Pinpoint Your Farm Location
                  <span className="text-[10px] font-semibold bg-[#278b50]/30 text-[#4ade80] px-2 py-0.5 rounded-full border border-[#278b50]/40 hidden sm:inline">
                    Live GPS & Satellite
                  </span>
                </h3>
                <p className="text-[11px] text-stone-400">
                  Click anywhere on the map or search your village to auto-fetch soil & climate data
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search, GPS, and Regional Shortcuts Bar */}
          <div className="p-3 sm:p-4 border-b border-white/10 bg-[#111711] space-y-2 shrink-0">
            <div className="flex items-center gap-2">
              {/* Autocomplete Search Input */}
              <div className="relative flex-1">
                <div className="flex items-center gap-2 bg-[#1a231a] border border-white/15 rounded-xl px-3 py-2 focus-within:border-[#278b50] transition-colors">
                  <Search size={15} className="text-stone-400 shrink-0" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search village, taluk, town, or district (e.g. Mandya, Nashik, Ludhiana, Thanjavur)..."
                    className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none"
                  />
                  {isSearching && <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-ping shrink-0" />}
                </div>

                {/* Dropdown Results */}
                {searchResults.length > 0 && (
                  <div className="absolute top-11 left-0 right-0 z-50 bg-[#192219] border border-white/15 rounded-xl shadow-2xl overflow-hidden divide-y divide-white/5 max-h-56 overflow-y-auto">
                    {searchResults.map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleSelectSearchResult(item)}
                        className="p-2.5 text-xs text-stone-200 hover:bg-[#233123] hover:text-white cursor-pointer transition-colors flex items-center gap-2"
                      >
                        <MapPin size={13} className="text-[#278b50] shrink-0" />
                        <span className="truncate">{item.displayName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* GPS Auto-Detect Button */}
              <button
                type="button"
                onClick={attemptDeviceGps}
                disabled={isDetectingGps}
                className="px-3.5 py-2 bg-[#278b50] hover:bg-[#1f7a44] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shrink-0 disabled:opacity-50"
                title="Detect exact GPS from your mobile or PC device"
              >
                {isDetectingGps ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                ) : (
                  <Navigation size={14} />
                )}
                <span>Current GPS</span>
              </button>
            </div>

            {/* Popular Farming Hub Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
              <span className="text-[10px] uppercase font-bold text-stone-500 shrink-0 flex items-center gap-1">
                <Layers size={11} /> Belts:
              </span>
              {POPULAR_FARMING_HUBS.map((hub) => (
                <button
                  key={hub.name}
                  type="button"
                  onClick={() => {
                    setSearchQuery(hub.name);
                    updateMapPosition(hub.lat, hub.lon, hub.name);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#1a231a] hover:bg-[#243324] text-[11px] text-stone-300 hover:text-white border border-white/10 transition-all shrink-0 font-medium"
                >
                  {hub.name}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Leaflet Map Viewport */}
          <div className="relative flex-1 min-h-[220px] bg-[#0c120c] overflow-hidden">
            <div 
              ref={mapContainerRef} 
              className="absolute inset-0 w-full h-full"
              style={{ zIndex: 1 }}
            />

            {/* Floating Map Helper Badge */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-[#141d14]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-[11px] shadow-lg pointer-events-none">
              <Info size={13} className="text-[#4ade80]" />
              <span className="text-stone-300">
                Click anywhere or drag the green pin to relocate your farm
              </span>
            </div>

            {/* Live Loading Overlay */}
            {(isLoadingAgro || isDetectingGps) && (
              <div className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-[#141d14]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#278b50]/60 text-[11px] text-stone-200 shadow-xl animate-pulse">
                <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-ping" />
                <span>{statusMessage || 'Analyzing agro-climate grids...'}</span>
              </div>
            )}
          </div>

          {/* Bottom Confirmation & Agro Parameters Summary Bar */}
          <div className="p-3 sm:p-4 border-t border-white/10 bg-[#162016] shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Selected Location Pill & Extracted Parameters */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-ping" />
                <span className="text-xs sm:text-sm font-bold text-white truncate">
                  {locationName}
                </span>
                <span className="text-[10px] text-stone-400 bg-black/40 px-2 py-0.5 rounded-md border border-white/5 shrink-0 font-mono">
                  {coords.lat.toFixed(4)}°N, {coords.lon.toFixed(4)}°E
                </span>
              </div>

              {agroData && (
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-stone-400 overflow-x-auto no-scrollbar">
                  <span className="flex items-center gap-1 text-stone-300">
                    <CloudSun size={12} className="text-[#f2b51b]" />
                    {agroData.temperature}°C, {agroData.humidity}% RH
                  </span>
                  <span>•</span>
                  <span>Rain: <b className="text-white">{agroData.rainfall}mm</b></span>
                  <span>•</span>
                  <span>Soil: <b className="text-[#4ade80]">{agroData.soilType}</b></span>
                  <span>•</span>
                  <span>Est. NPK: <b className="text-white">{agroData.nitrogen}:{agroData.phosphorus}:{agroData.potassium}</b></span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-xs font-semibold transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmLocation}
                disabled={isLoadingAgro}
                className="px-5 py-2.5 rounded-xl bg-[#278b50] hover:bg-[#1f7a44] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#278b50]/30 disabled:opacity-50"
              >
                <Check size={16} />
                <span>Confirm & Use Farm Location</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
