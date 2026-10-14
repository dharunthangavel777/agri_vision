import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Loader2, 
  X, 
  Check, 
  Compass, 
  Sparkles, 
  Radio, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocationStore, RealLocationData } from '../stores/locationStore.ts';

const POPULAR_AGRI_HUBS = [
  { name: 'Namakkal, Tamil Nadu', lat: 11.2189, lon: 78.1674, state: 'Tamil Nadu' },
  { name: 'Thanjavur, Tamil Nadu', lat: 10.7870, lon: 79.1378, state: 'Tamil Nadu' },
  { name: 'Coimbatore, Tamil Nadu', lat: 11.0168, lon: 76.9558, state: 'Tamil Nadu' },
  { name: 'Mandya, Karnataka', lat: 12.5222, lon: 76.8974, state: 'Karnataka' },
  { name: 'Shimoga, Karnataka', lat: 13.9299, lon: 75.5681, state: 'Karnataka' },
  { name: 'Guntur, Andhra Pradesh', lat: 16.3067, lon: 80.4365, state: 'Andhra Pradesh' },
  { name: 'Nashik, Maharashtra', lat: 19.9975, lon: 73.7898, state: 'Maharashtra' },
  { name: 'Ludhiana, Punjab', lat: 30.9010, lon: 75.8573, state: 'Punjab' },
  { name: 'Burdwan, West Bengal', lat: 23.2324, lon: 87.8615, state: 'West Bengal' },
];

export const GlobalLocationModal: React.FC = () => {
  const isModalOpen = useLocationStore((state) => state.isModalOpen);
  const setIsModalOpen = useLocationStore((state) => state.setIsModalOpen);
  const location = useLocationStore((state) => state.location);
  const loading = useLocationStore((state) => state.loading);
  const error = useLocationStore((state) => state.error);
  const fetchRealLocation = useLocationStore((state) => state.fetchRealLocation);
  const setManualLocation = useLocationStore((state) => state.setManualLocation);
  const searchLocations = useLocationStore((state) => state.searchLocations);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [detectStatus, setDetectStatus] = useState<string | null>(null);
  const timeoutRef = useRef<any>(null);

  // Debounced search
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      const data = await searchLocations(query.trim());
      setResults(data);
      setIsSearching(false);
    }, 300);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query, searchLocations]);

  const handleDetectGPS = async () => {
    setDetectStatus('Requesting real browser GPS hardware...');
    try {
      const loc = await fetchRealLocation(true);
      if (loc) {
        setDetectStatus(`GPS Locked: ${loc.formatted} (Accuracy ±${Math.round(loc.accuracy || 20)}m)`);
        setTimeout(() => {
          setDetectStatus(null);
          setIsModalOpen(false);
        }, 1200);
      }
    } catch (e: any) {
      setDetectStatus('GPS lookup failed or permission denied.');
    }
  };

  const handleSelect = (name: string, lat?: number, lon?: number) => {
    setManualLocation(name, lat, lon);
    setIsModalOpen(false);
  };

  if (!isModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg bg-[#141b14] border border-[#278b50]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-5 pb-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#278b50]/20 border border-[#278b50]/50 flex items-center justify-center text-[#4ade80]">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">
                  Farm Location Settings
                </h3>
                <p className="text-xs text-stone-300">
                  Accurate GPS & Micro-Climate Calibration
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto no-scrollbar flex-1">
            {/* Active Location Card */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-[#278b50]/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
                    Current Active Location
                  </span>
                  <span className="text-sm font-extrabold text-white truncate block">
                    {location?.formatted || 'Namakkal, Tamil Nadu'}
                  </span>
                  <span className="text-[11px] text-stone-300 block">
                    Coords: {location?.lat?.toFixed(4)}°N, {location?.lon?.toFixed(4)}°E • Source: {location?.source?.toUpperCase() || 'GPS'} {location?.accuracy ? `(±${Math.round(location.accuracy)}m)` : ''}
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-xl bg-[#278b50]/20 text-[#4ade80] border border-[#278b50]/40 text-xs font-bold shrink-0">
                Active
              </span>
            </div>

            {/* GPS Trigger Button */}
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#278b50] to-[#1e6f3f] hover:from-[#2e9d5b] hover:to-[#24824b] text-white font-bold flex items-center justify-center gap-2.5 text-sm transition-all shadow-lg shadow-[#278b50]/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-white" />
                  <span>Locking Real Device GPS...</span>
                </>
              ) : (
                <>
                  <Navigation size={18} className="text-[#a7f3d0]" />
                  <span>Detect Real Device GPS Location</span>
                </>
              )}
            </button>

            {detectStatus && (
              <p className="text-xs text-center text-emerald-300 font-medium animate-pulse">
                {detectStatus}
              </p>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Manual Search Input */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-stone-200 block">
                Search Your Village, District or Taluk:
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Namakkal, Thanjavur, Guntur, Mandya..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/40 border border-white/10 focus:border-[#278b50] text-white text-xs sm:text-sm font-bold focus:outline-none placeholder-stone-500"
                />
                {isSearching && (
                  <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 animate-spin" />
                )}
              </div>

              {/* Autocomplete Results */}
              {results.length > 0 && (
                <div className="mt-1.5 rounded-2xl bg-[#1b241b] border border-white/10 divide-y divide-white/5 overflow-hidden shadow-xl max-h-48 overflow-y-auto no-scrollbar">
                  {results.map((res, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelect(res.displayName, res.lat, res.lon)}
                      className="w-full p-2.5 text-left hover:bg-[#278b50]/20 flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-white block truncate">
                          {res.displayName}
                        </span>
                        <span className="text-[10px] text-stone-300 block">
                          {res.district || res.city}, {res.state}
                        </span>
                      </div>
                      <Check size={14} className="text-[#4ade80] opacity-0 group-hover:opacity-100 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Agricultural Districts Presets */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider block">
                Major Agricultural Farming Belts:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_AGRI_HUBS.map((hub) => (
                  <button
                    key={hub.name}
                    type="button"
                    onClick={() => handleSelect(hub.name, hub.lat, hub.lon)}
                    className="px-3 py-1.5 rounded-xl bg-black/30 hover:bg-[#278b50] border border-white/10 hover:border-[#278b50] text-stone-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Compass size={12} className="text-emerald-400" />
                    <span>{hub.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-black/30 border-t border-white/10 flex items-center justify-between text-xs text-stone-300">
            <span>Changes apply across all AgriVision tools</span>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
