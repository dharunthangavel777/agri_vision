import React from 'react';
import { Skeleton, SkeletonCircle, SkeletonText, SkeletonBadge } from './SkeletonBase.tsx';

export const FertilizerScheduleSkeleton: React.FC = () => {
  return (
    <div className="agri-card p-4 sm:p-5 flex flex-col h-full min-h-0 space-y-3.5 overflow-hidden border-[#278b50]/30 shadow-2xl bg-[#182018] animate-fade-in">
      {/* 1. Top Action Bar Skeleton */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <Skeleton className="w-7 h-7 rounded-lg bg-[#278b50]/20" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-44 rounded" />
            <SkeletonBadge width={64} height={18} className="bg-[#278b50]/20" />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <SkeletonCircle size={28} />
          <SkeletonCircle size={28} />
        </div>
      </div>

      {/* 2. Primary Fertilizer Recommendation Hero Banner Skeleton */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#172417] via-[#1c2c1c] to-[#142214] border border-[#278b50]/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <SkeletonBadge width={130} height={20} className="bg-[#278b50]/25" />
            <Skeleton className="h-7 w-52 rounded-lg mt-1" />
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-6 w-20 rounded ml-auto" />
            <Skeleton className="h-2.5 w-16 rounded ml-auto" />
          </div>
        </div>
        <SkeletonText lines={2} lastLineWidth="80%" />
      </div>

      {/* 3. N-P-K Soil Deficit vs Target Nutrients Bar Skeleton */}
      <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-2.5 w-24 rounded" />
        </div>

        <div className="space-y-2">
          {/* Nitrogen bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <Skeleton className="h-2.5 w-20 rounded" />
              <Skeleton className="h-2.5 w-14 rounded" />
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="agri-shimmer h-full w-3/4 rounded-full bg-[#4ade80]/30" />
            </div>
          </div>

          {/* Phosphorus bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <Skeleton className="h-2.5 w-24 rounded" />
              <Skeleton className="h-2.5 w-14 rounded" />
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="agri-shimmer h-full w-1/2 rounded-full bg-[#f2b51b]/30" />
            </div>
          </div>

          {/* Potassium bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <Skeleton className="h-2.5 w-20 rounded" />
              <Skeleton className="h-2.5 w-14 rounded" />
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="agri-shimmer h-full w-2/3 rounded-full bg-[#60a5fa]/30" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Split Schedule Timeline Cards Skeleton */}
      <div className="space-y-2 flex-1 min-h-0 overflow-hidden">
        <Skeleton className="h-3 w-44 rounded" />
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-[#1c241c] border border-white/5 space-y-1.5">
            <Skeleton className="h-2.5 w-20 rounded" />
            <Skeleton className="h-3.5 w-28 rounded" />
            <Skeleton className="h-2 w-full rounded" />
          </div>

          <div className="p-2.5 rounded-xl bg-[#1c241c] border border-white/5 space-y-1.5">
            <Skeleton className="h-2.5 w-24 rounded" />
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-2 w-full rounded" />
          </div>
        </div>
      </div>

      {/* 5. Footer Advisory Skeleton */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-stone-400 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-ping" />
          <span className="text-emerald-400 font-semibold">TNAU Nutrient Index Sync</span>
        </div>
        <Skeleton className="h-3 w-32 rounded" />
      </div>
    </div>
  );
};
