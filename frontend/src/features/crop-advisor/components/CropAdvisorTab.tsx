import React, { useState, useEffect, useRef } from 'react';
import { 
  Sprout, 
  FlaskConical, 
  Sparkles, 
  RefreshCw, 
  CloudRain, 
  MapPin, 
  UploadCloud, 
  FileText, 
  TrendingUp, 
  Printer, 
  Check, 
  Navigation, 
  Loader2, 
  Layers, 
  Info, 
  Copy, 
  Leaf,
  ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  agricultureService, 
  CropInput, 
  PredictionResult, 
  ExtractedSoilReport, 
  getCropImage 
} from '../../chat/services/aiService.ts';
import { useAppContext } from '../../../core/context/AppContext.tsx';
import { CropAdvisorSkeleton } from '../../../shared/components/skeletons/CropAdvisorSkeleton.tsx';
import { useAuth } from '../../../core/context/AuthContext.tsx';
import { useLocation } from '../../../shared/hooks/useLocation.ts';
import { useHistoryStore } from '../../history/stores/historyStore.ts';
import { geoAgroService, ExtractedAgroData } from '../services/geoAgroService.ts';

export const CropAdvisorTab: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { location, locationName, refresh: fetchRealLocation } = useLocation();
  const { appData, updateModuleData } = useAppContext();
  const addEntry = useHistoryStore((state) => state.addEntry);

  // Form State
  const [soilType, setSoilType] = useState<string>('Loamy Soil');
  const [season, setSeason] = useState<string>('Kharif (Monsoon)');
  const [selectedLandName, setSelectedLandName] = useState<string>(
    locationName || user?.location || 'Detecting GPS...'
  );
  const [coords, setCoords] = useState<{ lat: number; lon: number }>({ 
    lat: location?.lat || 12.9716, 
    lon: location?.lon || 77.5946 
  });

  // Background Location State
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // File Upload State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isExtractingReport, setIsExtractingReport] = useState(false);
  const [extractedNotice, setExtractedNotice] = useState<string | null>(null);

  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Presets
  const applyPreset = (preset: {
    nitrogen: string;
    phosphorus: string;
    potassium: string;
    temperature: string;
    humidity: string;
    ph: string;
    rainfall: string;
    soilType: string;
    season: string;
  }) => {
    updateModuleData('cropForm', {
      nitrogen: preset.nitrogen,
      phosphorus: preset.phosphorus,
      potassium: preset.potassium,
      temperature: preset.temperature,
      humidity: preset.humidity,
      ph: preset.ph,
      rainfall: preset.rainfall
    });
    setSoilType(preset.soilType);
    setSeason(preset.season);
  };

  // Sync with global real device location when available
  useEffect(() => {
    if (location?.lat && location?.lon) {
      setCoords({ lat: location.lat, lon: location.lon });
      if (locationName && locationName !== 'Detecting GPS...') {
        setSelectedLandName(locationName);
      }
    }
  }, [location, locationName]);

  // Initial GPS detection & background sync on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(4));
          const lon = parseFloat(pos.coords.longitude.toFixed(4));
          setCoords({ lat, lon });
          try {
            const addr = await geoAgroService.reverseGeocode(lat, lon);
            if (addr) setSelectedLandName(addr);
            const data: ExtractedAgroData = await geoAgroService.getAutoAgroParameters(lat, lon, addr);
            if (data) {
              if (data.locationName) setSelectedLandName(data.locationName);
              if (data.soilType && (!soilType || soilType === 'Loamy Soil')) setSoilType(data.soilType);
              updateModuleData('cropForm', {
                ...appData.cropForm,
                temperature: String(data.temperature || appData.cropForm.temperature),
                humidity: String(data.humidity || appData.cropForm.humidity),
                rainfall: String(data.rainfall || appData.cropForm.rainfall)
              });
            }
          } catch (e) {
            console.warn('Initial GPS agro sync error:', e);
          }
        },
        (err) => {
          console.warn('Background GPS request dismissed or unavailable:', err);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  }, []);

  // Background Device GPS Geolocation Button Trigger
  const handleDetectGPS = async () => {
    setIsDetectingGps(true);
    try {
      const loc = await fetchRealLocation();
      if (loc) {
        const lat = parseFloat(loc.lat.toFixed(4));
        const lon = parseFloat(loc.lon.toFixed(4));
        setCoords({ lat, lon });
        if (loc.formatted) setSelectedLandName(loc.formatted);

        const data: ExtractedAgroData = await geoAgroService.getAutoAgroParameters(lat, lon, loc.formatted);
        if (data) {
          if (data.locationName) setSelectedLandName(data.locationName);
          if (data.soilType && (!soilType || soilType === 'Loamy Soil')) setSoilType(data.soilType);
          updateModuleData('cropForm', {
            ...appData.cropForm,
            temperature: String(data.temperature || appData.cropForm.temperature),
            humidity: String(data.humidity || appData.cropForm.humidity),
            rainfall: String(data.rainfall || appData.cropForm.rainfall)
          });
        }
      }
    } catch (e) {
      console.warn('GPS detection error/denied:', e);
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Handle Soil Report Upload & AI Extraction
  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setIsExtractingReport(true);
    setExtractedNotice(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        const result: ExtractedSoilReport = await agricultureService.parseSoilReport(base64Data, file.type);
        
        // Auto-fill extracted values into manual form
        updateModuleData('cropForm', {
          ...appData.cropForm,
          nitrogen: String(result.nitrogen ?? appData.cropForm.nitrogen),
          phosphorus: String(result.phosphorus ?? appData.cropForm.phosphorus),
          potassium: String(result.potassium ?? appData.cropForm.potassium),
          ph: String(result.ph ?? appData.cropForm.ph)
        });

        if (result.soilType) setSoilType(result.soilType);
        setExtractedNotice(`Auto-Filled: N=${result.nitrogen}, P=${result.phosphorus}, K=${result.potassium}, pH=${result.ph}`);
        setIsExtractingReport(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('Soil report extraction error:', err);
      setIsExtractingReport(false);
    }
  };

  // Recommendation Submission (Single Simple Step)
  const handleCropRecommendation = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const input: CropInput = {
      nitrogen: Number(appData.cropForm.nitrogen) || 90,
      phosphorus: Number(appData.cropForm.phosphorus) || 42,
      potassium: Number(appData.cropForm.potassium) || 45,
      temperature: Number(appData.cropForm.temperature) || 26,
      humidity: Number(appData.cropForm.humidity) || 65,
      ph: Number(appData.cropForm.ph) || 6.5,
      rainfall: Number(appData.cropForm.rainfall) || 120,
      location: selectedLandName,
      soilType,
      season
    };

    updateModuleData('advisorLoading', true);
    updateModuleData('advisorError', null);

    try {
      const res = await agricultureService.recommendCrop(input);
      updateModuleData('advisor', res);
      addEntry({
        id: Date.now(),
        module: 'crop',
        input,
        output: res,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      updateModuleData('advisorError', err.message);
    } finally {
      updateModuleData('advisorLoading', false);
    }
  };

  const advisor: PredictionResult | null = appData.advisor;
  const currentPh = Number(appData.cropForm.ph) || 6.5;

  // ChatGPT-style word-by-word streaming for crop advisor overview
  const [streamedOverview, setStreamedOverview] = useState<string>('');
  const [isOverviewStreaming, setIsOverviewStreaming] = useState<boolean>(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (advisor?.overviewSummary) {
      const fullText = advisor.overviewSummary;
      const tokens = fullText.split(/(\s+)/);
      let current = '';
      setIsOverviewStreaming(true);
      setStreamedOverview('');

      let index = 0;
      const interval = setInterval(() => {
        if (index < tokens.length) {
          current += tokens[index];
          setStreamedOverview(current);
          index++;
        } else {
          setIsOverviewStreaming(false);
          clearInterval(interval);
        }
      }, 16);

      return () => clearInterval(interval);
    } else {
      setStreamedOverview('');
      setIsOverviewStreaming(false);
    }
  }, [advisor]);

  return (
    <div className="w-full max-w-7xl mx-auto h-[calc(100vh-105px)] max-h-[calc(100vh-105px)] flex flex-col space-y-2.5 overflow-hidden">
      
      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-0 overflow-hidden">
        
        {/* LEFT COLUMN: STREAMLINED DATA INPUT & SINGLE ACTION */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-0 overflow-y-auto no-scrollbar agri-card p-4 space-y-3">
          
          {/* SECTION 1: MANUAL SOIL NUTRIENTS & FIELD CONDITIONS */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-black/25 border border-white/10 space-y-3 shadow-sm">
            
            {/* Section Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#278b50]/20 border border-[#278b50]/40 flex items-center justify-center text-[#4ade80]">
                  <FlaskConical size={18} />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-normal">
                  Manual Soil Nutrients & Field Conditions
                </h3>
              </div>

              {extractedNotice && (
                <span className="text-xs text-[#4ade80] bg-[#278b50]/20 px-3 py-1 rounded-full border border-[#278b50]/30 font-semibold font-mono truncate max-w-[240px]">
                  ✓ {extractedNotice}
                </span>
              )}
            </div>

            {/* Presets Strip */}
            <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar shrink-0">
              <span className="text-xs sm:text-sm text-stone-200 font-bold shrink-0">Presets:</span>
              {[
                { name: 'Paddy', nitrogen: '90', phosphorus: '42', potassium: '43', temperature: '26', humidity: '80', ph: '6.5', rainfall: '180', soilType: 'Clayey Loam', season: 'Kharif (Monsoon)' },
                { name: 'Wheat', nitrogen: '120', phosphorus: '50', potassium: '60', temperature: '18', humidity: '55', ph: '7.0', rainfall: '80', soilType: 'Alluvial Soil', season: 'Rabi (Winter)' },
                { name: 'Maize', nitrogen: '80', phosphorus: '40', potassium: '40', temperature: '25', humidity: '60', ph: '6.8', rainfall: '90', soilType: 'Loamy Soil', season: 'Kharif (Monsoon)' },
                { name: 'Cotton', nitrogen: '100', phosphorus: '45', potassium: '50', temperature: '30', humidity: '50', ph: '7.6', rainfall: '70', soilType: 'Black Cotton Soil', season: 'Kharif (Monsoon)' },
                { name: 'Pulses', nitrogen: '40', phosphorus: '50', potassium: '40', temperature: '22', humidity: '45', ph: '7.2', rainfall: '60', soilType: 'Sandy Loam', season: 'Rabi (Winter)' },
              ].map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs sm:text-sm font-semibold text-stone-200 hover:text-white border border-white/10 hover:border-[#278b50]/40 transition-all shrink-0 shadow-sm cursor-pointer"
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* PERFECTLY ALIGNED 3x3 DATA GRID */}
            <div className="grid grid-cols-3 gap-2.5">
              
              {/* ROW 1: PRIMARY NUTRIENTS (N, P, K) */}
              <div className="agri-in flex flex-col justify-between p-2.5 rounded-2xl bg-black/30 border border-white/10 focus-within:border-[#278b50] transition-colors">
                <label className="text-xs sm:text-sm font-bold text-stone-200 block">Nitrogen (N)</label>
                <input 
                  type="number" 
                  placeholder="90"
                  min="0"
                  max="240"
                  value={appData.cropForm.nitrogen}
                  onChange={e => updateModuleData('cropForm', {...appData.cropForm, nitrogen: e.target.value})}
                  className="w-full bg-transparent border-none text-white text-lg sm:text-2xl font-black focus:outline-none placeholder-stone-500 my-0.5"
                />
                <span className="text-xs font-semibold text-emerald-400/90 block">40 - 140 kg/ha</span>
              </div>

              <div className="agri-in flex flex-col justify-between p-2.5 rounded-2xl bg-black/30 border border-white/10 focus-within:border-[#278b50] transition-colors">
                <label className="text-xs sm:text-sm font-bold text-stone-200 block">Phosphorus (P)</label>
                <input 
                  type="number" 
                  placeholder="42"
                  min="0"
                  max="200"
                  value={appData.cropForm.phosphorus}
                  onChange={e => updateModuleData('cropForm', {...appData.cropForm, phosphorus: e.target.value})}
                  className="w-full bg-transparent border-none text-white text-lg sm:text-2xl font-black focus:outline-none placeholder-stone-500 my-0.5"
                />
                <span className="text-xs font-semibold text-emerald-400/90 block">20 - 70 kg/ha</span>
              </div>

              <div className="agri-in flex flex-col justify-between p-2.5 rounded-2xl bg-black/30 border border-white/10 focus-within:border-[#278b50] transition-colors">
                <label className="text-xs sm:text-sm font-bold text-stone-200 block">Potassium (K)</label>
                <input 
                  type="number" 
                  placeholder="45"
                  min="0"
                  max="200"
                  value={appData.cropForm.potassium}
                  onChange={e => updateModuleData('cropForm', {...appData.cropForm, potassium: e.target.value})}
                  className="w-full bg-transparent border-none text-white text-lg sm:text-2xl font-black focus:outline-none placeholder-stone-500 my-0.5"
                />
                <span className="text-xs font-semibold text-emerald-400/90 block">25 - 80 kg/ha</span>
              </div>

              {/* ROW 2: ENVIRONMENT & SOIL METRICS (pH, Temp, Rain) */}
              <div className="agri-in flex flex-col justify-between p-2.5 rounded-2xl bg-black/30 border border-white/10 focus-within:border-[#278b50] transition-colors">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-stone-200 block">Soil pH</label>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    currentPh < 6 ? 'bg-amber-950/80 text-amber-300' : currentPh > 7.5 ? 'bg-blue-950/80 text-blue-300' : 'bg-emerald-950/80 text-emerald-300'
                  }`}>
                    {currentPh < 6 ? 'Acid' : currentPh > 7.5 ? 'Alk' : 'Neut'}
                  </span>
                </div>
                <input 
                  type="number" 
                  step="0.1"
                  min="3.5"
                  max="10.0"
                  value={appData.cropForm.ph}
                  onChange={e => updateModuleData('cropForm', {...appData.cropForm, ph: e.target.value})}
                  className="w-full bg-transparent border-none text-white text-lg sm:text-2xl font-black focus:outline-none my-0.5"
                />
                <span className="text-xs font-semibold text-emerald-400/90 block">6.0 - 7.5 Ideal</span>
              </div>

              <div className="agri-in flex flex-col justify-between p-2.5 rounded-2xl bg-black/30 border border-white/10 focus-within:border-[#278b50] transition-colors">
                <label className="text-xs sm:text-sm font-bold text-stone-200 block">Temp (°C)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={appData.cropForm.temperature}
                  onChange={e => updateModuleData('cropForm', {...appData.cropForm, temperature: e.target.value})}
                  className="w-full bg-transparent border-none text-white text-lg sm:text-2xl font-black focus:outline-none my-0.5"
                />
                <span className="text-xs font-medium text-stone-300 block">Daytime Avg</span>
              </div>

              <div className="agri-in flex flex-col justify-between p-2.5 rounded-2xl bg-black/30 border border-white/10 focus-within:border-[#278b50] transition-colors">
                <label className="text-xs sm:text-sm font-bold text-stone-200 block">Rain (mm)</label>
                <input 
                  type="number" 
                  value={appData.cropForm.rainfall}
                  onChange={e => updateModuleData('cropForm', {...appData.cropForm, rainfall: e.target.value})}
                  className="w-full bg-transparent border-none text-white text-lg sm:text-2xl font-black focus:outline-none my-0.5"
                />
                <span className="text-xs font-medium text-stone-300 block">Seasonal Rain</span>
              </div>

              {/* ROW 3: CONTEXTUAL METRICS (Soil Type, Season, Auto GPS Location) */}
              <div className="agri-in flex flex-col justify-between p-2.5 rounded-2xl bg-black/30 border border-white/10 focus-within:border-[#278b50] transition-colors">
                <label className="text-xs sm:text-sm font-bold text-stone-200 block">Soil Type</label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full bg-transparent border-none text-white text-xs sm:text-sm font-bold focus:outline-none cursor-pointer my-1.5 [&>option]:bg-[#242824] [&>option]:text-white"
                >
                  <option value="Loamy Soil">Loamy Soil</option>
                  <option value="Alluvial Soil">Alluvial Soil</option>
                  <option value="Black Cotton Soil">Black Cotton</option>
                  <option value="Red / Laterite Soil">Red Soil</option>
                  <option value="Clayey Loam">Clayey Loam</option>
                  <option value="Sandy Loam">Sandy Loam</option>
                </select>
                <span className="text-xs font-medium text-stone-300 block">Soil Texture</span>
              </div>

              <div className="agri-in flex flex-col justify-between p-2.5 rounded-2xl bg-black/30 border border-white/10 focus-within:border-[#278b50] transition-colors">
                <label className="text-xs sm:text-sm font-bold text-stone-200 block">Cropping Season</label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full bg-transparent border-none text-white text-xs sm:text-sm font-bold focus:outline-none cursor-pointer my-1.5 [&>option]:bg-[#242824] [&>option]:text-white"
                >
                  <option value="Kharif (Monsoon)">Kharif (Monsoon)</option>
                  <option value="Rabi (Winter)">Rabi (Winter)</option>
                  <option value="Zaid (Summer)">Zaid (Summer)</option>
                  <option value="Whole Year">Whole Year</option>
                </select>
                <span className="text-xs font-medium text-stone-300 block">Sowing Window</span>
              </div>

              {/* Automatic Background Device Location */}
              <div className="agri-in flex flex-col justify-between p-2.5 rounded-2xl bg-black/30 border border-white/10 focus-within:border-[#278b50] transition-colors">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-stone-200 block">Farm Location</label>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={isDetectingGps}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Click to refresh GPS location"
                  >
                    {isDetectingGps ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    ) : (
                      <Navigation size={10} className="text-emerald-400" />
                    )}
                    <span>{isDetectingGps ? 'Locating...' : 'Auto GPS'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={selectedLandName}
                  onChange={(e) => setSelectedLandName(e.target.value)}
                  placeholder="e.g. Mandya, Karnataka"
                  className="w-full bg-transparent border-none text-white text-xs sm:text-sm font-bold focus:outline-none my-1.5 truncate placeholder-stone-500"
                />
                <span className="text-xs font-medium text-stone-300 block truncate flex items-center gap-1">
                  <MapPin size={11} className="text-[#4ade80] shrink-0" />
                  <span className="truncate">{coords.lat ? `${coords.lat}°N, ${coords.lon}°E` : 'Auto-detected'}</span>
                </span>
              </div>

            </div>
          </div>

          {/* DIVIDER: ─── Or ─── */}
          <div className="relative flex items-center justify-center my-0.5 shrink-0">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#242824] px-5 py-1 rounded-full border border-white/10 text-xs sm:text-sm font-extrabold text-[#4ade80] shrink-0 shadow-sm">
              ─── Or ───
            </span>
            <div className="border-t border-white/10 w-full" />
          </div>

          {/* SECTION 2: UPLOAD SOIL REPORT IMAGE OR PDF */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border-2 border-dashed border-white/15 hover:border-[#278b50] bg-black/25 hover:bg-white/[0.04] cursor-pointer transition-all space-y-2.5 shadow-sm shrink-0"
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden" 
            />

            <div className="w-12 h-12 rounded-2xl bg-[#278b50]/20 border border-[#278b50]/40 text-[#4ade80] flex items-center justify-center shadow-md">
              <UploadCloud size={24} />
            </div>

            <div className="space-y-0.5 text-center">
              <h4 className="text-sm sm:text-base font-bold text-white tracking-normal">
                {uploadedFile ? uploadedFile.name : 'Upload Soil Health Card or Lab Report (PDF / Image)'}
              </h4>
              <p className="text-xs text-stone-300 max-w-md mx-auto font-medium">
                AI will automatically extract Nitrogen, Phosphorus, Potassium, and pH values into the fields above
              </p>
            </div>

            {isExtractingReport ? (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#4ade80] font-bold bg-[#278b50]/20 px-4 py-1.5 rounded-xl border border-[#278b50]/40">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80] animate-ping" />
                <span>Scanning & Extracting Nutrients...</span>
              </div>
            ) : (
              <span className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#278b50] hover:bg-[#1f7a44] rounded-xl shadow-md transition-all inline-flex items-center gap-2">
                <FileText size={15} />
                {uploadedFile ? 'Change Soil Report' : 'Browse Soil Report (PDF / Image)'}
              </span>
            )}
          </div>

          {/* SINGLE PRIMARY CTA BUTTON: DIRECT AI RECOMMENDATION */}
          <div className="shrink-0 pt-1">
            <button
              type="button"
              onClick={handleCropRecommendation}
              disabled={appData.advisorLoading}
              className="w-full bg-[#278b50] hover:bg-[#1f7a44] text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-[#278b50]/25 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-50"
            >
              {appData.advisorLoading ? (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  <span>Analyzing Soil & Agronomy with ChatGPT...</span>
                </div>
              ) : (
                <>
                  <Sparkles size={18} className="text-[#a7f3d0]" />
                  <span>Get AI Crop Recommendation</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: AI RECOMMENDATION DESIGN */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 overflow-hidden">
          
          {appData.advisorLoading ? (
            <CropAdvisorSkeleton />
          ) : advisor ? (
            <div className="agri-card p-4 sm:p-5 flex flex-col h-full min-h-0 space-y-3 overflow-hidden border-[#278b50]/30 shadow-2xl bg-[#182018]">
              
              {/* TOP ACTION BAR: ChatGPT Header & Controls */}
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#278b50]/20 border border-[#278b50]/40 flex items-center justify-center text-[#4ade80]">
                    <Sparkles size={15} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      ChatGPT Agronomic Advisory
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#278b50]/20 text-[#4ade80] rounded border border-[#278b50]/40 font-mono">
                        gpt-4o-mini
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!advisor) return;
                      const text = `${advisor.overviewSummary || ''}\n\n1. Soil Analysis:\n${(advisor.soilAnalysis || []).map(s => `${s.title}: ${s.statusBadge}\n${s.explanation}`).join('\n\n')}\n\n2. Recommended Crops:\n${(advisor.recommendedCrops || []).map(c => `${c.name} (${c.badge || ''})\nWater: ${c.waterRequirement}\n${c.points.join('\n')}`).join('\n\n')}`;
                      navigator.clipboard.writeText(text);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    title="Copy Advisory"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {isCopied ? <Check size={13} className="text-[#4ade80]" /> : <Copy size={13} />}
                    <span className="text-[11px] hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateModuleData('advisor', null);
                      updateModuleData('advisorError', null);
                    }}
                    title="New Analysis"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={13} />
                    <span className="text-[11px] hidden sm:inline">New</span>
                  </button>
                </div>
              </div>

              {/* SCROLLABLE CHATGPT RESPONSE CONTAINER */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 no-scrollbar text-stone-200">
                
                {/* INTRODUCTORY OVERVIEW SUMMARY (STREAMED WORD-BY-WORD LIKE CHATGPT) */}
                <div className="text-xs sm:text-sm leading-relaxed text-stone-200 font-medium bg-black/25 p-3 rounded-xl border border-white/5">
                  {streamedOverview || advisor.overviewSummary || (
                    <span>
                      Based on your soil report, your land appears suitable for several crops, especially <strong className="text-white">maize</strong>, <strong className="text-white">pulses</strong>, <strong className="text-white">cotton</strong>, and <strong className="text-white">paddy</strong>. The best choice depends on your irrigation availability, season, and whether you want maximum profit or a lower-risk crop.
                    </span>
                  )}
                  {isOverviewStreaming && (
                    <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-400 animate-pulse align-middle rounded-xs" />
                  )}
                </div>

                {/* 1. YOUR SOIL REPORT ANALYSIS */}
                <div className="space-y-2.5">
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span>1. Your soil report analysis</span>
                  </h3>

                  {/* Single Unified Container */}
                  <div className="rounded-2xl bg-black/30 border border-white/10 divide-y divide-white/10 overflow-hidden shadow-sm">
                    {(advisor.soilAnalysis || []).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 hover:bg-white/[0.02] transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-[#278b50]/20 border border-[#278b50]/40 flex items-center justify-center text-[#4ade80] shrink-0 mt-0.5">
                          {item.iconType === 'ph' && <Leaf size={16} />}
                          {item.iconType === 'nitrogen' && <FlaskConical size={16} />}
                          {item.iconType === 'pk' && <Sprout size={16} />}
                          {item.iconType === 'weather' && <CloudRain size={16} />}
                          {item.iconType === 'soil' && <Layers size={16} />}
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="text-xs font-bold text-white">{item.title}</div>
                          <div className="text-[11px] font-semibold text-[#4ade80]">{item.statusBadge}</div>
                          <div className="text-[11px] text-stone-300 leading-normal">{item.explanation}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. RECOMMENDED CROPS FOR YOUR SOIL */}
                <div className="space-y-2.5 pt-1">
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span>2. Recommended crops for your soil</span>
                  </h3>

                  {/* Single Unified Container */}
                  <div className="rounded-2xl bg-black/30 border border-white/10 divide-y divide-white/10 overflow-hidden shadow-sm">
                    {(advisor.recommendedCrops || []).map((crop, idx) => (
                      <div 
                        key={crop.id || idx}
                        className={`p-3.5 flex flex-col sm:flex-row gap-3 hover:bg-white/[0.02] transition-colors ${
                          idx === 0 ? 'bg-gradient-to-r from-[#172418]/60 to-[#121c13]/60' : ''
                        }`}
                      >
                        {/* Crop Image Thumbnail with Skeleton Placeholder */}
                        <div className="w-full sm:w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-white/10 relative bg-stone-900">
                          {!loadedImages[crop.name] && (
                            <div className="absolute inset-0 bg-stone-800/80 animate-pulse flex flex-col items-center justify-center gap-1">
                              <Sprout size={18} className="text-emerald-500/50 animate-bounce" />
                              <span className="text-[9px] text-stone-500">AI Preview...</span>
                            </div>
                          )}
                          <img 
                            src={crop.imageUrl || getCropImage(crop.name)} 
                            alt={crop.name}
                            onLoad={() => setLoadedImages(prev => ({ ...prev, [crop.name]: true }))}
                            className={`w-full h-full object-cover transition-opacity duration-300 ${loadedImages[crop.name] ? 'opacity-100' : 'opacity-0'}`}
                            loading="lazy"
                          />
                          {crop.badge && (
                            <span className="sm:hidden absolute top-1.5 left-1.5 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#278b50] text-white">
                              {crop.badge}
                            </span>
                          )}
                        </div>

                        {/* Crop Details */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                                {crop.name}
                              </h4>
                              {crop.badge && (
                                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#278b50]/20 text-[#4ade80] border border-[#278b50]/40 mt-0.5">
                                  {crop.badge}
                                </span>
                              )}
                            </div>

                            {crop.estimatedNetProfit && (
                              <span className="text-[11px] font-bold text-[#f2b51b] font-mono shrink-0">
                                {crop.estimatedNetProfit}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] font-medium text-stone-300">
                            <span className="text-stone-400">Water: </span>
                            <span className="text-white font-semibold">{crop.waterRequirement}</span>
                          </div>

                          {/* Bullet Points */}
                          <ul className="space-y-1 text-[11px] text-stone-300 leading-relaxed">
                            {crop.points.map((pt, pIdx) => (
                              <li key={pIdx} className="flex items-start gap-1.5">
                                <span className="text-[#4ade80] font-bold shrink-0">•</span>
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footnote Citation */}
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-stone-300 leading-relaxed flex items-start gap-2">
                    <Info size={14} className="text-[#4ade80] shrink-0 mt-0.5" />
                    <p>{advisor.disclaimer}</p>
                  </div>
                </div>

              </div>

              {/* CARD FOOTER */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs shrink-0">
                <span className="text-[11px] text-stone-400 flex items-center gap-1">
                  <Check size={13} className="text-[#4ade80]" />
                  Recorded in Farm Activity History
                </span>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white rounded-lg text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Printer size={12} /> Print Advisory
                </button>
              </div>

            </div>
          ) : (
            <div className="agri-card p-6 flex flex-col items-center justify-center text-center h-full min-h-0 space-y-4 border-dashed border-white/10">
              <div className="w-16 h-16 rounded-2xl bg-[#278b50]/15 border border-[#278b50]/30 flex items-center justify-center text-[#4ade80] shadow-inner">
                <Sprout size={32} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-normal">Ready for Agronomic Analysis</h3>
                <p className="text-xs sm:text-sm text-stone-300 max-w-sm leading-relaxed font-medium">
                  Enter your soil nutrients or upload a lab report to instantly receive AI-powered crop recommendations, soil analysis, and expected margin projections.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                <span className="px-3 py-1.5 bg-[#1a231a] rounded-xl border border-white/10 text-stone-200 font-semibold flex items-center gap-1.5 shadow-sm">
                  <FlaskConical size={13} className="text-[#4ade80]" /> Soil Stoichiometry
                </span>
                <span className="px-3 py-1.5 bg-[#1a231a] rounded-xl border border-white/10 text-stone-200 font-semibold flex items-center gap-1.5 shadow-sm">
                  <FileText size={13} className="text-[#4ade80]" /> PDF & Image OCR
                </span>
                <span className="px-3 py-1.5 bg-[#1a231a] rounded-xl border border-white/10 text-stone-200 font-semibold flex items-center gap-1.5 shadow-sm">
                  <TrendingUp size={13} className="text-[#4ade80]" /> Yield & Margin Est.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
