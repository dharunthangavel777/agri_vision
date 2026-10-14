import React from 'react';
import { MapPin } from 'lucide-react';
import { Skeleton, SkeletonBadge } from './SkeletonBase.tsx';

export const MapSkeleton: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-[#121812]/80 backdrop-blur-xs flex flex-col items-center justify-center z-1000 p-6 animate-fade-in pointer-events-none">
      <div className="agri-card p-5 max-w-sm w-full bg-[#172217]/95 border border-[#278b50]/40 shadow-2xl space-y-3.5 text-center flex flex-col items-center">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-[#278b50]/20 border border-[#278b50]/40 flex items-center justify-center">
            <MapPin size={24} className="text-[#4ade80] animate-bounce" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
        </div>

        <div className="space-y-1">
          <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
            <span>Satellite GIS Telemetry</span>
            <span className="text-[9px] bg-[#278b50]/30 text-emerald-300 px-1 py-0.2 rounded font-mono">GPS</span>
          </div>
          <p className="text-[11px] text-stone-300">Acquiring high-resolution farm boundary coordinates...</p>
        </div>

        {/* Shimmer coordinate bars */}
        <div className="w-full space-y-1.5 pt-1">
          <Skeleton className="h-3 w-full rounded bg-white/10" />
          <Skeleton className="h-2.5 w-4/5 mx-auto rounded bg-white/10" />
        </div>

        <SkeletonBadge width={140} height={22} className="bg-emerald-950/40 border border-emerald-500/20" />
      </div>
    </div>
  );
};
