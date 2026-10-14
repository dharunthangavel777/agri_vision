import React from 'react';
import { User, MapPin, RefreshCw } from 'lucide-react';
import { useAuth } from '../../core/context/AuthContext.tsx';
import { useUIStore } from '../stores/uiStore.ts';
import { useLocation } from '../hooks/useLocation.ts';
import { useLocationStore } from '../stores/locationStore.ts';

interface TopHeaderProps {
  onOpenLogModal?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = () => {
  const { user } = useAuth();
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const setShowHistory = useUIStore((state) => state.setShowHistory);
  const { location, locationName, loading, refresh } = useLocation();

  return (
    <header className="agri-top w-full">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Identity & Real Device Farm Location */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div 
            onClick={() => { setShowHistory(false); setActiveTab('home'); }}
            className="agri-brand cursor-pointer select-none shrink-0"
          >
            <svg width="40" height="36" viewBox="0 0 44 40" className="shrink-0">
              <path d="M2 6c14-2 22 4 22 20 0 4-1 7-2 9C10 34 2 24 2 6z" fill="#278b50" />
              <path d="M42 4C28 4 20 12 20 28c0 3 0 5 1 8 14 0 22-10 21-32z" fill="#33975c" />
            </svg>
            <span>AgriVision</span>
          </div>

          {/* Near AgriVision: Real-Time Location Name For All Features */}
          <div 
            onClick={() => useLocationStore.getState().setIsModalOpen(true)}
            title={loading ? "Acquiring real device GPS..." : `Active Farm Location: ${locationName} (Click to change or re-detect GPS)`}
            className="flex items-center gap-2 bg-[#172417]/90 hover:bg-[#1f301f] border border-[#278b50]/40 hover:border-[#278b50] px-3 py-1.5 rounded-full cursor-pointer transition-all shadow-sm group select-none max-w-[170px] sm:max-w-xs md:max-w-sm"
          >
            <div className="relative flex items-center justify-center shrink-0">
              <span className="relative flex h-2 w-2 mr-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
              </span>
              <MapPin size={14} className="text-[#4ade80] group-hover:scale-110 transition-transform" />
            </div>

            <div className="flex flex-col min-w-0 overflow-hidden text-left">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#4ade80] leading-none flex items-center gap-1.5">
                <span>Farm Location</span>
                {location?.source === 'gps' && (
                  <span className="text-[8px] bg-[#278b50]/30 text-emerald-300 px-1 py-0.2 rounded font-black">GPS</span>
                )}
              </span>
              {loading ? (
                <div className="agri-shimmer h-3 w-28 rounded bg-white/10 mt-1" />
              ) : (
                <span className="text-xs font-semibold text-stone-100 group-hover:text-white truncate leading-tight mt-0.5">
                  {locationName}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                refresh();
              }}
              title="Re-detect GPS"
              className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer ml-0.5"
            >
              <RefreshCw 
                size={12} 
                className={`text-stone-400 group-hover:text-emerald-400 transition-colors ${loading ? 'animate-spin text-emerald-400' : ''}`} 
              />
            </button>
          </div>
        </div>

        {/* Control Actions - Only Profile */}
        <div className="agri-ctl">
          <button 
            onClick={() => { setShowHistory(false); setActiveTab('profile'); }}
            className="agri-circ av" 
            aria-label="User Profile"
            title={user?.name || 'User Profile'}
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.name || 'User'} className="w-full h-full object-cover rounded-full" />
            ) : user?.name ? (
              <span>{user.name.charAt(0).toUpperCase()}</span>
            ) : (
              <User size={18} />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
