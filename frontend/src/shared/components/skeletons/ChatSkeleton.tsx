import React from 'react';
import { Bot } from 'lucide-react';
import { Skeleton } from './SkeletonBase.tsx';

export const ChatSkeleton: React.FC = () => {
  return (
    <div className="flex items-start space-x-2 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center shrink-0">
        <Bot size={16} className="text-emerald-400" />
      </div>
      <div className="bg-[#1f261f] border border-white/5 text-stone-200 rounded-2xl rounded-tl-none p-3.5 space-y-2 max-w-[85%] shadow-md">
        <div className="flex items-center space-x-1.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-ping" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Assistant Analyzing...
          </span>
        </div>
        <Skeleton className="h-3 w-48 rounded bg-white/10" />
        <Skeleton className="h-3 w-64 rounded bg-white/10" />
        <Skeleton className="h-3 w-36 rounded bg-white/10" />
      </div>
    </div>
  );
};
