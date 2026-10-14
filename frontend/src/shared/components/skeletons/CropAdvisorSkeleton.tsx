import React from 'react';
import { Skeleton, SkeletonCircle, SkeletonText, SkeletonBadge } from './SkeletonBase.tsx';

export const CropAdvisorSkeleton: React.FC = () => {
  return (
    <div className="agri-card p-4 sm:p-5 flex flex-col h-full min-h-0 space-y-3.5 overflow-hidden border-[#278b50]/30 shadow-2xl bg-[#182018] animate-fade-in">
      {/* 1. Top Action Bar Skeleton */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <Skeleton className="w-7 h-7 rounded-lg bg-[#278b50]/20" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-36 rounded" />
            <SkeletonBadge width={64} height={18} className="bg-[#278b50]/20" />
          </div>
        </div>

        {/* Action button skeletons */}
        <div className="flex items-center gap-1.5">
          <SkeletonCircle size={28} />
          <SkeletonCircle size={28} />
          <SkeletonCircle size={28} />
        </div>
      </div>

      {/* 2. Hero Recommended Crop Banner Skeleton */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1b2b1b] to-[#142014] border border-[#278b50]/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-24 rounded uppercase" />
            <Skeleton className="h-7 w-44 rounded-lg" />
          </div>
          <SkeletonBadge width={110} height={28} className="bg-emerald-900/40 border border-emerald-500/30" />
        </div>
        <SkeletonText lines={2} lastLineWidth="85%" />
      </div>

      {/* 3. Agro-Economic Matrix Grid Skeleton (2x2) */}
      <div className="grid grid-cols-2 gap-2.5 shrink-0">
        {[
          { title: 'Expected Yield', value: '3.8 Tons / Acre' },
          { title: 'Growth Duration', value: '110-120 Days' },
          { title: 'Water Requirement', value: 'Medium (Drip)' },
          { title: 'Soil Compatibility', value: '98% Optimal' },
        ].map((_, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
            <Skeleton className="h-2.5 w-20 rounded" />
            <Skeleton className="h-4 w-28 rounded" />
          </div>
        ))}
      </div>

      {/* 4. Agronomic Protocol Steps Skeleton */}
      <div className="space-y-2 flex-1 min-h-0 overflow-hidden">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-36 rounded" />
          <Skeleton className="h-2.5 w-16 rounded" />
        </div>

        <div className="space-y-2">
          {[1, 2, 3].map((stepIdx) => (
            <div key={stepIdx} className="p-2.5 rounded-xl bg-[#1c241c] border border-white/5 flex items-start gap-2.5">
              <SkeletonCircle size={20} className="bg-[#278b50]/30" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3 w-32 rounded" />
                <Skeleton className="h-2.5 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Footer Sync Pill Skeleton */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-stone-400 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-ping" />
          <span className="text-[11px] text-emerald-400 font-semibold">AI Synthesis Active</span>
        </div>
        <Skeleton className="h-3 w-36 rounded" />
      </div>
    </div>
  );
};
