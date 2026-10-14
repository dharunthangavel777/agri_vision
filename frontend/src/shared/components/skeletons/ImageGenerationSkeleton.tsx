import React from 'react';
import { Sparkles, Image as ImageIcon } from 'lucide-react';

interface ImageGenerationSkeletonProps {
  aspectRatio?: 'video' | 'square' | 'wide' | 'auto';
  label?: string;
  className?: string;
}

export const ImageGenerationSkeleton: React.FC<ImageGenerationSkeletonProps> = ({
  aspectRatio = 'video',
  label = 'AI is generating and analyzing visual data...',
  className = ''
}) => {
  const aspectClass = 
    aspectRatio === 'video' ? 'aspect-video' :
    aspectRatio === 'square' ? 'aspect-square' :
    aspectRatio === 'wide' ? 'aspect-[21/9]' : 'min-h-[220px]';

  return (
    <div className={`relative w-full ${aspectClass} rounded-2xl bg-stone-900/90 border border-white/10 overflow-hidden flex flex-col items-center justify-center p-6 shadow-2xl ${className}`}>
      {/* Background Animated Shimmer Effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full animate-[shimmer_2s_infinite]"
        style={{
          backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)'
        }}
      />

      {/* Atmospheric Radial Glow */}
      <div className="absolute inset-0 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Central Icon & Status */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-3.5">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-pulse">
            <ImageIcon size={26} className="text-emerald-300" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </span>
        </div>

        <div className="space-y-1.5 max-w-xs">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-emerald-300">
            <Sparkles size={12} className="animate-spin text-emerald-400" />
            <span>ChatGPT Vision Processing</span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-stone-300 animate-pulse">
            {label}
          </p>
        </div>

        {/* Shimmering Progress Bar */}
        <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
          <div className="w-full h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 rounded-full animate-[progress_1.6s_ease-in-out_infinite]" />
        </div>
      </div>

      {/* Bottom Corner Subtle Metadata Skeleton */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[10px] text-stone-500 border-t border-white/5 pt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-ping" />
          Neural model active
        </span>
        <span className="font-mono">512×512 HD</span>
      </div>
    </div>
  );
};
