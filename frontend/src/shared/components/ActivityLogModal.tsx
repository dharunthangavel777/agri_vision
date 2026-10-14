import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogged: (msg: string) => void;
}

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({ isOpen, onClose, onLogged }) => {
  const [type, setType] = useState('Irrigation');
  const [zone, setZone] = useState('Zone C');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onLogged(`Activity logged: ${type} scheduled for ${zone}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#252a26] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 shadow-2xl relative text-stone-200">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-stone-400 hover:text-white"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-white mb-4">Log Farm Activity</h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
              Activity Type
            </label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-[#323732] border border-[rgba(255,255,255,0.08)] rounded-xl px-3.5 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-[#278b50]"
            >
              <option value="Irrigation">Irrigation / Watering</option>
              <option value="Fertilizing">Fertilizer Application</option>
              <option value="Pest Control">Pest Control / Spraying</option>
              <option value="Harvest">Harvesting</option>
              <option value="Soil Testing">Soil & pH Inspection</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
              Target Field / Zone
            </label>
            <select 
              value={zone} 
              onChange={(e) => setZone(e.target.value)}
              className="w-full bg-[#323732] border border-[rgba(255,255,255,0.08)] rounded-xl px-3.5 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-[#278b50]"
            >
              <option value="Zone A">Zone A (Healthy Greens)</option>
              <option value="Zone B">Zone B (Lettuce Sector)</option>
              <option value="Zone C">Zone C (High Priority / Action)</option>
              <option value="Greenhouse 1">Greenhouse 1</option>
              <option value="Entire Farm">Entire Farm</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
              Notes & Observations
            </label>
            <textarea 
              rows={3} 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 25 min drip irrigation applied to correct moisture deficit."
              className="w-full bg-[#323732] border border-[rgba(255,255,255,0.08)] rounded-xl px-3.5 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-[#278b50]"
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              className="w-full bg-[#278b50] hover:bg-[#1f7a44] text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2"
            >
              <Check size={18} />
              <span>Save Activity Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
