import React, { useState } from 'react';
import { ChevronDown, Pencil, Check } from 'lucide-react';
import { useAuth } from '../../core/context/AuthContext.tsx';

interface ContextBarProps {
  currentZone: string;
  onSelectZone: (zone: string) => void;
  onOpenLogModal: () => void;
}

export const ContextBar: React.FC<ContextBarProps> = ({ 
  currentZone, 
  onSelectZone, 
  onOpenLogModal 
}) => {
  const { user } = useAuth();
  const [farmDropdownOpen, setFarmDropdownOpen] = useState(false);
  const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false);

  const farms = [
    user?.location ? `${user.location} Smart Farm` : 'Main Agricultural Plot',
    'North Precision Field',
    'Greenhouse & Polyhouse Complex',
    'South Horticulture Acreage'
  ];

  const [selectedFarm, setSelectedFarm] = useState(farms[0]);

  const zones = [
    { id: 'ALL', label: 'All Plots' },
    { id: '1', label: 'Plot 1 - Cereals & Grains' },
    { id: '2', label: 'Plot 2 - Pulses & Oilseeds' },
    { id: '3', label: 'Plot 3 - Horticulture' },
  ];

  return (
    <section className="agri-bar">
      {/* 4-dot Farm Glyph */}
      <svg width="26" height="26" viewBox="0 0 30 30" className="shrink-0">
        <g fill="#278b50">
          <rect x="2" y="2" width="12" height="12" rx="5" />
          <rect x="16" y="2" width="12" height="12" rx="5" />
          <rect x="2" y="16" width="12" height="12" rx="5" />
          <rect x="16" y="16" width="12" height="12" rx="4" />
        </g>
      </svg>

      <span className="agri-farm">{selectedFarm.split(' ')[0]} Farm</span>

      {/* Farm Location Dropdown */}
      <div className="agri-dd">
        <button 
          type="button"
          onClick={() => {
            setFarmDropdownOpen(!farmDropdownOpen);
            setZoneDropdownOpen(false);
          }}
          className="agri-ddb"
        >
          <span>{selectedFarm}</span>
          <ChevronDown size={15} />
        </button>

        {farmDropdownOpen && (
          <div className="absolute top-9 left-0 min-w-[220px] bg-[#282c28] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-2xl p-1.5 z-50">
            {farms.map((farm) => (
              <div
                key={farm}
                onClick={() => {
                  setSelectedFarm(farm);
                  setFarmDropdownOpen(false);
                }}
                className="flex items-center justify-between px-3 py-2 text-xs rounded-lg hover:bg-[#323732] cursor-pointer text-stone-300 hover:text-white transition-colors"
              >
                <span>{farm}</span>
                {selectedFarm === farm && <Check size={14} className="text-[#278b50]" />}
              </div>
            ))}
          </div>
        )}
      </div>

      <span className="agri-sep" />

      {/* Zone Selector Dropdown */}
      <div className="agri-dd">
        <button 
          type="button"
          onClick={() => {
            setZoneDropdownOpen(!zoneDropdownOpen);
            setFarmDropdownOpen(false);
          }}
          className="agri-ddb"
        >
          <span>{currentZone === 'ALL' ? 'All Plots' : `Plot ${currentZone}`}</span>
          <ChevronDown size={15} />
        </button>

        {zoneDropdownOpen && (
          <div className="absolute top-9 left-0 min-w-[180px] bg-[#282c28] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-2xl p-1.5 z-50">
            {zones.map((zone) => (
              <div
                key={zone.id}
                onClick={() => {
                  onSelectZone(zone.id);
                  setZoneDropdownOpen(false);
                }}
                className="flex items-center justify-between px-3 py-2 text-xs rounded-lg hover:bg-[#323732] cursor-pointer text-stone-300 hover:text-white transition-colors"
              >
                <span>{zone.label}</span>
                {currentZone === zone.id && <Check size={14} className="text-[#278b50]" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Activity Action */}
      <button 
        type="button"
        onClick={onOpenLogModal}
        className="agri-btn-action"
      >
        <Pencil size={15} />
        <span>Log Activity</span>
      </button>
    </section>
  );
};
