import React, { useState } from 'react';
import { 
  TrendingUp, 
  RefreshCw, 
  MapPin, 
  Map, 
  Search, 
  AlertCircle, 
  TrendingDown as TrendingDownIcon, 
  TrendingUp as TrendingUpIcon,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { marketService, MarketFilters } from '../services/marketService.ts';
import { agricultureService } from '../../chat/services/aiService.ts';
import { useAppContext } from '../../../core/context/AppContext.tsx';
import { cn } from '../../../shared/utils/cn.ts';

export const PriceTrendsTab: React.FC = () => {
  const { t } = useTranslation();
  const { appData, updateModuleData } = useAppContext();
  const [lastMarketUpdate, setLastMarketUpdate] = useState<Date>(new Date());

  const states = marketService.getStates();
  const districts = marketService.getDistricts(appData.marketFilters.state);

  const fetchMarketData = async (filters = appData.marketFilters) => {
    updateModuleData('marketLoading', true);
    updateModuleData('marketError', null);
    try {
      const data = await marketService.getPrices(filters);
      if (!data || data.length === 0) {
        updateModuleData('market', []);
        updateModuleData('selectedMarketCrop', null);
        updateModuleData('priceTrends', null);
        updateModuleData('marketError', 'No market data available for this selection.');
        return;
      }

      updateModuleData('market', data);
      setLastMarketUpdate(new Date());
      
      const insight = await agricultureService.generateMarketInsights(data);
      updateModuleData('priceTrends', insight);

      if (!appData.selectedMarketCrop || !data.some((item: any) => item.id === appData.selectedMarketCrop.id)) {
        updateModuleData('selectedMarketCrop', data[0]);
      }
    } catch (err: any) {
      console.error("Failed to fetch market data", err);
      updateModuleData('marketError', err.message || "Failed to connect to market price service.");
    } finally {
      updateModuleData('marketLoading', false);
    }
  };

  const handleMarketFilterChange = (newFilters: Partial<MarketFilters>) => {
    const updated = { ...appData.marketFilters, ...newFilters };
    updateModuleData('marketFilters', updated);
    fetchMarketData(updated);
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div className="agri-card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp size={24} className="text-[#278b50]" />
              APMC Mandi Commodity Price Trends
            </h1>
            <p className="text-xs md:text-sm text-stone-300 mt-1">
              Live mandi modal rates, daily arrival volumes, and price forecasts across Indian agricultural markets.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-400">
            <RefreshCw size={12} className={appData.marketLoading ? "animate-spin text-emerald-400" : ""} />
            <span>Updated: {lastMarketUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
            <select 
              value={appData.marketFilters.state}
              onChange={(e) => handleMarketFilterChange({ state: e.target.value, district: 'All Districts' })}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs bg-[#1c241c] border border-white/10 text-white focus:outline-none focus:border-[#278b50] cursor-pointer appearance-none"
            >
              {states.map(s => <option key={s} value={s} className="bg-[#1c241c]">{s}</option>)}
            </select>
          </div>

          <div className="relative">
            <Map className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
            <select 
              value={appData.marketFilters.district}
              onChange={(e) => handleMarketFilterChange({ district: e.target.value })}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs bg-[#1c241c] border border-white/10 text-white focus:outline-none focus:border-[#278b50] cursor-pointer appearance-none"
            >
              {districts.map(d => <option key={d} value={d} className="bg-[#1c241c]">{d}</option>)}
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
            <input 
              type="text" 
              placeholder="Filter crops (e.g. Wheat, Tomato)..." 
              value={appData.marketFilters.commodity}
              onChange={(e) => handleMarketFilterChange({ commodity: e.target.value })}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs bg-[#1c241c] border border-white/10 text-white placeholder-stone-500 focus:outline-none focus:border-[#278b50]"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {appData.marketLoading && (!appData.market || appData.market.length === 0) ? (
        <div className="agri-card p-16 text-center">
          <RefreshCw size={36} className="text-[#278b50] animate-spin mx-auto mb-3" />
          <p className="text-stone-300 text-sm">Fetching live mandi market rates...</p>
        </div>
      ) : appData.marketError ? (
        <div className="agri-card p-12 text-center">
          <AlertCircle size={36} className="text-red-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Market Data Notice</h3>
          <p className="text-stone-400 text-xs max-w-md mx-auto mb-4">{appData.marketError}</p>
          <button 
            type="button"
            onClick={() => fetchMarketData()}
            className="px-5 py-2.5 bg-[#278b50] hover:bg-[#1f7a44] text-white rounded-xl text-xs font-bold transition-all"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Crop List (4 cols) */}
          <div className="lg:col-span-4 agri-card overflow-hidden flex flex-col h-[520px]">
            <div className="p-3.5 border-b border-[rgba(255,255,255,0.06)] bg-[#182018]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Tracked Commodities</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {appData.market && appData.market.length > 0 ? (
                appData.market.map((crop: any) => (
                  <button 
                    key={crop.id} 
                    type="button"
                    onClick={() => updateModuleData('selectedMarketCrop', crop)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      appData.selectedMarketCrop?.id === crop.id 
                        ? 'bg-[#278b50]/20 border-[#278b50] shadow-md shadow-[#278b50]/10' 
                        : 'bg-[#1b221b] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div>
                      <b className="font-bold text-xs text-white block">{crop.commodity}</b>
                      <span className="text-[10px] text-stone-400">{crop.market}</span>
                    </div>

                    <div className="text-right">
                      <b className="text-xs text-white block">₹{crop.modal_price?.toLocaleString()}</b>
                      <span className={`text-[10px] font-bold flex items-center justify-end ${
                        crop.trend >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {crop.trend >= 0 ? <TrendingUpIcon size={10} className="mr-0.5" /> : <TrendingDownIcon size={10} className="mr-0.5" />}
                        {crop.trend >= 0 ? `+${crop.trend}%` : `${crop.trend}%`}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-stone-400 text-xs">
                  No commodities found matching filter.
                </div>
              )}
            </div>
          </div>

          {/* Visualization & Insights (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* 7-Day Line Chart */}
            {appData.selectedMarketCrop && (
              <div className="agri-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {appData.selectedMarketCrop.commodity} Price Trajectory
                    </h3>
                    <p className="text-stone-400 text-xs">7-day price movements (₹ per quintal)</p>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-xl font-bold text-emerald-400">
                      ₹{appData.selectedMarketCrop.modal_price?.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">Current Modal Rate</span>
                  </div>
                </div>

                {appData.selectedMarketCrop.history && appData.selectedMarketCrop.history.length > 0 ? (
                  <div className="h-60 w-full" style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={appData.selectedMarketCrop.history}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#78716c" 
                          fontSize={10} 
                          tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        />
                        <YAxis stroke="#78716c" fontSize={10} domain={['auto', 'auto']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#182018', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          itemStyle={{ color: '#278b50' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#278b50" 
                          strokeWidth={2.5} 
                          dot={{ fill: '#278b50', strokeWidth: 2, r: 4 }} 
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-stone-400">
                    No historical curve available for this crop.
                  </div>
                )}
              </div>
            )}

            {/* AI Market Advice Card */}
            <div className="agri-card agri-ai-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={18} className="text-[#278b50]" />
                <h3 className="text-sm font-bold text-white">AI Market Timing & Selling Strategy</h3>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {appData.priceTrends || "Commodity prices are stable. Demand in regional mandis is steady with favorable profit margins for immediate market release."}
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
