import React, { useState } from 'react';
import { Search, X, Sprout, Bug, FlaskConical, CloudSun } from 'lucide-react';
import { useUIStore, UIActiveTab } from '../stores/uiStore.ts';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  if (!isOpen) return null;

  const quickActions: { label: string; tab: UIActiveTab; icon: React.ElementType }[] = [
    { label: 'Check Crop Recommendation', tab: 'advisor', icon: Sprout },
    { label: 'Scan Leaf for Diseases', tab: 'disease', icon: Bug },
    { label: 'Calculate Fertilizer Dosing', tab: 'fertilizer', icon: FlaskConical },
    { label: 'Weather Radar & Forecast', tab: 'weather', icon: CloudSun },
  ];

  const handleSelect = (tab: UIActiveTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#252a26] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl p-4 text-stone-200">
        <div className="flex items-center px-3 py-2 border-b border-[rgba(255,255,255,0.08)]">
          <Search size={18} className="text-[#278b50] mr-3" />
          <input 
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search crops, soil types, diseases, fertilizers..."
            autoFocus
            className="flex-1 bg-transparent border-none text-white focus:outline-none text-sm placeholder:text-stone-500"
          />
          <button onClick={onClose} className="text-stone-400 hover:text-white ml-2">
            <X size={18} />
          </button>
        </div>

        <div className="py-3 space-y-1">
          <div className="text-[10px] uppercase font-bold text-stone-500 px-3 pb-1 tracking-wider">
            Quick Navigation
          </div>
          {quickActions.map((action) => (
            <div
              key={action.tab}
              onClick={() => handleSelect(action.tab)}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-[#323732] cursor-pointer text-stone-300 hover:text-white transition-colors text-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-[#278b50]/10 flex items-center justify-center text-[#278b50]">
                <action.icon size={16} />
              </div>
              <span className="font-medium">{action.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
