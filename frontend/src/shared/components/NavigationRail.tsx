import React from 'react';
import { 
  LayoutGrid, 
  House, 
  Leaf, 
  FlaskConical, 
  ScanLine, 
  CloudSun, 
  History, 
  User 
} from 'lucide-react';
import { useUIStore, UIActiveTab } from '../stores/uiStore.ts';

interface NavigationRailProps {}

export const NavigationRail: React.FC<NavigationRailProps> = () => {
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const showHistory = useUIStore((state) => state.showHistory);
  const setShowHistory = useUIStore((state) => state.setShowHistory);

  const navItems: { id: UIActiveTab | 'history'; icon: React.ElementType; label: string }[] = [
    { id: 'home', icon: House, label: 'Overview' },
    { id: 'advisor', icon: Leaf, label: 'Crop Advisor' },
    { id: 'disease', icon: ScanLine, label: 'Disease Doctor' },
    { id: 'fertilizer', icon: FlaskConical, label: 'Fertilizer Guide' },
    { id: 'weather', icon: CloudSun, label: 'Weather Radar' },
    { id: 'history', icon: History, label: 'Activity Diary' },
  ];

  return (
    <div className="agri-rail-wrapper">
      <aside className="agri-rail group" aria-label="Main Navigation">
        {/* Top App Grid / Home Launcher */}
        <button 
          type="button"
          onClick={() => {
            setShowHistory(false);
            setActiveTab('home');
          }}
          className="agri-ri" 
          aria-label="Apps Navigation"
          title="AgriVision System"
        >
          <LayoutGrid size={20} className="shrink-0 text-[#278b50]" />
          <span className="agri-ri-label font-bold text-white">AgriVision Menu</span>
        </button>

        {/* Middle Navigation Cluster */}
        <div className="agri-rail-mid">
          {navItems.map((item) => {
            const isSelected = item.id === 'history' ? showHistory : activeTab === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  if (item.id === 'history') {
                    setShowHistory(true);
                    return;
                  }
                  setShowHistory(false);
                  setActiveTab(item.id as UIActiveTab);
                }}
                className={`agri-ri ${isSelected ? 'on' : ''}`}
                aria-label={item.label}
                title={item.label}
              >
                <item.icon size={20} className="shrink-0" />
                <span className="agri-ri-label">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom Profile Shortcut */}
        <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-[rgba(255,255,255,0.06)] w-full">
          <button 
            type="button"
            onClick={() => {
              setShowHistory(false);
              setActiveTab('profile');
            }} 
            className={`agri-ri ${activeTab === 'profile' ? 'on' : ''}`} 
            aria-label="Profile Settings"
            title="Profile & Settings"
          >
            <User size={20} className="shrink-0" />
            <span className="agri-ri-label">Profile & Settings</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
