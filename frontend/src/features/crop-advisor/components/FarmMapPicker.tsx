import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  Compass, 
  Crosshair
} from 'lucide-react';
import { geoAgroService, GeoLocationResult, ExtractedAgroData } from '../services/geoAgroService.ts';
import { MapSkeleton } from '../../../shared/components/skeletons/MapSkeleton.tsx';

interface FarmMapPickerProps {
  onLocationSelected: (data: ExtractedAgroData) => void;
  currentLocationName?: string;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
}

export const FarmMapPicker: React.FC<FarmMapPickerProps> = ({ 
  onLocationSelected,
  currentLocationName,
  onAnalyze,
  isAnalyzing = false
}) => {
  // Default coordinates (Centered on Bangalore/Karnataka region)
  const [coords, setCoords] = useState<{ lat: number; lon: number }>({ lat: 12.97, lon: 77.59 });
  const [zoom, setZoom] = useState<number>(8);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeoLocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedAgroData | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const searchTimeoutRef = useRef<any>(null);

  // Debounced search on query change
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await geoAgroService.searchLocations(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // Initial load: Fetch baseline for default location
  useEffect(() => {
    handleCoordinateChange(coords.lat, coords.lon, currentLocationName || 'Bangalore, Karnataka');
  }, []);

  const handleCoordinateChange = async (lat: number, lon: number, customName?: string) => {
    setCoords({ lat, lon });
    setIsExtracting(true);
    setStatusMessage('Querying satellite & ISRIC soil grids...');

    try {
      const data = await geoAgroService.getAutoAgroParameters(lat, lon, customName);
      setExtractedData(data);
      onLocationSelected(data);
      setStatusMessage(null);
    } catch (e) {
      console.error(e);
      setStatusMessage('Using regional soil & climate baselines.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSelectSearchResult = (result: GeoLocationResult) => {
    setSearchQuery(result.displayName);
    setSearchResults([]);
    setZoom(12);
    handleCoordinateChange(result.lat, result.lon, result.displayName.split(',').slice(0, 2).join(', '));
  };

  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsExtracting(true);
    setStatusMessage('Accessing device GPS location...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setZoom(13);
        handleCoordinateChange(latitude, longitude);
      },
      (err) => {
        console.warn('GPS error:', err);
        setIsExtracting(false);
        setStatusMessage('GPS permission denied. Please click on map or search.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Convert lat/lon to OpenStreetMap tile URL calculation for interactive canvas
  const getMapTileUrl = (lat: number, lon: number, z: number) => {
    const latRad = (lat * Math.PI) / 180;
    const n = Math.pow(2, z);
    const xtile = Math.floor(((lon + 180) / 360) * n);
    const ytile = Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n);
    return `https://tile.openstreetmap.org/${z}/${xtile}/${ytile}.png`;
  };

  // Interactive quick region shortcuts (Major Indian farming belts)
  const popularFarmingHubs = [
    { name: 'Punjab (Wheat)', lat: 30.90, lon: 75.85 },
    { name: 'Maharashtra (Cotton)', lat: 19.87, lon: 75.34 },
    { name: 'Karnataka (Paddy)', lat: 12.52, lon: 76.89 },
    { name: 'UP (Sugarcane)', lat: 26.84, lon: 80.94 },
    { name: 'Gujarat (Groundnut)', lat: 21.52, lon: 70.45 },
    { name: 'Andhra (Chilli)', lat: 16.30, lon: 80.43 },
  ];

  return (
    <div className="agri-card p-3.5 flex flex-col h-full min-h-0 space-y-2.5 overflow-hidden">
      
      {/* Search Bar & GPS Button */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative flex-1">
          <div className="flex items-center gap-2 bg-[#1c241c] border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-[#278b50]/60 transition-colors">
            <Search size={14} className="text-stone-400 shrink-0" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search village, taluk, or district (e.g., Mandya, Nashik, Ludhiana)..."
              className="flex-1 bg-transparent text-xs text-white placeholder-stone-500 focus:outline-none"
            />
            {isSearching && <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-ping shrink-0" />}
          </div>

          {/* Live Search Suggestions Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-10 left-0 right-0 z-50 bg-[#1e271e] border border-white/10 rounded-xl shadow-2xl overflow-hidden divide-y divide-white/5 max-h-48 overflow-y-auto">
              {searchResults.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSelectSearchResult(item)}
                  className="p-2 text-xs text-stone-200 hover:bg-[#253325] hover:text-white cursor-pointer transition-colors flex items-center gap-2"
                >
                  <MapPin size={13} className="text-[#278b50] shrink-0" />
                  <span className="truncate">{item.displayName}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleUseCurrentGPS}
          disabled={isExtracting}
          className="px-3 py-1.5 bg-[#278b50] hover:bg-[#1f7a44] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shrink-0 disabled:opacity-50"
          title="Detect GPS from current device"
        >
          <Navigation size={13} />
          <span className="hidden sm:inline">GPS</span>
        </button>
      </div>

      {/* Quick Regional Agricultural Hub Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar shrink-0">
        <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider shrink-0">Hubs:</span>
        {popularFarmingHubs.map((hub) => (
          <button
            key={hub.name}
            type="button"
            onClick={() => {
              setSearchQuery(hub.name);
              handleCoordinateChange(hub.lat, hub.lon, hub.name);
            }}
            className="px-2 py-0.5 rounded-lg bg-[#202820] hover:bg-[#273527] text-[11px] text-stone-300 hover:text-white border border-white/5 transition-all shrink-0"
          >
            {hub.name}
          </button>
        ))}
      </div>

      {/* Interactive Map Visual Viewport (fills flex-1 space) */}
      <div className="relative rounded-xl overflow-hidden flex-1 min-h-[160px] border border-[rgba(255,255,255,0.08)] bg-[#121912] shadow-inner select-none">
        
        {/* Dynamic Map Tile Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-60"
          style={{
            backgroundImage: `url(${getMapTileUrl(coords.lat, coords.lon, zoom)})`,
            filter: 'contrast(1.1) brightness(0.85) saturate(0.9)'
          }}
        />

        {/* Topographic Field Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-25 pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(39, 139, 80, 0.4) 1px, transparent 0)', 
            backgroundSize: '24px 24px' 
          }} 
        />

        {/* Center Field Marker Pin */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
          <div className="relative flex flex-col items-center animate-bounce">
            <div className="px-2.5 py-0.5 bg-[#1a241a]/90 backdrop-blur-md border border-[#278b50] rounded-full text-white text-[11px] font-bold shadow-xl mb-1 flex items-center gap-1">
              <MapPin size={11} className="text-[#278b50]" />
              <span className="truncate max-w-[160px]">{extractedData?.locationName || 'Selected Land'}</span>
            </div>
            <div className="w-5 h-5 rounded-full bg-[#278b50] ring-4 ring-[#278b50]/40 flex items-center justify-center text-white">
              <Crosshair size={12} />
            </div>
          </div>
        </div>

        {/* Map Interactive Click Surface */}
        <div 
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const deltaX = (x / rect.width - 0.5) * 0.4;
            const deltaY = (0.5 - y / rect.height) * 0.4;
            handleCoordinateChange(
              parseFloat((coords.lat + deltaY).toFixed(3)), 
              parseFloat((coords.lon + deltaX).toFixed(3))
            );
          }}
          className="absolute inset-0 cursor-crosshair z-10"
          title="Click to relocate pin marker"
        />

        {/* Map Coordinates Pill */}
        <div className="absolute bottom-2 left-2 z-30 flex items-center gap-1.5 bg-[#172117]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] text-stone-300">
          <Compass size={11} className="text-[#278b50]" />
          <span>{coords.lat.toFixed(2)}°N, {coords.lon.toFixed(2)}°E</span>
          <span className="text-stone-500 hidden sm:inline">• Click to reposition</span>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-2 right-2 z-30 flex gap-1">
          <button
            type="button"
            onClick={() => setZoom(Math.min(16, zoom + 1))}
            className="w-6 h-6 bg-[#172117]/90 hover:bg-[#253325] text-white text-xs font-bold rounded-lg border border-white/10 flex items-center justify-center transition-colors"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom(Math.max(4, zoom - 1))}
            className="w-6 h-6 bg-[#172117]/90 hover:bg-[#253325] text-white text-xs font-bold rounded-lg border border-white/10 flex items-center justify-center transition-colors"
          >
            -
          </button>
        </div>

        {/* Loading Overlay with MapSkeleton */}
        {isExtracting && <MapSkeleton />}
      </div>

      {/* Extracted Telemetry Card with direct Action button */}
      {extractedData && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-[#192419] to-[#1e2e1e] border border-[#278b50]/30 shadow-md shrink-0">
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5 min-w-0">
              <CheckCircle2 size={14} className="text-[#278b50] shrink-0" />
              <b className="text-xs text-white truncate">{extractedData.locationName}</b>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/40 shrink-0">
              Auto-Synced
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
            <div className="agri-in py-1 px-1 rounded-lg">
              <span className="text-[9px] text-stone-400 block">Soil Acidity</span>
              <b className="text-white text-xs block">pH {extractedData.ph}</b>
              <span className="text-[8px] text-emerald-400 block truncate">{extractedData.soilType.split(' ')[0]}</span>
            </div>

            <div className="agri-in py-1 px-1 rounded-lg">
              <span className="text-[9px] text-stone-400 block">NPK Ratio</span>
              <b className="text-white text-xs block">{extractedData.nitrogen}:{extractedData.phosphorus}:{extractedData.potassium}</b>
              <span className="text-[8px] text-stone-400 block">kg/ha</span>
            </div>

            <div className="agri-in py-1 px-1 rounded-lg">
              <span className="text-[9px] text-stone-400 block">Temperature</span>
              <b className="text-white text-xs block">{extractedData.temperature}°C</b>
              <span className="text-[8px] text-stone-400 block">{extractedData.humidity}% Hum</span>
            </div>

            <div className="agri-in py-1 px-1 rounded-lg">
              <span className="text-[9px] text-stone-400 block">Rainfall</span>
              <b className="text-white text-xs block">{extractedData.rainfall} mm</b>
              <span className="text-[8px] text-emerald-400 block">Seasonal</span>
            </div>
          </div>

          {onAnalyze && (
            <button
              type="button"
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="w-full mt-2.5 py-2.5 px-4 bg-[#278b50] hover:bg-[#1f7a44] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-[#278b50]/20 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  <span>Analyzing Soil Suitability...</span>
                </div>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Recommend Best Crops for This Land</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

    </div>
  );
};
