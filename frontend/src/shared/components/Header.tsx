import React from 'react';
import { User } from 'lucide-react';
import { Logo } from './Logo.tsx';
import { LanguageSelector } from './LanguageSelector.tsx';
import { useAuth } from '../../core/context/AuthContext.tsx';
import { useUIStore } from '../stores/uiStore.ts';
import { cn } from '../utils/cn.ts';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-dark-bg/80 backdrop-blur-md border-b border-dark-border z-40 px-6 flex items-center justify-between">
      <div 
        onClick={() => setActiveTab('home')}
        className="flex items-center space-x-3 group cursor-pointer"
      >
        <Logo size={40} />
        <div className="flex flex-col">
          <h1 className="font-bold text-xl tracking-tight leading-none text-white group-hover:text-brand-green transition-colors">
            Smart Agriculture
          </h1>
          <div className="flex items-center mt-1">
            <span className="text-[10px] font-medium text-stone-500 uppercase tracking-[0.15em]">
              AI Powered Farming Intelligence
            </span>
            {user?.id?.startsWith('demo-user') && (
              <span className="ml-2 text-[8px] font-bold bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-md uppercase tracking-wider border border-amber-500/30">
                Demo Mode
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <LanguageSelector />
        <button 
          onClick={() => setActiveTab('profile')}
          className={cn(
            "w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center border border-dark-border overflow-hidden transition-all",
            activeTab === 'profile' ? "border-emerald-500 ring-2 ring-emerald-500/20" : "hover:border-stone-600"
          )}
          aria-label="Profile"
        >
          {user?.name ? (
            <span className="text-xs font-bold text-emerald-500">{user.name.charAt(0)}</span>
          ) : (
            <User size={18} className="text-stone-400" />
          )}
        </button>
      </div>
    </header>
  );
};
