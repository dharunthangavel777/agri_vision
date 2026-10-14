import React from 'react';
import { 
  CloudSun, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext.tsx';
import { useUIStore } from '../../../shared/stores/uiStore.ts';
import { useLocation } from '../../../shared/hooks/useLocation.ts';
import { useWeather } from '../hooks/useAgricultureDashboard.ts';
import diseaseIcon from '../../../../assets/1.png';
import cropAdviceIcon from '../../../../assets/2.png';
import fertilizerIcon from '../../../../assets/3.png';

export const HomeTab: React.FC = () => {
  const { user } = useAuth();
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const { location, locationName } = useLocation();
  const activeCity = location?.city || user?.location || 'Bangalore';
  const { weather, loading: weatherLoading } = useWeather(activeCity, location?.lat, location?.lon);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col justify-center py-6 space-y-7">
      
      {/* ================= 1. WELCOME & STATUS HERO ================= */}
      <div className="agri-card p-6 bg-gradient-to-r from-[#172417] via-[#1c2c1c] to-[#132013] border border-[rgba(255,255,255,0.08)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="agri-pill g text-xs sm:text-sm py-1 px-3.5 font-bold">
                <ShieldCheck size={16} />
                All Systems Healthy
              </span>
              <span className="text-xs sm:text-sm text-stone-300 font-medium">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {getGreeting()}, {user?.name || 'Farmer'}! 👋
            </h1>
            
            <p className="text-sm sm:text-base text-stone-200 mt-2 max-w-2xl leading-relaxed font-medium">
              Your farm is in great condition today. Weather conditions are favorable for crop maintenance and field activities.
            </p>
          </div>

          {/* Quick Location & Weather Pill */}
          {weatherLoading && !weather ? (
            <div className="flex items-center gap-3 bg-[#111911]/80 border border-white/10 p-3.5 rounded-2xl shrink-0 w-52 agri-shimmer">
              <div className="w-12 h-12 rounded-xl bg-white/5 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 bg-white/10 rounded" />
                <div className="h-5 w-28 bg-white/10 rounded" />
              </div>
            </div>
          ) : (
            <div 
              onClick={() => setActiveTab('weather')}
              className="flex items-center gap-3 bg-[#111911]/80 border border-white/10 p-3.5 rounded-2xl cursor-pointer hover:border-[#278b50]/50 transition-all self-start md:self-auto shrink-0 shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-[#278b50]/20 flex items-center justify-center text-[#4ade80]">
                <CloudSun size={26} />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-semibold text-stone-300 truncate max-w-[200px]">{locationName}</div>
                <div className="text-lg sm:text-xl font-bold text-white">
                  {weather?.temp ? `${Math.round(weather.temp)}°C` : '28°C'} • <span className="text-sm sm:text-base font-semibold text-stone-200">{weather?.condition || 'Sunny'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= 3. WHAT WOULD YOU LIKE TO DO TODAY? (PRIMARY ACTION CARDS) ================= */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
              <Sparkles size={20} className="text-[#4ade80]" />
              What would you like to do today?
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-0.5 font-medium">Choose an AI tool to help with your farm decisions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Action 1: Scan Plant Disease */}
          <div 
            onClick={() => setActiveTab('disease')}
            className="agri-card p-5 cursor-pointer hover:border-[#278b50] hover:scale-[1.01] transition-all flex flex-col justify-between group bg-gradient-to-b from-[#1b251b] to-[#171f17]"
          >
            <div>
              <div className="mb-3 flex items-center">
                <img 
                  src={diseaseIcon} 
                  alt="Diagnose Crop Disease" 
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.45)] group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300" 
                />
              </div>
              
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#4ade80] transition-colors">
                Diagnose Crop Disease
              </h3>
              
              <p className="text-xs sm:text-sm text-stone-200 mt-2 leading-relaxed font-medium">
                Notice spots or wilting? Take a quick leaf photo to identify the problem and get safe treatments.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs sm:text-sm font-extrabold text-[#4ade80]">
              <span>Scan Leaf Now</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 2: Crop Sowing Advice */}
          <div 
            onClick={() => setActiveTab('advisor')}
            className="agri-card p-5 cursor-pointer hover:border-[#278b50] hover:scale-[1.01] transition-all flex flex-col justify-between group bg-gradient-to-b from-[#1b251b] to-[#171f17]"
          >
            <div>
              <div className="mb-3 flex items-center">
                <img 
                  src={cropAdviceIcon} 
                  alt="Find Best Crop to Sow" 
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.45)] group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300" 
                />
              </div>
              
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#4ade80] transition-colors">
                Find Best Crop to Sow
              </h3>
              
              <p className="text-xs sm:text-sm text-stone-200 mt-2 leading-relaxed font-medium">
                Enter your soil test values to discover which crops will give the highest yield and profit this season.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs sm:text-sm font-extrabold text-[#4ade80]">
              <span>Get Crop Advice</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 3: Fertilizer Dosage */}
          <div 
            onClick={() => setActiveTab('fertilizer')}
            className="agri-card p-5 cursor-pointer hover:border-[#278b50] hover:scale-[1.01] transition-all flex flex-col justify-between group bg-gradient-to-b from-[#1b251b] to-[#171f17]"
          >
            <div>
              <div className="mb-3 flex items-center">
                <img 
                  src={fertilizerIcon} 
                  alt="Calculate Fertilizer" 
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.45)] group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300" 
                />
              </div>
              
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#4ade80] transition-colors">
                Calculate Fertilizer
              </h3>
              
              <p className="text-xs sm:text-sm text-stone-200 mt-2 leading-relaxed font-medium">
                Avoid over-fertilizing. Calculate the exact dosage of Urea, DAP, or organic compost for your acreage.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs sm:text-sm font-extrabold text-[#4ade80]">
              <span>Calculate Dosage</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
