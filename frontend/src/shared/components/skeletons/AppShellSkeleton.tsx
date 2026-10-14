import React from 'react';
import { Skeleton, SkeletonCircle, SkeletonText, SkeletonBadge } from './SkeletonBase.tsx';

export const AppShellSkeleton: React.FC = () => {
  return (
    <div className="agri-shell">
      {/* 1. Left Navigation Rail Skeleton */}
      <div className="agri-rail-wrapper">
        <aside className="agri-rail" aria-hidden="true">
          {/* Brand/Grid Icon Skeleton */}
          <div className="agri-ri">
            <Skeleton className="w-5 h-5 rounded-lg shrink-0" />
            <Skeleton className="agri-ri-label h-4 w-24 rounded" />
          </div>

          {/* Nav Items Skeletons */}
          <div className="agri-rail-mid">
            {[
              'Overview',
              'Crop Advisor',
              'Disease Doctor',
              'Fertilizer Guide',
              'Weather Radar',
              'Activity Diary',
            ].map((label, idx) => (
              <div key={idx} className={`agri-ri ${idx === 0 ? 'on' : ''}`}>
                <Skeleton className="w-5 h-5 rounded-lg shrink-0" />
                <Skeleton className="agri-ri-label h-3.5 w-20 rounded" />
              </div>
            ))}
          </div>

          {/* Bottom Profile Shortcut Skeleton */}
          <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-[rgba(255,255,255,0.06)] w-full">
            <div className="agri-ri">
              <Skeleton className="w-5 h-5 rounded-full shrink-0" />
              <Skeleton className="agri-ri-label h-3.5 w-16 rounded" />
            </div>
          </div>
        </aside>
      </div>

      {/* 2. Main Content Shell */}
      <main className="agri-main">
        {/* Top Header Skeleton */}
        <header className="agri-top w-full">
          <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-3">
            {/* Brand + Location */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="agri-brand shrink-0 flex items-center gap-2">
                <svg width="40" height="36" viewBox="0 0 44 40" className="shrink-0 opacity-80">
                  <path d="M2 6c14-2 22 4 22 20 0 4-1 7-2 9C10 34 2 24 2 6z" fill="#278b50" />
                  <path d="M42 4C28 4 20 12 20 28c0 3 0 5 1 8 14 0 22-10 21-32z" fill="#33975c" />
                </svg>
                <span className="text-white/80 font-bold">AgriVision</span>
              </div>

              {/* Real Location Badge Skeleton */}
              <div className="flex items-center gap-2 bg-[#172417]/80 border border-[#278b50]/30 px-3 py-1.5 rounded-full max-w-xs">
                <SkeletonCircle size={14} className="bg-[#4ade80]/40" />
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-2 w-14 rounded" />
                  <Skeleton className="h-3 w-28 rounded" />
                </div>
              </div>
            </div>

            {/* Profile Avatar Skeleton */}
            <div className="agri-ctl">
              <SkeletonCircle size={40} className="border border-white/10" />
            </div>
          </div>
        </header>

        {/* Dashboard Overview Skeleton Body */}
        <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col justify-center py-6 space-y-7">
          {/* Welcome & Status Hero Skeleton */}
          <div className="agri-card p-6 bg-gradient-to-r from-[#172417] via-[#1c2c1c] to-[#132013] border border-[rgba(255,255,255,0.08)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-3 w-full max-w-xl">
                <div className="flex items-center gap-2">
                  <SkeletonBadge width={160} height={26} />
                  <Skeleton className="h-3.5 w-24 rounded" />
                </div>
                <Skeleton className="h-9 w-72 rounded-lg" />
                <SkeletonText lines={2} lastLineWidth="85%" />
              </div>

              {/* Weather Widget Skeleton */}
              <div className="flex items-center gap-3 bg-[#111911]/80 border border-white/10 p-3.5 rounded-2xl shrink-0 w-52">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-5 w-28 rounded" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Cards Header Skeleton */}
          <div>
            <div className="flex items-center gap-2 mb-3.5">
              <SkeletonCircle size={22} />
              <div className="space-y-1">
                <Skeleton className="h-5 w-56 rounded" />
                <Skeleton className="h-3 w-72 rounded" />
              </div>
            </div>

            {/* 3 Action Cards Skeleton Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map((cardIdx) => (
                <div
                  key={cardIdx}
                  className="agri-card p-5 flex flex-col justify-between bg-gradient-to-b from-[#1b251b] to-[#171f17] border border-white/5 space-y-4"
                >
                  <div className="space-y-3">
                    <Skeleton className="w-20 h-20 rounded-2xl" />
                    <SkeletonBadge width={90} height={20} />
                    <Skeleton className="h-5 w-40 rounded" />
                    <SkeletonText lines={2} lastLineWidth="80%" />
                  </div>
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <Skeleton className="h-4 w-28 rounded" />
                    <SkeletonCircle size={18} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
