import React from 'react';
import { 
  Home, 
  Sprout, 
  FlaskConical, 
  Bug, 
  Store, 
  CloudRain, 
  TrendingUp, 
  BookOpen, 
  History, 
  User 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUIStore, type UIActiveTab } from '../stores/uiStore.ts';
import { cn } from '../utils/cn.ts';

export const Navigation: React.FC = () => {
  const { t } = useTranslation();
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const showHistory = useUIStore((state) => state.showHistory);
  const setShowHistory = useUIStore((state) => state.setShowHistory);

  const navItems = [
    { id: 'home', icon: Home, label: t('common.home') },
    { id: 'advisor', icon: Sprout, label: t('common.advisor') },
    { id: 'fertilizer', icon: FlaskConical, label: t('common.fertilizer') },
    { id: 'disease', icon: Bug, label: t('common.disease') },
    { id: 'weather', icon: CloudRain, label: t('common.weather') },
    { id: 'history', icon: History, label: 'History' },
    { id: 'profile', icon: User, label: t('common.profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-card/90 backdrop-blur-lg border-t border-dark-border z-50 px-2 py-2">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {navItems.map((item) => {
          const isSelected = item.id === 'history' ? showHistory : activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'history') {
                  setShowHistory(true);
                  return;
                }
                setActiveTab(item.id as UIActiveTab);
              }}
              className={cn(
                "flex flex-col items-center p-2 rounded-xl transition-all min-w-[56px]",
                isSelected ? "text-brand-green" : "text-stone-500 hover:text-stone-300"
              )}
            >
              <item.icon
                size={20}
                className={cn(
                  "mb-1 transition-transform",
                  isSelected && "scale-110"
                )}
              />
              <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
