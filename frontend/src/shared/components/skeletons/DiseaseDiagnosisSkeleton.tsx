import React from 'react';
import { Skeleton, SkeletonCircle, SkeletonText, SkeletonBadge } from './SkeletonBase.tsx';

export const DiseaseDiagnosisSkeleton: React.FC = () => {
  return (
    <div className="agri-card p-4 sm:p-5 flex flex-col h-full min-h-0 space-y-3.5 overflow-hidden border-[#278b50]/30 shadow-2xl bg-[#182018] animate-fade-in">
      {/* 1. Top Action Bar Skeleton */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <Skeleton className="w-7 h-7 rounded-lg bg-[#278b50]/20" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-40 rounded" />
            <SkeletonBadge width={60} height={18} className="bg-[#278b50]/20" />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <SkeletonCircle size={28} />
          <SkeletonCircle size={28} />
        </div>
      </div>

      {/* 2. Disease Pathology Hero Banner Skeleton */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#201818] via-[#221c1a] to-[#1a1414] border border-amber-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <SkeletonBadge width={110} height={20} className="bg-amber-500/20" />
            <Skeleton className="h-7 w-48 rounded-lg mt-1" />
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-6 w-16 rounded ml-auto" />
            <Skeleton className="h-2.5 w-20 rounded" />
          </div>
        </div>

        {/* Pathology description lines */}
        <SkeletonText lines={2} lastLineWidth="80%" />
      </div>

      {/* 3. Observed Pathological Symptoms Skeleton */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2 shrink-0">
        <Skeleton className="h-3 w-36 rounded" />
        <div className="flex flex-wrap gap-2">
          <SkeletonBadge width={120} height={24} className="bg-white/5" />
          <SkeletonBadge width={140} height={24} className="bg-white/5" />
          <SkeletonBadge width={100} height={24} className="bg-white/5" />
        </div>
      </div>

      {/* 4. Treatment Protocols Cards Skeleton (Organic + Chemical) */}
      <div className="space-y-2 flex-1 min-h-0 overflow-hidden">
        <Skeleton className="h-3 w-32 rounded" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Organic / Bio-cure */}
          <div className="p-3 rounded-xl bg-[#1c241c] border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <SkeletonCircle size={18} className="bg-emerald-500/30" />
              <Skeleton className="h-3.5 w-28 rounded" />
            </div>
            <SkeletonText lines={2} lastLineWidth="90%" />
          </div>

          {/* Chemical formulation */}
          <div className="p-3 rounded-xl bg-[#241c1c] border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <SkeletonCircle size={18} className="bg-amber-500/30" />
              <Skeleton className="h-3.5 w-32 rounded" />
            </div>
            <SkeletonText lines={2} lastLineWidth="85%" />
          </div>
        </div>
      </div>

      {/* 5. Footer Telemetry Skeleton */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-stone-400 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-emerald-400 font-semibold">Deep Vision Neural Net</span>
        </div>
        <Skeleton className="h-3 w-32 rounded" />
      </div>
    </div>
  );
};
