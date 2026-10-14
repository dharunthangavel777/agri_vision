import React from 'react';
import { Skeleton, SkeletonCircle, SkeletonText, SkeletonBadge } from './SkeletonBase.tsx';

export const WeatherSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* 1. Main Live Weather Grid (12 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Main Weather Metric Box (7 cols) */}
        <div className="lg:col-span-7 agri-card p-6 flex flex-col justify-between bg-gradient-to-br from-[#1c2c1c] to-[#121c12] border border-white/5 min-h-[340px]">
          <div>
            {/* Location & Live Feed Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <SkeletonCircle size={14} className="bg-[#278b50]/40" />
                <Skeleton className="h-4 w-44 rounded" />
              </div>
              <SkeletonBadge width={80} height={22} className="bg-[#278b50]/20" />
            </div>

            {/* Giant Temperature & Condition */}
            <div className="flex items-baseline gap-4 my-3">
              <Skeleton className="h-14 w-28 rounded-2xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-32 rounded-lg" />
                <Skeleton className="h-3.5 w-48 rounded" />
              </div>
            </div>

            {/* Spray Window Status Badge */}
            <div className="mt-4">
              <SkeletonBadge width={320} height={32} className="bg-emerald-950/40 rounded-xl" />
            </div>
          </div>

          {/* Weather Sensor Grid (3 columns: Wind, Humidity, UV) */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-white/5">
            {[1, 2, 3].map((sensorIdx) => (
              <div key={sensorIdx} className="agri-in text-center py-3 flex flex-col items-center gap-1.5">
                <SkeletonCircle size={20} />
                <Skeleton className="h-2.5 w-16 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-2 w-10 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* AI Agro-Meteorological Advisory (5 cols) */}
        <div className="lg:col-span-5 agri-card p-6 flex flex-col justify-between border border-white/5 min-h-[340px]">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Skeleton className="w-8 h-8 rounded-xl bg-[#278b50]/20" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-3 w-32 rounded" />
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {/* Irrigation Advisory Card */}
              <div className="p-3.5 rounded-xl bg-[#1c241c] border border-white/5 space-y-2">
                <Skeleton className="h-3.5 w-36 rounded" />
                <SkeletonText lines={2} lastLineWidth="75%" />
              </div>

              {/* Pest & Disease Card */}
              <div className="p-3.5 rounded-xl bg-[#1c241c] border border-white/5 space-y-2">
                <Skeleton className="h-3.5 w-32 rounded" />
                <SkeletonText lines={2} lastLineWidth="80%" />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
            <SkeletonCircle size={10} />
            <Skeleton className="h-3 w-52 rounded" />
          </div>
        </div>
      </div>

      {/* 2. 5-Day Agricultural Forecast Skeleton */}
      <div className="agri-card p-5 border border-white/5">
        <Skeleton className="h-4 w-44 rounded mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((dayIdx) => (
            <div
              key={dayIdx}
              className="p-3.5 rounded-xl bg-[#1c241c] border border-white/5 text-center flex flex-col items-center justify-between gap-2.5 min-h-[140px]"
            >
              <Skeleton className="h-3 w-16 rounded" />
              <SkeletonCircle size={28} />
              <Skeleton className="h-5 w-12 rounded" />
              <Skeleton className="h-3 w-14 rounded" />
              <Skeleton className="h-2 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
