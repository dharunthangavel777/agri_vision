import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  MapPin, 
  Sparkles, 
  RefreshCw, 
  Sprout, 
  Printer, 
  Check, 
  Copy, 
  Leaf, 
  Layers, 
  ExternalLink,
  ShieldAlert,
  Info
} from 'lucide-react';
import { useAppContext } from '../../../core/context/AppContext.tsx';
import { useAuth } from '../../../core/context/AuthContext.tsx';
import { useLocation } from '../../../shared/hooks/useLocation.ts';
import { useHistoryStore } from '../../history/stores/historyStore.ts';
import { agricultureService, FertilizerPlan, getCropImage } from '../../chat/services/aiService.ts';
import { FertilizerScheduleSkeleton } from '../../../shared/components/skeletons/FertilizerScheduleSkeleton.tsx';

export const FertilizerRecommendation: React.FC = () => {
  const { user } = useAuth();
  const { location, locationName } = useLocation();
  const { appData, updateModuleData } = useAppContext();
  const addEntry = useHistoryStore((state) => state.addEntry);
  const [isCopied, setIsCopied] = useState(false);

  // Form State
  const defaultRegion = locationName || user?.location || 'Namakkal, Tamil Nadu';
  const [cropType, setCropType] = useState<string>(appData.fertilizerForm?.cropType || 'Tomato');
  const [soilType, setSoilType] = useState<string>(appData.fertilizerForm?.soilType || 'Clay Soil');
  const [farmRegion, setFarmRegion] = useState<string>(appData.fertilizerForm?.location || defaultRegion);
  const [nitrogenVal, setNitrogenVal] = useState<string>(appData.fertilizerForm?.n || '');
  const [phosphorusVal, setPhosphorusVal] = useState<string>(appData.fertilizerForm?.p || '');
  const [potassiumVal, setPotassiumVal] = useState<string>(appData.fertilizerForm?.k || '');

  const popularCrops = ['Tomato', 'Paddy / Rice', 'Wheat', 'Maize', 'Cotton', 'Potato'];
  const soilTypes = ['Clay Soil', 'Loamy Soil', 'Sandy Soil', 'Black Soil', 'Red Soil', 'Alluvial Soil'];

  useEffect(() => {
    if (locationName && (!farmRegion || farmRegion === 'Namakkal, Tamil Nadu')) {
      setFarmRegion(locationName);
    }
  }, [locationName, farmRegion]);

  const resetForm = () => {
    updateModuleData('fertilizer', null);
    updateModuleData('fertilizerError', null);
    setCropType('Tomato');
    setSoilType('Clay Soil');
    setNitrogenVal('');
    setPhosphorusVal('');
    setPotassiumVal('');
  };

  const handleSelectCrop = (crop: string) => {
    setCropType(crop);
    updateModuleData('fertilizerForm', { ...appData.fertilizerForm, cropType: crop });
  };

  const handleSelectSoil = (soil: string) => {
    setSoilType(soil);
    updateModuleData('fertilizerForm', { ...appData.fertilizerForm, soilType: soil });
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (appData.fertilizerLoading) return;

    if (!cropType || !soilType) {
      updateModuleData('fertilizerError', 'Please select a crop and soil type.');
      return;
    }

    updateModuleData('fertilizerLoading', true);
    updateModuleData('fertilizerError', null);

    try {
      const plan: FertilizerPlan = await agricultureService.recommendFertilizer({
        cropType,
        soilType,
        location: farmRegion || defaultRegion,
        n: nitrogenVal,
        p: phosphorusVal,
        k: potassiumVal,
      });

      updateModuleData('fertilizer', plan);
      addEntry({
        id: Date.now(),
        module: 'fertilizer',
        input: { cropType, soilType, location: farmRegion, n: nitrogenVal, p: phosphorusVal, k: potassiumVal },
        output: plan,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Fertilizer calculation error:', err);
      updateModuleData('fertilizerError', err.message || 'Failed to calculate fertilizer dosing.');
    } finally {
      updateModuleData('fertilizerLoading', false);
    }
  };

  const normalizePlan = (raw: any): FertilizerPlan | null => {
    if (!raw || typeof raw !== 'object') return null;
    const crop = (raw.crop || raw.cropType || cropType || 'Tomato').toString();
    const soil = (raw.soilType || soilType || 'Clay Soil').toString();
    const region = (raw.region || raw.location || farmRegion || defaultRegion || 'Namakkal, Tamil Nadu').toString();
    
    const schedule = Array.isArray(raw.schedule) && raw.schedule.length > 0 ? raw.schedule : [
      {
        stage: 'Before planting / Basal',
        guidance: raw.instructions || 'Apply well-decomposed FYM (10-12 t/ha) and basal phosphorus/potassium.',
        purpose: raw.reason || 'Improves soil organic structure and early root anchoring.'
      },
      {
        stage: 'Vegetative stage (30 DAS)',
        guidance: `Apply top-dressing nitrogen for ${crop}.`,
        purpose: 'Promotes vigorous leaf canopy and vegetative biomass.'
      },
      {
        stage: 'Flowering & Fruit Setting',
        guidance: 'Split dose of potassium and micronutrient foliar spray as recommended.',
        purpose: 'Enhances flowering, prevents blossom drop, and boosts fruit weight.'
      }
    ];

    const rawNutrients = (raw.nutrientGuide && typeof raw.nutrientGuide === 'object') ? raw.nutrientGuide : {};
    const nutrientGuide = {
      nitrogen: rawNutrients.nitrogen || (raw.n ? `${raw.n} kg/ha for vegetative vigor.` : 'Supports leaves, vegetative stems and canopy vigor.'),
      phosphorus: rawNutrients.phosphorus || (raw.p ? `${raw.p} kg/ha for root development.` : 'Essential for root expansion and robust floral initiation.'),
      potassium: rawNutrients.potassium || (raw.k ? `${raw.k} kg/ha for stress tolerance.` : 'Regulates stomatal water balance and fruit firmness.')
    };

    const rawAdvice = (raw.soilAdvice && typeof raw.soilAdvice === 'object') ? raw.soilAdvice : {};
    const soilAdvice = {
      title: rawAdvice.title || `Important advice for ${(soil || 'soil').toLowerCase()}`,
      points: Array.isArray(rawAdvice.points) && rawAdvice.points.length > 0 ? rawAdvice.points : [
        'Ensure good drainage; avoid waterlogging in root zones.',
        'Apply fertilizer in split doses to minimize leaching loss.',
        'Conduct a laboratory soil test before heavy chemical application.'
      ],
      officialGuideNote: rawAdvice.officialGuideNote || 'Follow ICAR / State Agricultural University (TNAU) package of practices.',
      calculatorNote: rawAdvice.calculatorNote || 'Soil-test-based nutrient management is recommended over universal NPK ratios.'
    };

    const overviewSummary = raw.overviewSummary || raw.reason || `Based on University agronomy guidance, ${crop} grown on ${soil} benefits from split nutrient dosing to ensure steady uptake and prevent nutrient leaching.`;
    const imageUrl = raw.imageUrl || getCropImage(crop);

    return {
      crop,
      soilType: soil,
      region,
      soilNutrientsNote: raw.soilNutrientsNote || 'Agronomic estimation',
      overviewSummary,
      imageUrl,
      schedule,
      nutrientGuide,
      soilAdvice
    };
  };

  const plan: FertilizerPlan | null = normalizePlan(appData.fertilizer);

  // ChatGPT-style word-by-word streaming for fertilizer overview
  const [streamedOverview, setStreamedOverview] = useState<string>('');
  const [isOverviewStreaming, setIsOverviewStreaming] = useState<boolean>(false);
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (plan?.overviewSummary) {
      const fullText = plan.overviewSummary;
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
  }, [plan?.overviewSummary]);

  return (
    <div className="w-full max-w-7xl mx-auto h-[calc(100vh-105px)] max-h-[calc(100vh-105px)] flex flex-col space-y-2.5 overflow-hidden">
      
      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-0 overflow-hidden">
        
        {/* LEFT COLUMN: PARAMETERS & SELECTION */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 overflow-y-auto no-scrollbar agri-card p-4 space-y-3">
          
          {/* Header Card */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#278b50]/20 border border-[#278b50]/40 flex items-center justify-center text-[#4ade80]">
                <FlaskConical size={18} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-normal">
                  Fertilizer Dosage & Guide
                </h3>
                <p className="text-xs text-stone-300">
                  Nutrient Schedules & Formulations
                </p>
              </div>
            </div>

            {plan && (
              <button
                type="button"
                onClick={resetForm}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Quick Presets Strip */}
          <div className="space-y-1.5 shrink-0">
            <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider block">
              Popular Crops:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {popularCrops.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleSelectCrop(c)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
                    (cropType || '').toLowerCase() === (c || '').toLowerCase()
                      ? 'bg-[#278b50] text-white border-[#278b50]'
                      : 'bg-black/30 hover:bg-black/50 text-stone-300 hover:text-white border-white/10'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Form Inputs Container */}
          <div className="flex-1 min-h-0 flex flex-col justify-between space-y-3">
            
            <div className="space-y-2.5">
              {/* Crop & Soil Type row */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="agri-in flex flex-col justify-between p-2.5 rounded-2xl bg-black/30 border border-white/10 focus-within:border-[#278b50] transition-colors">
                  <label className="text-xs font-bold text-stone-200 block">Target Crop</label>
                  <select
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="w-full bg-transparent border-none text-white text-xs sm:text-sm font-bold focus:outline-none cursor-pointer my-1.5 [&>option]:bg-[#242824] [&>option]:text-white"
                  >
                    <option value="Tomato">Tomato</option>
                    <option value="Paddy / Rice">Paddy / Rice</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Maize">Maize</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Potato">Potato</option>
                    <option value="Sugarcane">Sugarcane</option>
                    <option value="Groundnut">Groundnut</option>
                    <option value="Pulses">Pulses / Gram</option>
                  </select>
                  <span className="text-[11px] font-medium text-stone-300 block">Crop Variety</span>
                </div>

                <div className="agri-in flex flex-col justify-between p-2.5 rounded-2xl bg-black/30 border border-white/10 focus-within:border-[#278b50] transition-colors">
                  <label className="text-xs font-bold text-stone-200 block">Soil Structure</label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="w-full bg-transparent border-none text-white text-xs sm:text-sm font-bold focus:outline-none cursor-pointer my-1.5 [&>option]:bg-[#242824] [&>option]:text-white"
                  >
                    {soilTypes.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  <span className="text-[11px] font-medium text-stone-300 block">Field Texture</span>
                </div>
              </div>

              {/* Farm Region / District */}
              <div className="agri-in flex flex-col justify-between p-2.5 rounded-2xl bg-black/30 border border-white/10 focus-within:border-[#278b50] transition-colors">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-200 block">Farm Region / District</label>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <MapPin size={10} />
                    <span>Auto-Linked</span>
                  </span>
                </div>
                <input
                  type="text"
                  value={farmRegion}
                  onChange={(e) => setFarmRegion(e.target.value)}
                  placeholder="e.g. Namakkal, Tamil Nadu"
                  className="w-full bg-transparent border-none text-white text-xs sm:text-sm font-bold focus:outline-none my-1.5 placeholder-stone-500"
                />
                <span className="text-[11px] font-medium text-stone-300 block">Agro-Climatic Zone</span>
              </div>

              {/* Optional Measured NPK Fields */}
              <div className="p-3 rounded-2xl bg-black/25 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-200">
                    Soil Nutrients (kg/ha)
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    Optional / Auto
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-xl bg-black/30 border border-white/10">
                    <span className="text-[10px] font-bold text-stone-300 block">Nitrogen (N)</span>
                    <input
                      type="text"
                      placeholder="Auto"
                      value={nitrogenVal}
                      onChange={(e) => setNitrogenVal(e.target.value)}
                      className="w-full bg-transparent border-none text-white font-bold text-xs sm:text-sm focus:outline-none placeholder-stone-500 my-0.5"
                    />
                  </div>

                  <div className="p-2 rounded-xl bg-black/30 border border-white/10">
                    <span className="text-[10px] font-bold text-stone-300 block">Phosphorus (P)</span>
                    <input
                      type="text"
                      placeholder="Auto"
                      value={phosphorusVal}
                      onChange={(e) => setPhosphorusVal(e.target.value)}
                      className="w-full bg-transparent border-none text-white font-bold text-xs sm:text-sm focus:outline-none placeholder-stone-500 my-0.5"
                    />
                  </div>

                  <div className="p-2 rounded-xl bg-black/30 border border-white/10">
                    <span className="text-[10px] font-bold text-stone-300 block">Potassium (K)</span>
                    <input
                      type="text"
                      placeholder="Auto"
                      value={potassiumVal}
                      onChange={(e) => setPotassiumVal(e.target.value)}
                      className="w-full bg-transparent border-none text-white font-bold text-xs sm:text-sm focus:outline-none placeholder-stone-500 my-0.5"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Error notice if any */}
            {appData.fertilizerError && (
              <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-xs">
                <AlertCircle size={15} />
                <span>{appData.fertilizerError}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <div className="shrink-0 pt-1">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={appData.fertilizerLoading}
                className="w-full bg-[#278b50] hover:bg-[#1f7a44] text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-[#278b50]/25 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-50"
              >
                {appData.fertilizerLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    <span>Calculating Fertilizer Schedule...</span>
                  </div>
                ) : (
                  <>
                    <Sparkles size={18} className="text-[#a7f3d0]" />
                    <span>Calculate Fertilizer Dosage</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: AI FERTILIZER ADVISORY (MATCHING SCREENSHOTS) */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-0 overflow-hidden">
          
          {appData.fertilizerLoading ? (
            <FertilizerScheduleSkeleton />
          ) : plan ? (
            <div className="agri-card p-4 sm:p-5 flex flex-col h-full min-h-0 space-y-3.5 overflow-hidden border-[#278b50]/30 shadow-2xl bg-[#182018]">
              
              {/* TOP ACTION BAR */}
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#278b50]/20 border border-[#278b50]/40 flex items-center justify-center text-[#4ade80]">
                    <Sparkles size={15} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      ChatGPT Fertilizer Advisory
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
                      const text = `${plan.crop || 'Crop'} Fertilizer Guide\n${plan.crop || 'Crop'} — ${plan.soilType || 'Soil'}\nRegion: ${plan.region || 'Region'}\n${plan.overviewSummary || ''}\n\n1. Recommended fertilizer schedule:\n${(plan.schedule || []).map(s => `${s.stage}: ${s.guidance} (${s.purpose})`).join('\n')}\n\n2. Nutrient guide:\nN: ${plan.nutrientGuide?.nitrogen || ''}\nP: ${plan.nutrientGuide?.phosphorus || ''}\nK: ${plan.nutrientGuide?.potassium || ''}\n\n3. ${plan.soilAdvice?.title || 'Soil Advice'}:\n${(plan.soilAdvice?.points || []).join('\n')}`;
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
                    onClick={resetForm}
                    title="New Calculation"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={13} />
                    <span className="text-[11px] hidden sm:inline">New</span>
                  </button>
                </div>
              </div>

              {/* SCROLLABLE FERTILIZER ADVISORY (PIXEL-PERFECT MATCH TO SCREENSHOTS) */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 no-scrollbar text-stone-200">
                
                {/* SECTION HEADING */}
                <h2 className="text-base sm:text-lg font-bold text-white tracking-normal">
                  {plan.crop || 'Crop'} Fertilizer Guide
                </h2>

                {/* HERO CARD: CROP IMAGE ON LEFT + OVERVIEW ON RIGHT */}
                <div className="rounded-2xl bg-black/30 border border-white/10 p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-start">
                  <div className="w-full sm:w-44 h-44 rounded-2xl overflow-hidden shrink-0 border border-white/15 shadow-md bg-stone-900 relative">
                    {!isImageLoaded && (
                      <div className="absolute inset-0 bg-stone-800 animate-pulse flex flex-col items-center justify-center gap-1.5">
                        <FlaskConical size={24} className="text-emerald-500/50 animate-bounce" />
                        <span className="text-[10px] text-stone-500 font-medium">AI Formulation Preview...</span>
                      </div>
                    )}
                    <img 
                      src={plan.imageUrl || getCropImage(plan.crop)} 
                      alt={plan.crop || 'Crop'}
                      onLoad={() => setIsImageLoaded(true)}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2 text-xs sm:text-sm leading-relaxed">
                    <h3 className="text-sm sm:text-base font-extrabold text-white">
                      {plan.crop || 'Crop'} — {plan.soilType || 'Soil'}
                    </h3>
                    
                    <div className="space-y-0.5 text-xs text-stone-300">
                      <div>
                        <span className="text-stone-400">Region: </span>
                        <span className="text-white font-medium">{plan.region}</span>
                      </div>
                      <div>
                        <span className="text-stone-400">Soil nutrients: </span>
                        <span className="text-white font-medium">{plan.soilNutrientsNote}</span>
                      </div>
                    </div>

                    <p className="text-stone-300 text-xs sm:text-sm leading-relaxed pt-1">
                      {streamedOverview || plan.overviewSummary}
                      {isOverviewStreaming && (
                        <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-400 animate-pulse align-middle rounded-xs" />
                      )}
                    </p>
                  </div>
                </div>

                {/* 1. RECOMMENDED FERTILIZER SCHEDULE (SCREENSHOT 2) */}
                <div className="space-y-2.5 pt-1">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-normal">
                    1. Recommended fertilizer schedule
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] text-stone-300 leading-normal">
                    <p className="flex-1">
                      The following is a general reference based on State Agricultural University (TNAU / ICAR) guidance for {((plan.crop || cropType || 'crop') as string).toLowerCase()}. It is not a soil-test-specific prescription.
                    </p>
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-stone-300 font-mono shrink-0">
                      Agritech Extension
                    </span>
                  </div>

                  {/* Schedule Table */}
                  <div className="rounded-2xl bg-black/30 border border-white/10 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-stone-400 font-semibold bg-white/[0.02]">
                          <th className="py-2.5 px-3 w-1/4">Growth stage</th>
                          <th className="py-2.5 px-3 w-1/2">Fertilizer guidance</th>
                          <th className="py-2.5 px-3 w-1/4">Purpose</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(plan.schedule || []).map((item, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-stone-200 align-top">
                              {item.stage}
                            </td>
                            <td className="py-2.5 px-3 text-stone-300 align-top leading-relaxed">
                              {item.guidance}
                            </td>
                            <td className="py-2.5 px-3 text-stone-400 align-top leading-relaxed">
                              {item.purpose}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. NUTRIENT GUIDE (SCREENSHOT 2 & 3) */}
                <div className="space-y-2.5 pt-1">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-normal">
                    2. Nutrient guide
                  </h3>

                  <div className="space-y-2">
                    {/* Nitrogen (N) */}
                    <div className="p-3 rounded-2xl bg-black/30 border border-white/10 flex items-start gap-3 shadow-sm">
                      <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-[#4ade80] flex items-center justify-center shrink-0 mt-0.5">
                        <Leaf size={16} />
                      </div>
                      <div>
                        <b className="text-xs sm:text-sm font-bold text-white block">Nitrogen (N)</b>
                        <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">
                          {plan.nutrientGuide?.nitrogen}
                        </p>
                      </div>
                    </div>

                    {/* Phosphorus (P) */}
                    <div className="p-3 rounded-2xl bg-black/30 border border-amber-800/40 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-800/40 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Sprout size={16} />
                      </div>
                      <div>
                        <b className="text-xs sm:text-sm font-bold text-white block">Phosphorus (P)</b>
                        <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">
                          {plan.nutrientGuide?.phosphorus}
                        </p>
                      </div>
                    </div>

                    {/* Potassium (K) */}
                    <div className="p-3 rounded-2xl bg-black/30 border border-white/10 flex items-start gap-3 shadow-sm">
                      <div className="w-8 h-8 rounded-xl bg-blue-950/60 border border-blue-800/40 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Layers size={16} />
                      </div>
                      <div>
                        <b className="text-xs sm:text-sm font-bold text-white block">Potassium (K)</b>
                        <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">
                          {plan.nutrientGuide?.potassium}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. IMPORTANT ADVICE FOR SOIL TYPE (SCREENSHOT 3) */}
                <div className="space-y-2.5 pt-1">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-normal">
                    3. {plan.soilAdvice?.title || 'Soil Advice'}
                  </h3>

                  <div className="rounded-2xl bg-black/30 border border-white/10 p-4 shadow-sm space-y-3">
                    <ul className="space-y-2 text-xs sm:text-sm text-stone-300 leading-relaxed">
                      {(plan.soilAdvice?.points || []).map((pt, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2">
                          <span className="text-[#4ade80] font-bold text-sm shrink-0 leading-none mt-1">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.soilAdvice.officialGuideNote && (
                      <div className="pt-2 border-t border-white/5 text-xs text-stone-300 flex items-center gap-1.5">
                        <span>{plan.soilAdvice.officialGuideNote}</span>
                        <ExternalLink size={12} className="text-[#4ade80]" />
                      </div>
                    )}

                    {plan.soilAdvice.calculatorNote && (
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-stone-300 leading-relaxed">
                        <b className="text-white">For your fertilizer calculator: </b>
                        {plan.soilAdvice.calculatorNote.replace(/^For your fertilizer calculator:\s*/i, '')}
                      </div>
                    )}
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
                <FlaskConical size={32} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-normal">Ready for Fertilizer Formulation</h3>
                <p className="text-xs sm:text-sm text-stone-300 max-w-sm leading-relaxed font-medium">
                  Select your crop and soil type on the left to receive a precise nutrient formula, split application schedule, and university agronomic advice.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                <span className="px-3 py-1.5 bg-[#1a231a] rounded-xl border border-white/10 text-stone-200 font-semibold flex items-center gap-1.5 shadow-sm">
                  <FlaskConical size={13} className="text-[#4ade80]" /> Stage-by-Stage Dosing
                </span>
                <span className="px-3 py-1.5 bg-[#1a231a] rounded-xl border border-white/10 text-stone-200 font-semibold flex items-center gap-1.5 shadow-sm">
                  <Sparkles size={13} className="text-[#4ade80]" /> TNAU / ICAR Aligned
                </span>
                <span className="px-3 py-1.5 bg-[#1a231a] rounded-xl border border-white/10 text-stone-200 font-semibold flex items-center gap-1.5 shadow-sm">
                  <Leaf size={13} className="text-[#4ade80]" /> Nutrient Leaching Prevention
                </span>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
